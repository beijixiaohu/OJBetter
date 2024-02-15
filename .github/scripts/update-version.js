const fs = require('fs');
const path = require('path');

const directories = {
  dev: 'script/dev',
  release: 'script/release'
};

let versions = {};

Object.keys(directories).forEach((key) => {
  const dirPath = directories[key];
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    if (path.extname(file) === '.js') {
      const content = fs.readFileSync(path.join(dirPath, file), 'utf8');
      const versionMatch = content.match(/\/\/ @version\s+(.*)/);
      if (versionMatch) {
        const name = file.replace('.user.js', '').replace(/\s+/g, '');
        if (!versions[name]) {
          versions[name] = {};
        }
        versions[name][key] = versionMatch[1];
      }
    }
  });
});

fs.writeFileSync(path.join('script', 'versions.json'), JSON.stringify(versions, null, 4));

