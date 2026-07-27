const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const directories = {
  dev: 'script/dev',
  release: 'script/release'
};

const versionPattern = /^(\/\/\s*@version\s+)(\S+)(.*)$/m;

function getBaseRef() {
  const eventPath = process.env.GITHUB_EVENT_PATH;

  if (eventPath && fs.existsSync(eventPath)) {
    try {
      const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
      if (event.before && !/^0+$/.test(event.before)) return event.before;
    } catch (error) {
      console.warn(`Unable to read GitHub event payload: ${error.message}`);
    }
  }

  return 'HEAD~1';
}

function runGit(args) {
  return childProcess.execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function getChangedScriptFiles(baseRef) {
  try {
    return runGit(['diff', '--name-only', baseRef, 'HEAD', '--', 'script/dev', 'script/release'])
      .split('\n')
      .filter(Boolean)
      .filter((file) => file.endsWith('.user.js') && fs.existsSync(file));
  } catch (error) {
    console.warn(`Unable to detect changed userscripts: ${error.message}`);
    return [];
  }
}

function getScriptVersion(content) {
  return content.match(versionPattern)?.[2] || null;
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

function bumpPatchVersion(version) {
  const parts = parseVersion(version);
  if (!parts) return null;

  while (parts.length < 3) parts.push(0);
  parts[parts.length - 1] += 1;
  return parts.join('.');
}

function getPreviousVersion(baseRef, file) {
  try {
    return getScriptVersion(runGit(['show', `${baseRef}:${file}`]));
  } catch (error) {
    return null;
  }
}

function bumpChangedScriptVersions() {
  const baseRef = getBaseRef();
  const changedFiles = getChangedScriptFiles(baseRef);

  changedFiles.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const currentVersion = getScriptVersion(content);
    const previousVersion = getPreviousVersion(baseRef, file);

    if (!currentVersion || !previousVersion) return;

    const comparison = compareVersions(currentVersion, previousVersion);
    if (comparison === null || comparison > 0) return;

    const nextVersion = bumpPatchVersion(previousVersion);
    if (!nextVersion) return;

    fs.writeFileSync(
      file,
      content.replace(versionPattern, `$1${nextVersion}$3`)
    );
    console.log(`${file}: bumped @version ${currentVersion} -> ${nextVersion}`);
  });
}

function collectVersions() {
  const versions = {};

  Object.keys(directories).forEach((key) => {
    const dirPath = directories[key];
    const files = fs.readdirSync(dirPath).sort();

    files.forEach((file) => {
      if (path.extname(file) === '.js') {
        const content = fs.readFileSync(path.join(dirPath, file), 'utf8');
        const version = getScriptVersion(content);
        if (!version) return;

        const name = file.replace('.user.js', '').replace(/\s+/g, '');
        if (!versions[name]) {
          versions[name] = {};
        }
        versions[name][key] = version;
      }
    });
  });

  return versions;
}

bumpChangedScriptVersions();

const versions = collectVersions();
fs.writeFileSync(path.join('script', 'versions.json'), JSON.stringify(versions, null, 4));

