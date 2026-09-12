const fs = require('fs');
let root = fs.readFileSync('src/components/latex-studio/LaTeXStudioRoot.tsx', 'utf8');

const oldLeftResizer = /<PanelResizeHandle className="w-\[12px\].*?<\/PanelResizeHandle>/;

const newLeftResizer = `<PanelResizeHandle className="w-[8px] bg-transparent hover:bg-slate-700/20 transition-colors cursor-col-resize z-40 relative flex justify-center group">
            {/* The visible 1px line */}
            <div className="w-[1px] h-full bg-[#1a1a1b]" />

            {/* Vertically Centered Cluster */}
            <div className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 w-full">
              
              {/* Top Grip */}
              <div className="flex flex-col gap-[2px]">
                <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
                <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
                <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
                <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
              </div>

              {/* Collapse Tab (sticking right) */}
              <div className="relative w-full h-[36px]">
                <div className="absolute left-1/2 w-[12px] h-full bg-[#3a3f44] hover:bg-[#525960] rounded-r-[4px] flex items-center justify-center cursor-pointer border border-l-0 border-[#1a1a1b] shadow-sm">
                   <span className="text-[10px] font-bold text-slate-300">{'<'}</span>
                </div>
              </div>

              {/* Bottom Grip */}
              <div className="flex flex-col gap-[2px]">
                <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
                <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
                <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
                <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
              </div>
              
            </div>
          </PanelResizeHandle>`;

root = root.replace(oldLeftResizer, newLeftResizer);

const oldMiddleResizer = /<PanelResizeHandle className="w-\[16px\].*?<\/PanelResizeHandle>/;

const newMiddleResizer = `<PanelResizeHandle className="w-[8px] bg-transparent hover:bg-slate-700/20 transition-colors cursor-col-resize z-40 relative flex justify-center group">
                {/* The visible 1px line */}
                <div className="w-[1px] h-full bg-[#1a1a1b]" />

                {/* Vertically Centered Cluster */}
                <div className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 w-full">
                  
                  {/* SyncTeX Pill (sticking left) */}
                  <div className="relative w-full h-[44px]">
                     <div className="absolute right-1/2 w-[18px] h-full bg-[#2a2b2c] rounded-l-[6px] flex flex-col items-center justify-center cursor-pointer border border-r-0 border-[#1a1a1b] shadow-md overflow-hidden">
                        <div className="hover:bg-[#3d3d3d] w-full h-1/2 flex items-center justify-center transition-colors" title="Go to PDF location">
                           <span className="text-[12px] font-bold text-slate-300 hover:text-white">{'→'}</span>
                        </div>
                        <div className="w-[12px] h-[1px] bg-[#4d4d4d]" />
                        <div className="hover:bg-[#3d3d3d] w-full h-1/2 flex items-center justify-center transition-colors" title="Go to Code location">
                           <span className="text-[12px] font-bold text-slate-300 hover:text-white">{'←'}</span>
                        </div>
                     </div>
                  </div>

                  {/* Top Grip */}
                  <div className="flex flex-col gap-[2px]">
                    <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
                    <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
                    <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
                    <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
                  </div>

                  {/* PDF Collapse Tab (sticking right) */}
                  <div className="relative w-full h-[36px]">
                     <div className="absolute left-1/2 w-[12px] h-full bg-[#3a3f44] hover:bg-[#525960] rounded-r-[4px] flex items-center justify-center cursor-pointer border border-l-0 border-[#1a1a1b] shadow-sm">
                        <span className="text-[10px] font-bold text-slate-300">{'>'}</span>
                     </div>
                  </div>

                  {/* Bottom Grip */}
                  <div className="flex flex-col gap-[2px]">
                    <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
                    <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
                    <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
                    <div className="w-[2px] h-[2px] rounded-full bg-slate-400 opacity-70" />
                  </div>
                  
                </div>
              </PanelResizeHandle>`;

root = root.replace(oldMiddleResizer, newMiddleResizer);

fs.writeFileSync('src/components/latex-studio/LaTeXStudioRoot.tsx', root);
console.log("Fixed Final Splitters Vertical Centering");
