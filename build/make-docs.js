import fs from 'fs';
import path from 'node:path';
import { execSync } from 'child_process';
import { glob } from 'glob';

// Configuration
const config = '--configure ./jsdoc.conf.json --private --example-lang js';
const template = '--template rm.hbs';

// Ensure docs directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Generate documentation for a single file
const generateDoc = (file, outputPath, useTemplate = false) => {
  const cmd = `jsdoc2md ${config} ${useTemplate ? template : ''} ${file} > ${outputPath}`;
  console.log(`Generating docs for ${file} -> ${outputPath}`);
  execSync(cmd, { stdio: 'inherit' });
};

// Main execution
const main = async () => {
  console.log('Starting documentation generation...');

  // Ensure docs directories exist
  ensureDir('docs');
  ensureDir('docs/plugins');

  // Find all JavaScript files, excluding utilities
  const files = await glob('src/**/*.js', {
    ignore: ['src/index.js']
  });


  // Generate documentation for main files
  files.forEach(file => {
    // Preserve the directory structure from src/
    const relativePath = path.relative('src', file);
    const outputPath = path.join('docs', relativePath.replace('.js', '.md'));

    // Ensure the output directory exists
    ensureDir(path.dirname(outputPath));

    generateDoc(file, outputPath, false);
  });

  console.log('Documentation generation complete!');
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main };
