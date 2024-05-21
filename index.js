#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const tar = require('tar');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .usage('Usage: npm-package-collect <path1> <path2> ... --output=<outdir>')
  .demandCommand(1)
  .option('output', {
    alias: 'o',
    describe: 'Output directory',
    type: 'string',
    demandOption: true
  })
  .help()
  .argv;

const paths = argv._;
const outputDir = argv.output;
const collectedDir = path.join(outputDir, 'npm-package-collected');
const packageJsonPath = path.join(collectedDir, 'package.json');

async function collectDependencies(paths) {
  const dependencies = new Map();

  for (const p of paths) {
    const packageJson = path.join(p, 'package.json');
    if (await fs.pathExists(packageJson)) {
      const content = await fs.readJson(packageJson);
      if (content.dependencies) {
        Object.entries(content.dependencies).forEach(([dep, version]) => {
          if (typeof version !== 'string' || version.trim() === '') {
            version = 'latest';
          }
          dependencies.set(dep, version);
        });
      }
    }
  }

  return dependencies;
}

async function main() {
  try {
    // Collect dependencies
    const dependencies = await collectDependencies(paths);

    // Prepare output directory
    await fs.ensureDir(collectedDir);

    // Initialize npm project
    execSync('npm init -y', { cwd: collectedDir });

    // Write dependencies to package.json
    const packageJson = await fs.readJson(packageJsonPath);
    packageJson.dependencies = {};
    dependencies.forEach((version, name) => {
      packageJson.dependencies[name] = version;
    });
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

    // Install dependencies
    try {
      execSync('npm install', { cwd: collectedDir, stdio: 'inherit' });
    } catch (installError) {
      console.error('npm install failed:', installError.stderr ? installError.stderr.toString() : installError.message);
      throw installError;
    }

    // Create tar.gz file
    const tarFilePath = path.join(collectedDir, 'node_modules.tar.gz');
    await tar.c(
      {
        gzip: true,
        file: tarFilePath,
        cwd: collectedDir
      },
      ['node_modules']
    );

    console.log(`Dependencies collected and packaged at ${tarFilePath}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();