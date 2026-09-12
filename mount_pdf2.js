const fs = require('fs');
let code = fs.readFileSync('src/components/latex-studio/LaTeXStudioRoot.tsx', 'utf8');

// Add import
if (!code.includes('import PDFViewerPanel')) {
  code = code.replace(
    "import EditorPanel from './EditorPanel';",
    "import EditorPanel from './EditorPanel';\nimport PDFViewerPanel from './PDFViewerPanel';"
  );
}

// Extract everything before COLUMN 3 and after the end of Panel
const startIndex = code.indexOf('{/* COLUMN 3: PDF VIEWER */}');
const afterPanelStr = '            </PanelGroup>\n          </Panel>';
const endIndex = code.indexOf(afterPanelStr, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `{/* COLUMN 3: PDF VIEWER */}
              <Panel defaultSize={50} minSize={10} className="bg-[#38393a] flex flex-col z-10 shadow-[0_0_15px_rgba(0,0,0,0.2)] border-l border-[#1a1a1b]">
                 <PDFViewerPanel />
              </Panel>
`;
  code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
  fs.writeFileSync('src/components/latex-studio/LaTeXStudioRoot.tsx', code);
  console.log("Mounted PDFViewerPanel successfully");
} else {
  console.log("Failed to find bounds");
}
