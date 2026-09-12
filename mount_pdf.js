const fs = require('fs');
let code = fs.readFileSync('src/components/latex-studio/LaTeXStudioRoot.tsx', 'utf8');

// Add import
code = code.replace(
  "import EditorPanel from './EditorPanel';",
  "import EditorPanel from './EditorPanel';\nimport PDFViewerPanel from './PDFViewerPanel';"
);

// Replace the placeholder with the component
const target = `{/* COLUMN 3: PDF VIEWER */}
              <Panel defaultSize={50} minSize={10} className="bg-[#38393a] flex flex-col relative z-10">
                 {/* PDF Toolbar Fake for now, will build in Phase 3 */}
                 <div className="h-[40px] bg-[#222223] border-b border-[#2d2d2d] flex items-center justify-between px-3 shrink-0">
                   <div className="flex items-center">
                     <div className="flex">
                       <button className="bg-[#128a42] hover:bg-[#107c3b] text-white px-3 py-1 rounded-l text-sm font-semibold transition-colors border-r border-[#107c3b]">
                         Recompile
                       </button>
                       <button className="bg-[#128a42] hover:bg-[#107c3b] text-white px-1.5 py-1 rounded-r text-sm flex items-center justify-center transition-colors">
                         <ChevronDown className="w-4 h-4" />
                       </button>
                     </div>
                   </div>
                   <div className="flex items-center text-slate-400 gap-3">
                     <span className="text-xs">PDF Viewer Panel Coming Soon</span>
                   </div>
                 </div>
                 
                 {/* Canvas container */}
                 <div className="flex-1 flex items-center justify-center bg-[#38393a]">
                    <div className="text-slate-500 text-sm">PDF Canvas</div>
                 </div>
              </Panel>`;

const replacement = `{/* COLUMN 3: PDF VIEWER */}
              <Panel defaultSize={50} minSize={10} className="bg-[#38393a] flex flex-col z-10 shadow-[0_0_15px_rgba(0,0,0,0.2)] border-l border-[#1a1a1b]">
                 <PDFViewerPanel />
              </Panel>`;

if (code.includes(target)) {
  fs.writeFileSync('src/components/latex-studio/LaTeXStudioRoot.tsx', code.replace(target, replacement));
  console.log("Mounted PDFViewerPanel successfully");
} else {
  console.log("Target not found");
}
