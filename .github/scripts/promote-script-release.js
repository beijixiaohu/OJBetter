const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const directories = {
  dev: 'script/dev',
  release: 'script/release'
};

const tagPattern = /^([a-z0-9-]+)-v(\d+(?:\.\d+)+)$/;
const versionPattern = /^(\/\/\s*@version\s+)(\S+)(.*)$/m;
const quietHoursUtcByScript = {
  // Codeforces contests are most commonly held at 14:35 UTC and last about 2 hours.
  'codeforces-better': [14, 15, 16, 17],
  // AtCoder ABC/ARC/AGC commonly start at 12:00 UTC; AHC is often earlier and longer.
  'atcoder-better': [10, 11, 12, 13, 14]
};

function runGit(args) {
  return childProcess.execFileSync('git', args, {
    encoding: 'utf8',
    maxBuffer: 100 * 1024 * 1024
  });
}

function getScriptVersion(content) {
  return content.match(versionPattern)?.[2] || null;
}

function setScriptVersion(content, version) {
  if (!versionPattern.test(content)) {
    throw new Error('Unable to find userscript @version metadata.');
  }

  return content.replace(versionPattern, `$1${version}$3`);
}

function parseVersion(version) {
  const parts = version.split('.').map((part) => Number(part));
  if (parts.some((part) => !Number.isInteger(part) || part < 0)) return null;
  return parts;
}

function compareVersions(versionA, versionB) {
  const partsA = parseVersion(versionA);
  const partsB = parseVersion(versionB);
  if (!partsA || !partsB) return null;

  const length = Math.max(partsA.length, partsB.length);
  for (let index = 0; index < length; index += 1) {
    const diff = (partsA[index] || 0) - (partsB[index] || 0);
    if (diff !== 0) return Math.sign(diff);
  }

  return 0;
}

function parseReleaseTag(tagName) {
  const match = tagName.match(tagPattern);
  if (!match) return null;

  return {
    scriptName: match[1],
    version: match[2]
  };
}

