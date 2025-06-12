const path = require('path');
const fs = require('fs');
const { task, src, dest, series } = require('gulp');

task('build:icons', copyIcons);
task('update:version', updateVersion);
task('build', series('update:version', 'build:icons'));

function copyIcons() {
  const nodeSource = path.resolve('nodes', '**', '*.{png,svg}');
  const nodeDestination = path.resolve('dist', 'nodes');

  // Copy node icons
  src(nodeSource).pipe(dest(nodeDestination));

  // Check if credentials directory exists before attempting to copy
  if (fs.existsSync('credentials')) {
    const credSource = path.resolve('credentials', '**', '*.{png,svg}');
    const credDestination = path.resolve('dist', 'credentials');
    return src(credSource).pipe(dest(credDestination));
  }

  return Promise.resolve(); // Return resolved promise if no credentials dir
}

function updateVersion(cb) {
  try {
    // Read version from version.txt
    const version = fs.readFileSync('./version.txt', 'utf8').trim();
    console.log(`Updating version to ${version}`);

    // Update package.json
    const packageJsonPath = './package.json';
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    packageJson.version = version;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4));

    // Update nodes version if needed
    // Look in both ./nodes and ./src/nodes directories
    const directories = ['./nodes', './src/nodes'];
    let nodeFiles = [];

    for (const dir of directories) {
      if (fs.existsSync(dir)) {
        const files = fs
          .readdirSync(dir, { withFileTypes: true })
          .filter((dirent) => dirent.isDirectory())
          .map((dirent) => path.join(dir, dirent.name, `${dirent.name}.node.ts`))
          .filter((file) => fs.existsSync(file));
        nodeFiles = nodeFiles.concat(files);
      }
    }

    for (const file of nodeFiles) {
      const content = fs.readFileSync(file, 'utf8');
      // Only update if version is specified as a number
      if (content.match(/version:\s*\d+/)) {
        const updated = content.replace(
          /version:\s*\d+/,
          `version: ${parseInt(version.split('.')[0], 10)}`,
        );
        fs.writeFileSync(file, updated);
      }
    }

    console.log('Version updated successfully');
  } catch (error) {
    console.error('Error updating version:', error);
  }
  cb();
}
