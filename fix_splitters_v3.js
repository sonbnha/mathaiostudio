const fs = require('fs');
let root = fs.readFileSync('src/components/latex-studio/LaTeXStudioRoot.tsx', 'utf8');

// Replace Left Resizer
const oldLeftResizer = /<PanelResizeHandle className="w-\[6px\].*?<\/PanelResizeHandle>/;

const newLeftResizer = `<PanelResizeHandle className="w-[12px] bg-[#1a1a1b] hover:bg-[#2d2d2d] transition-colors cursor-col-resize z-40 flex flex-col items-center justify-center gap-4 relative border-l border-[#2d2d2d]">
            {/* Top 3-dot grip */}
            <div className="flex flex-col gap-1">
              <div className="w-[2px] h-[2px] rounded-full bg-slate-500" />
              <div className="w-[2px] h-[2px] rounded-full bg-slate-500" />
              <div className="w-[2px] h-[2px] rounded-full bg-slate-500" />
            </div>

            {/* Collapse Tab (thin, centered) */}
            <div className="w-[8px] h-[36px] bg-[#3a3f44] hover:bg-[#525960] rounded flex items-center justify-center cursor-pointer text-slate-200 shadow-sm border border-[#1a1a1b]">
                 <span className="text-[10px] font-bold">{'<'}</span>
            </div>

            {/* Bottom 3-dot grip */}
            <div className="flex flex-col gap-1">
              <div className="w-[2px] h-[2px] rounded-full bg-slate-500" />
              <div className="w-[2px] h-[2px] rounded-full bg-slate-500" />
              <div className="w-[2px] h-[2px] rounded-full bg-slate-500" />
            </div>
          </PanelResizeHandle>`;

root = root.replace(oldLeftResizer, newLeftResizer);


// Replace Middle Resizer
const oldMiddleResizer = /<PanelResizeHandle className="w-\[6px\].*?<\/PanelResizeHandle>/;

const newMiddleResizer = `<PanelResizeHandle className="w-[16px] bg-[#1a1a1b] hover:bg-[#2d2d2d] transition-colors cursor-col-resize z-40 flex flex-col items-center justify-center gap-6 relative border-l border-[#2d2d2d]">
                
                {/* SyncTeX Pill (Centered) */}
                <div className="w-[14px] bg-[#2a2b2c] rounded-full flex flex-col items-center justify-center cursor-pointer shadow-md text-slate-300 border border-[#1a1a1b] overflow-hidden">
                     <div className="hover:bg-[#3d3d3d] hover:text-white w-full flex justify-center py-2 transition-colors" title="Go to PDF location">
                        <span className="text-[12px] leading-none font-bold">{'→'}</span>
                     </div>
                     <div className="w-[10px] h-[1px] bg-[#3d3d3d]" />
                     <div className="hover:bg-[#3d3d3d] hover:text-white w-full flex justify-center py-2 transition-colors" title="Go to Code location">
                        <span className="text-[12px] leading-none font-bold">{'←'}</span>
                     </div>
                </div>

                {/* Top 3-dot grip */}
                <div className="flex flex-col gap-1">
                  <div className="w-[2px] h-[2px] rounded-full bg-slate-500" />
                  <div className="w-[2px] h-[2px] rounded-full bg-slate-500" />
                  <div className="w-[2px] h-[2px] rounded-full bg-slate-500" />
                </div>

                {/* Collapse PDF Tab (thin, centered) */}
                <div className="w-[8px] h-[36px] bg-[#3a3f44] hover:bg-[#525960] rounded flex items-center justify-center cursor-pointer text-slate-200 border border-[#1a1a1b] shadow-sm">
                     <span className="text-[10px] font-bold">{'>'}</span>
                </div>

                {/* Bottom 3-dot grip */}
                <div className="flex flex-col gap-1">
                  <div className="w-[2px] h-[2px] rounded-full bg-slate-500" />
                  <div className="w-[2px] h-[2px] rounded-full bg-slate-500" />
                  <div className="w-[2px] h-[2px] rounded-full bg-slate-500" />
                </div>
              </PanelResizeHandle>`;

root = root.replace(oldMiddleResizer, newMiddleResizer);

fs.writeFileSync('src/components/latex-studio/LaTeXStudioRoot.tsx', root);
console.log("Fixed Splitters Centering");