async function githubApi(endpoint) {
  const repository = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;

  if (!repository) throw new Error('GITHUB_REPOSITORY is not set.');

  const response = await fetch(`https://api.github.com/repos/${repository}${endpoint}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function getReleaseByTag(tagName) {
  return githubApi(`/releases/tags/${encodeURIComponent(tagName)}`);
}

async function listReleases() {
  const releases = [];

  for (let page = 1; ; page += 1) {
    const batch = await githubApi(`/releases?per_page=100&page=${page}`);
    releases.push(...batch);
    if (batch.length < 100) break;
  }

  return releases;
}

function getFileVersion(filePath) {
  if (!fs.existsSync(filePath)) return null;

  return getScriptVersion(fs.readFileSync(filePath, 'utf8'));
}

function collectVersions() {
  const versions = {};

  Object.keys(directories).forEach((key) => {
    const dirPath = directories[key];
    const files = fs.readdirSync(dirPath).sort();

    files.forEach((file) => {
      if (path.extname(file) !== '.js') return;

      const content = fs.readFileSync(path.join(dirPath, file), 'utf8');
      const version = getScriptVersion(content);
      if (!version) return;

      const name = file.replace('.user.js', '').replace(/\s+/g, '');
      if (!versions[name]) versions[name] = {};
      versions[name][key] = version;
    });
  });

  return versions;
}

function isOldEnough(release, minAgeHours) {
  if (minAgeHours <= 0) return true;
  if (!release.published_at) return false;

  const publishedAt = new Date(release.published_at).getTime();
  const ageMs = Date.now() - publishedAt;
  return ageMs >= minAgeHours * 60 * 60 * 1000;
}

function getCurrentUtcHour() {
  const hour = process.env.CURRENT_UTC_HOUR;
  if (hour === undefined || hour === '') return new Date().getUTCHours();

  const parsedHour = Number(hour);
  if (!Number.isInteger(parsedHour) || parsedHour < 0 || parsedHour > 23) {
    throw new Error(`Invalid CURRENT_UTC_HOUR: ${hour}`);
  }

  return parsedHour;
}

function isQuietHour(scriptName, utcHour) {
  return quietHoursUtcByScript[scriptName]?.includes(utcHour) || false;
}

function getScriptAtTag(tagName, scriptName) {
  const devPath = path.join('script', 'dev', `${scriptName}.user.js`);
  return runGit(['show', `${tagName}:${devPath}`]);
}

function chooseCandidate(current, next) {
  if (!current) return next;

  const versionComparison = compareVersions(next.version, current.version);
  if (versionComparison === null) return current;
  if (versionComparison > 0) return next;
  if (versionComparison < 0) return current;

  return new Date(next.release.published_at) > new Date(current.release.published_at)
    ? next
    : current;
}

async function main() {
  const tagName = (process.env.RELEASE_TAG_NAME || '').trim();
  const minAgeHours = Number(process.env.MIN_AGE_HOURS || 24);
  const dryRun = process.env.DRY_RUN === 'true';
  const ignoreQuietHours = process.env.IGNORE_QUIET_HOURS === 'true';
  const currentUtcHour = getCurrentUtcHour();

  if (!Number.isFinite(minAgeHours) || minAgeHours < 0) {
    throw new Error(`Invalid MIN_AGE_HOURS: ${process.env.MIN_AGE_HOURS}`);
  }

  const releases = tagName ? [await getReleaseByTag(tagName)] : await listReleases();
  const candidates = new Map();

  releases.forEach((release) => {
    if (release.draft || release.prerelease) return;

    const parsedTag = parseReleaseTag(release.tag_name);
    if (!parsedTag) return;

    if (!isOldEnough(release, minAgeHours)) {
      console.log(`Skipping ${release.tag_name}: release is newer than ${minAgeHours} hours.`);
      return;
    }

    const { scriptName, version } = parsedTag;
    if (!ignoreQuietHours && isQuietHour(scriptName, currentUtcHour)) {
      console.log(`Skipping ${release.tag_name}: ${scriptName} release is paused during ${currentUtcHour}:00 UTC contest window.`);
      return;
    }

    const devPath = path.join('script', 'dev', `${scriptName}.user.js`);
    const releasePath = path.join('script', 'release', `${scriptName}.user.js`);

    if (!fs.existsSync(devPath) || !fs.existsSync(releasePath)) {
      console.log(`Skipping ${release.tag_name}: script files do not exist.`);
      return;
    }

    const currentReleaseVersion = getFileVersion(releasePath);
    const comparison = currentReleaseVersion
      ? compareVersions(version, currentReleaseVersion)
      : 1;

    if (comparison === null) {
      console.log(`Skipping ${release.tag_name}: unable to compare versions.`);
      return;
    }

    if (comparison <= 0) {
      console.log(`Skipping ${release.tag_name}: ${scriptName} release is already ${currentReleaseVersion}.`);
      return;
    }

    let taggedDevContent;
    try {
      taggedDevContent = getScriptAtTag(release.tag_name, scriptName);
    } catch (error) {
      console.log(`Skipping ${release.tag_name}: unable to read ${devPath} from tag.`);
      return;
    }

    const taggedVersion = getScriptVersion(taggedDevContent);
    if (!taggedVersion) {
      console.log(`Skipping ${release.tag_name}: tagged userscript has no @version metadata.`);
      return;
    }

    const candidate = {
      release,
      scriptName,
      version,
      taggedDevContent
    };

    candidates.set(scriptName, chooseCandidate(candidates.get(scriptName), candidate));
  });

  if (candidates.size === 0) {
    console.log('No script release is ready to promote.');
    return;
  }

  candidates.forEach(({ release, scriptName, version, taggedDevContent }) => {
    const devPath = path.join('script', 'dev', `${scriptName}.user.js`);
    const releasePath = path.join('script', 'release', `${scriptName}.user.js`);

    console.log(`${dryRun ? '[dry-run] Would promote' : 'Promoting'} ${release.tag_name} -> ${releasePath}`);

    if (dryRun) return;

    fs.writeFileSync(releasePath, setScriptVersion(taggedDevContent, version));

    const currentDevContent = fs.readFileSync(devPath, 'utf8');
    const currentDevVersion = getScriptVersion(currentDevContent);
    const shouldBumpDevVersion = currentDevVersion
      ? compareVersions(version, currentDevVersion) === 1
      : false;

    if (shouldBumpDevVersion) {
      fs.writeFileSync(devPath, setScriptVersion(currentDevContent, version));
    }
  });

  if (!dryRun) {
    fs.writeFileSync(
      path.join('script', 'versions.json'),
      JSON.stringify(collectVersions(), null, 4)
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
