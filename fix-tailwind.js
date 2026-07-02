const fs = require('fs');
const path = require('path');

const dirs = [
  path.join(__dirname, 'app'),
  path.join(__dirname, 'components')
];

function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Replace colors
  content = content.replace(/(text|bg|border|border-b|border-t|border-r|border-l|border-x|border-y|ring|fill|stroke)-\(--color-([a-zA-Z0-9-]+)\)/g, '$1-$2');

  // Replace specific hex codes mapped to variables
  content = content.replace(/\[#202f36\]/g, 'duo-green-light');
  content = content.replace(/\[#37464f\]/g, 'cloud-gray');

  // Replace Typography
  content = content.replace(/text-\[13px\]/g, 'text-caption');
  content = content.replace(/text-\[15px\]/g, 'text-body');
  content = content.replace(/text-\(length:--text-heading\)/g, 'text-heading');
  content = content.replace(/text-\(--text-heading\)/g, 'text-heading');

  // Replace Spacing
  content = content.replace(/w-\[80px\]/g, 'w-80');
  content = content.replace(/h-\[80px\]/g, 'h-80');
  content = content.replace(/border-t-\[8px\]/g, 'border-t-8');
  content = content.replace(/border-x-\[8px\]/g, 'border-x-8');
  content = content.replace(/border-t-\[10px\]/g, 'border-t-10');
  
  content = content.replace(/-top-\[52px\]/g, 'top-[-52px]');
  content = content.replace(/-bottom-\[11px\]/g, 'bottom-[-11px]');
  content = content.replace(/after:left-\[-8px\]/g, 'after:-left-8');

  // Flex
  content = content.replace(/\bflex-grow\b/g, 'grow');
  content = content.replace(/\bflex-shrink-0\b/g, 'shrink-0');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed:', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}

dirs.forEach(d => walkDir(d));
console.log("Done fixing tailwind classes!");
