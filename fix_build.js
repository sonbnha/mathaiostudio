const fs = require('fs');

let pdfPanel = fs.readFileSync('src/components/latex-studio/PDFViewerPanel.tsx', 'utf8');
pdfPanel = pdfPanel.replace(/CircleHalf/g, 'Contrast');
fs.writeFileSync('src/components/latex-studio/PDFViewerPanel.tsx', pdfPanel);

let editorPanel = fs.readFileSync('src/components/latex-studio/EditorPanel.tsx', 'utf8');
editorPanel = editorPanel.replace('t.self, t.val', 't.self');
fs.writeFileSync('src/components/latex-studio/EditorPanel.tsx', editorPanel);

let rootPanel = fs.readFileSync('src/components/latex-studio/LaTeXStudioRoot.tsx', 'utf8');
rootPanel = rootPanel.replace(' collapsible onCollapse={() => setLeftCollapsed(true)} onExpand={() => setLeftCollapsed(false)}', '');
fs.writeFileSync('src/components/latex-studio/LaTeXStudioRoot.tsx', rootPanel);

console.log("Fixed TS Errors");
