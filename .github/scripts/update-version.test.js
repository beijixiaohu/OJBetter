const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');


const UPDATE_VERSION_SCRIPT = path.join(__dirname, 'update-version.js');

function runGit(repository, args) {
  return childProcess.execFileSync('git', args, {
    cwd: repository,
    encoding: 'utf8'
  }).trim();
}

function userscript(version, statement, lineEnding = '\n') {
  return [
    '// ==UserScript==',
    `// @version      ${version}`,
    '// ==/UserScript==',
    statement,
    ''
  ].join(lineEnding);
}

function createRepository(t) {
  const repository = fs.mkdtempSync(path.join(os.tmpdir(), 'ojbetter-version-test-'));
  t.after(() => fs.rmSync(repository, { recursive: true, force: true }));

  fs.mkdirSync(path.join(repository, 'script/dev'), { recursive: true });
  fs.mkdirSync(path.join(repository, 'script/release'), { recursive: true });
  runGit(repository, ['init', '--quiet']);
  runGit(repository, ['config', 'user.email', 'test@example.com']);
  runGit(repository, ['config', 'user.name', 'Test']);
  runGit(repository, ['config', 'core.autocrlf', 'false']);

  return repository;
}

function writeScripts(repository, { devVersion = '1.0.0', devStatement, lineEnding = '\n' }) {
  fs.writeFileSync(
    path.join(repository, 'script/dev/example.user.js'),
    userscript(devVersion, devStatement, lineEnding)
  );
  fs.writeFileSync(
    path.join(repository, 'script/release/example.user.js'),
    userscript('1.0.0', 'console.log("release");', lineEnding)
  );
}

function commitAll(repository, message) {
  runGit(repository, ['add', '.']);
  runGit(repository, ['commit', '--quiet', '-m', message]);
  return runGit(repository, ['rev-parse', 'HEAD']);
}

function runUpdateVersion(repository, baseRef) {
  const eventPath = path.join(repository, 'event.json');
  const outputPath = path.join(repository, 'github-output.txt');
  fs.writeFileSync(eventPath, JSON.stringify({ before: baseRef }));

  const stdout = childProcess.execFileSync('node', [UPDATE_VERSION_SCRIPT], {
    cwd: repository,
    encoding: 'utf8',
    env: {
      ...process.env,
      GITHUB_EVENT_PATH: eventPath,
      GITHUB_OUTPUT: outputPath
    }
  });

  return {
    stdout,
    output: fs.readFileSync(outputPath, 'utf8')
  };
}

function readDevScript(repository) {
  return fs.readFileSync(
    path.join(repository, 'script/dev/example.user.js'),
    'utf8'
  );
}

test('ignores a userscript changed only from CRLF to LF', (t) => {
  const repository = createRepository(t);
  writeScripts(repository, {
    devStatement: 'console.log("same");',
    lineEnding: '\r\n'
  });
  const baseRef = commitAll(repository, 'CRLF scripts');

  writeScripts(repository, {
    devStatement: 'console.log("same");',
    lineEnding: '\n'
  });
  commitAll(repository, 'LF scripts');

  const result = runUpdateVersion(repository, baseRef);

  assert.match(result.stdout, /No substantive userscript changes detected/);
  assert.equal(result.output, 'has_script_changes=false\n');
  assert.match(readDevScript(repository), /@version\s+1\.0\.0/);
  assert.equal(fs.existsSync(path.join(repository, 'script/versions.json')), false);
});

test('bumps an unchanged version after a substantive script change', (t) => {
  const repository = createRepository(t);
  writeScripts(repository, { devStatement: 'console.log("before");' });
  const baseRef = commitAll(repository, 'initial scripts');

  writeScripts(repository, { devStatement: 'console.log("after");' });
  commitAll(repository, 'change script');

  const result = runUpdateVersion(repository, baseRef);
  const versions = JSON.parse(
    fs.readFileSync(path.join(repository, 'script/versions.json'), 'utf8')
  );

  assert.equal(result.output, 'has_script_changes=true\n');
  assert.match(readDevScript(repository), /@version\s+1\.0\.1/);
  assert.deepEqual(versions.example, { dev: '1.0.1', release: '1.0.0' });
});

test('keeps a manually increased version and still requests synchronization', (t) => {
  const repository = createRepository(t);
  writeScripts(repository, { devStatement: 'console.log("before");' });
  const baseRef = commitAll(repository, 'initial scripts');

  writeScripts(repository, {
    devVersion: '1.1.0',
    devStatement: 'console.log("after");'
  });
  commitAll(repository, 'change script with version');

  const result = runUpdateVersion(repository, baseRef);

  assert.equal(result.output, 'has_script_changes=true\n');
  assert.match(readDevScript(repository), /@version\s+1\.1\.0/);
});
