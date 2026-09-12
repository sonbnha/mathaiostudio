const fs = require('fs');

let root = fs.readFileSync('src/components/latex-studio/LaTeXStudioRoot.tsx', 'utf8');

// Fix Left Resizer (Sidebar | Editor)
const oldLeftResizer = `<PanelResizeHandle className="w-1.5 bg-[#1a1a1b] border-l border-[#2d2d2d] hover:bg-[#3d3d3d] transition-colors cursor-col-resize z-40 flex items-center justify-center relative">
            <div className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center justify-center -translate-x-1/2">
              <div className="w-[14px] h-[24px] bg-[#2a2b2c] rounded-[3px] flex items-center justify-center cursor-pointer border border-[#1a1a1b] hover:bg-[#3d3d3d] z-50 text-slate-300 shadow-sm">
                 <span className="text-[10px] font-bold">{'<'}</span>
              </div>
            </div>
            <div className="flex flex-col gap-[2px] mt-8">
              <div className="w-[2px] h-[2px] rounded-full bg-slate-600" />
              <div className="w-[2px] h-[2px] rounded-full bg-slate-600" />
              <div className="w-[2px] h-[2px] rounded-full bg-slate-600" />
            </div>
          </PanelResizeHandle>`;

const newLeftResizer = `<PanelResizeHandle className="w-[5px] bg-[#2d3135] hover:bg-[#4d5155] transition-colors cursor-col-resize z-40 relative flex flex-col items-center">
            {/* 4-dot grip in middle */}
            <div className="absolute top-1/2 -translate-y-1/2 flex flex-col gap-[2px]">
              <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
              <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
              <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
              <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
            </div>

            {/* Collapse Tab (sticking right, near bottom) */}
            <div className="absolute bottom-[20%] left-full w-[10px] h-[36px] bg-[#5b646c] hover:bg-[#727d87] rounded-r-[3px] flex items-center justify-center cursor-pointer z-50 text-white shadow-sm border-y border-r border-[#2d3135]">
                 <span className="text-[10px] font-bold">{'<'}</span>
            </div>

            {/* Bottom 4-dot grip */}
            <div className="absolute bottom-[10%] flex flex-col gap-[2px]">
              <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
              <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
              <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
              <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
            </div>
          </PanelResizeHandle>`;

root = root.replace(oldLeftResizer, newLeftResizer);

// Fix Middle Resizer (Editor | PDF)
const oldMiddleResizer = `<PanelResizeHandle className="w-1.5 bg-[#142333] border-l border-[#1a1a1b] hover:bg-[#3d3d3d] transition-colors cursor-col-resize z-20 flex items-center justify-center relative group">
                <div className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center gap-8 -translate-x-1/2 z-50">
                  {/* Collapse PDF Button */}
                  <div className="w-[14px] h-[24px] bg-[#2a2b2c] rounded-[3px] flex items-center justify-center cursor-pointer border border-[#1a1a1b] hover:bg-[#3d3d3d] text-slate-300 shadow-sm">
                     <span className="text-[10px] font-bold">{'>'}</span>
                  </div>

                  {/* SyncTeX Unified Pill */}
                  <div className="w-[18px] py-1 bg-[#2a2b2c] rounded-[4px] flex flex-col items-center justify-center cursor-pointer border border-[#1a1a1b] shadow-sm text-slate-300">
                     <div className="hover:text-white hover:bg-[#3d3d3d] w-full flex justify-center py-0.5 rounded-t-[3px]" title="Go to PDF location">
                        <span className="text-[12px] leading-none">{'→'}</span>
                     </div>
                     <div className="flex flex-col gap-[2px] py-1.5 opacity-50">
                        <div className="w-[2px] h-[2px] rounded-full bg-slate-300" />
                        <div className="w-[2px] h-[2px] rounded-full bg-slate-300" />
                        <div className="w-[2px] h-[2px] rounded-full bg-slate-300" />
                     </div>
                     <div className="hover:text-white hover:bg-[#3d3d3d] w-full flex justify-center py-0.5 rounded-b-[3px]" title="Go to Code location">
                        <span className="text-[12px] leading-none">{'←'}</span>
                     </div>
                  </div>
                </div>
              </PanelResizeHandle>`;

const newMiddleResizer = `<PanelResizeHandle className="w-[5px] bg-[#2d3135] hover:bg-[#4d5155] transition-colors cursor-col-resize z-40 relative flex flex-col items-center">
                
                {/* SyncTeX Pill (sticking left, near top) */}
                <div className="absolute top-[10%] right-full w-[24px] py-1 bg-[#1e252b] rounded-l-[16px] flex flex-col items-center justify-center cursor-pointer shadow-md text-white border-y border-l border-[#1a2026]">
                     <div className="hover:bg-[#36424d] w-full flex justify-center py-1 rounded-tl-[16px]" title="Go to PDF location">
                        <span className="text-[14px] leading-none font-bold">{'→'}</span>
                     </div>
                     <div className="hover:bg-[#36424d] w-full flex justify-center py-1 rounded-bl-[16px]" title="Go to Code location">
                        <span className="text-[14px] leading-none font-bold">{'←'}</span>
                     </div>
                </div>

                {/* 4-dot grip in middle */}
                <div className="absolute top-1/2 -translate-y-1/2 flex flex-col gap-[2px]">
                  <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
                  <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
                  <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
                  <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
                </div>

                {/* Collapse PDF Tab (sticking right, lower down) */}
                <div className="absolute bottom-[20%] left-full w-[10px] h-[36px] bg-[#5b646c] hover:bg-[#727d87] rounded-r-[3px] flex items-center justify-center cursor-pointer z-50 text-white shadow-sm border-y border-r border-[#2d3135]">
                     <span className="text-[10px] font-bold">{'>'}</span>
                </div>

                {/* Bottom 4-dot grip */}
                <div className="absolute bottom-[10%] flex flex-col gap-[2px]">
                  <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
                  <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
                  <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
                  <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
                </div>
              </PanelResizeHandle>`;

root = root.replace(oldMiddleResizer, newMiddleResizer);

fs.writeFileSync('src/components/latex-studio/LaTeXStudioRoot.tsx', root);
console.log("Fixed Exact Splitter Designs");
