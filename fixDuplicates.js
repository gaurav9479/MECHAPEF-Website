const fs = require('fs');
const path = require('path');

const dir = 'Client/src/Pages/Admin';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Find all import from 'react-icons/fa'
  const lines = content.split('\n');
  let firstFaImportIdx = -1;
  const importedItems = new Set();
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("from 'react-icons/fa'") || line.includes('from "react-icons/fa"')) {
      if (firstFaImportIdx === -1) {
        firstFaImportIdx = i;
      }
      
      // Extract items
      const match = line.match(/import\s+{([^}]+)}\s+from/);
      if (match) {
        match[1].split(',').forEach(item => {
          const trimmed = item.trim();
          if (trimmed) importedItems.add(trimmed);
        });
      }
      
      if (firstFaImportIdx !== i) {
        // Clear subsequent lines
        lines[i] = '';
      }
    }
  }
  
  if (firstFaImportIdx !== -1) {
    importedItems.add('FaSignOutAlt'); // Ensure it's there
    lines[firstFaImportIdx] = `import { ${Array.from(importedItems).join(', ')} } from 'react-icons/fa';`;
  }
  
  fs.writeFileSync(filePath, lines.filter(l => l !== '').join('\n'), 'utf8');
});
