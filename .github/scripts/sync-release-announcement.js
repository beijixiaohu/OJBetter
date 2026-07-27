const fs = require('fs');
const path = require('path');

const tagPattern = /^([a-z0-9-]+)-v(\d+(?:\.\d+)+)$/;
const versionHeadingPattern = /^##\s+(\d+(?:\.\d+)+)\s*$/gm;

function getEvent() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !fs.existsSync(eventPath)) return null;

  return JSON.parse(fs.readFileSync(eventPath, 'utf8'));
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

async function getRelease() {
  const event = getEvent();
  if (event?.release) return event.release;

  const tagName = process.env.RELEASE_TAG_NAME;
  if (!tagName) {
    throw new Error('No release payload or RELEASE_TAG_NAME was provided.');
  }

  return githubApi(`/releases/tags/${encodeURIComponent(tagName)}`);
}

function parseReleaseTag(tagName) {
  const match = tagName.match(tagPattern);
  if (!match) return null;

  return {
    scriptName: match[1],
    version: match[2]
  };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeReleaseBody(body, version) {
  let normalized = (body || '').replace(/\r\n/g, '\n').trim();
  const duplicateHeading = new RegExp(`^#{1,2}\\s+v?${escapeRegExp(version)}\\s*\\n+`, 'i');
  normalized = normalized.replace(duplicateHeading, '').trim();
  normalized = normalized.replace(/^##(\s+)/gm, '###$1');

  if (!normalized) {
    throw new Error('Release body is empty; refusing to publish an empty announcement.');
  }

  return normalized;
}

function findVersionHeading(content, version) {
  versionHeadingPattern.lastIndex = 0;

  let match;
  while ((match = versionHeadingPattern.exec(content)) !== null) {
    if (match[1] === version) {
      return {
        start: match.index,
        end: versionHeadingPattern.lastIndex
      };
    }
  }

  return null;
}

function findNextVersionHeading(content, fromIndex) {
  versionHeadingPattern.lastIndex = fromIndex;

  const match = versionHeadingPattern.exec(content);
  return match ? match.index : content.length;
}

function upsertAnnouncement(announcePath, version, body) {
  const content = fs.existsSync(announcePath)
    ? fs.readFileSync(announcePath, 'utf8').replace(/\r\n/g, '\n')
    : '';
  const section = `## ${version}\n\n${body}\n`;
  const existingHeading = findVersionHeading(content, version);

  if (!existingHeading) {
    return `${section}\n${content.trimStart()}`.trimEnd() + '\n';
  }

  const nextHeadingStart = findNextVersionHeading(content, existingHeading.end);
  const before = content.slice(0, existingHeading.start).trimEnd();
  const after = content.slice(nextHeadingStart).trimStart();

  return [before, section.trimEnd(), after].filter(Boolean).join('\n\n') + '\n';
}

async function main() {
  const release = await getRelease();

  if (release.draft || release.prerelease) {
    console.log(`Skipping draft or prerelease ${release.tag_name}.`);
    return;
  }

  const parsedTag = parseReleaseTag(release.tag_name);
  if (!parsedTag) {
    console.log(`Skipping non-script release tag ${release.tag_name}.`);
    return;
  }

  const { scriptName, version } = parsedTag;
  const scriptPath = path.join('script', 'dev', `${scriptName}.user.js`);
  const announcePath = path.join('resources', 'announce', `${scriptName}.md`);

  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Unknown script "${scriptName}": ${scriptPath} does not exist.`);
  }

  if (!fs.existsSync(announcePath)) {
    throw new Error(`Missing announcement source file: ${announcePath}`);
  }

  const body = normalizeReleaseBody(release.body, version);
  const nextContent = upsertAnnouncement(announcePath, version, body);

  fs.writeFileSync(announcePath, nextContent);
  console.log(`Synced ${release.tag_name} to ${announcePath}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
