const fs = require('fs');

// 1. Fix EditorPanel.tsx
let editor = fs.readFileSync('src/components/latex-studio/EditorPanel.tsx', 'utf8');
editor = editor.replace(/w-4 h-4/g, 'w-[15px] h-[15px]'); // Icons
editor = editor.replace(/p-1\.5/g, 'p-1'); // Button padding
fs.writeFileSync('src/components/latex-studio/EditorPanel.tsx', editor);

// 2. Fix LaTeXStudioRoot.tsx
let root = fs.readFileSync('src/components/latex-studio/LaTeXStudioRoot.tsx', 'utf8');
// Leftmost icons
root = root.replace(/w-5 h-5/g, 'w-[18px] h-[18px]');
// General icons
root = root.replace(/w-4 h-4/g, 'w-[14px] h-[14px]');
root = root.replace(/w-3\.5 h-3\.5/g, 'w-[14px] h-[14px]');

// Text sizes
root = root.replace(/text-sm/g, 'text-[13px]');
root = root.replace(/text-xs/g, 'text-[11px]');

// Padding in Top menu
root = root.replace(/px-2\.5 py-1\.5/g, 'px-2 py-1');

// Outline
root = root.replace(/text-\[11px\]/g, 'text-[12px]'); // Ensure readability

fs.writeFileSync('src/components/latex-studio/LaTeXStudioRoot.tsx', root);
console.log('Scale fixed');
