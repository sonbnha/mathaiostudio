const fs = require('fs');
let code = fs.readFileSync('src/components/latex-studio/PDFViewerPanel.tsx', 'utf8');

// Change backgrounds to match
code = code.replace('bg-[#38393a]', 'bg-[#525659]');
code = code.replace('bg-[#222223]', 'bg-[#2a2b2c]');

// Fix FileCode2 icon to a better Sync icon
code = code.replace('<FileCode2 className="w-[15px] h-[15px]" />', '<svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor"><path d="M2 2h2v12H2V2zm11 3.5L9.5 2 8 3.5l2 2H5v2h5l-2 2 1.5 1.5 3.5-3.5z"/></svg>');

fs.writeFileSync('src/components/latex-studio/PDFViewerPanel.tsx', code);
console.log('PDF Viewer Panel Fine-tuned');
