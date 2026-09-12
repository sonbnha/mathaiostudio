const fs = require('fs');

// 1. Fix EditorPanel.tsx
let editor = fs.readFileSync('src/components/latex-studio/EditorPanel.tsx', 'utf8');
// Fix editor background color to Overleaf's navy blue: #1e293b or #1a2634
editor = editor.replace(/#142333/g, '#1a2634'); 
// The active tab should match the editor background
editor = editor.replace(/bg-\[\#222223\] text-white/g, 'bg-[#1a2634] text-white');

fs.writeFileSync('src/components/latex-studio/EditorPanel.tsx', editor);

// 2. Fix LaTeXStudioRoot.tsx
let root = fs.readFileSync('src/components/latex-studio/LaTeXStudioRoot.tsx', 'utf8');
// Change Menu icon to an Up-Left arrow (Back to projects)
root = root.replace(/<Menu className="w-\[18px\] h-\[18px\]" \/>/, '<svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor"><path d="M14 15V8a2 2 0 0 0-2-2H5.414l2.293-2.293-1.414-1.414L2 6.5l4.293 4.207 1.414-1.414L5.414 7H12v8h2z"/></svg>');
// Remove the text "PDF Viewer Panel Coming Soon"
root = root.replace(/<span className="text-\[12px\]">PDF Viewer Panel Coming Soon<\/span>/, '');
root = root.replace(/<div className="text-slate-500 text-\[13px\]">PDF Canvas<\/div>/, '');
// PDF Background
root = root.replace(/bg-\[\#38393a\]/g, 'bg-[#525659]');
// PDF Toolbar background
root = root.replace(/bg-\[\#222223\]/g, 'bg-[#2a2b2c]');

fs.writeFileSync('src/components/latex-studio/LaTeXStudioRoot.tsx', root);
console.log('UI Fine-tuned');
