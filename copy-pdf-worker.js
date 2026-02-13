// Script to copy PDF.js worker to public folder
const fs = require('fs');
const path = require('path');

// Try both .js and .mjs extensions (newer versions use .mjs)
const sourcePaths = [
  path.join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs'),
  path.join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.js'),
  path.join(__dirname, 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.min.mjs'),
];

const destPath = path.join(__dirname, 'public', 'pdf.worker.min.js');

for (const sourcePath of sourcePaths) {
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✓ PDF.js worker copied to public folder successfully from: ${path.basename(path.dirname(sourcePath))}`);
    process.exit(0);
  }
}

console.log('✗ Worker file not found. Please run: npm install pdfjs-dist');
process.exit(1);
