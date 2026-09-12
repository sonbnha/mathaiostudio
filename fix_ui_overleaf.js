const fs = require('fs');

let root = fs.readFileSync('src/components/latex-studio/LaTeXStudioRoot.tsx', 'utf8');

// Fix Left Resizer Tab
const oldLeftResizer = `<div className="absolute top-1/2 -translate-y-1/2 left-0 -translate-x-1/2 w-3 h-8 bg-[#2d2d2d] rounded-l flex flex-col items-center justify-center cursor-pointer border border-[#3d3d3d] border-r-0 hover:bg-[#4d4d4d] z-50 shadow-sm">
               <span className="text-slate-300 text-[10px] leading-none">{'<'}</span>
            </div>
            <div className="flex flex-col gap-[2px] mt-8">
              <div className="w-[2px] h-[2px] rounded-full bg-slate-600" />
              <div className="w-[2px] h-[2px] rounded-full bg-slate-600" />
              <div className="w-[2px] h-[2px] rounded-full bg-slate-600" />
            </div>`;

const newLeftResizer = `<div className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center justify-center -translate-x-1/2">
              <div className="w-[14px] h-[24px] bg-[#2a2b2c] rounded-[3px] flex items-center justify-center cursor-pointer border border-[#1a1a1b] hover:bg-[#3d3d3d] z-50 text-slate-300 shadow-sm">
                 <span className="text-[10px] font-bold">{'<'}</span>
              </div>
            </div>`;

root = root.replace(oldLeftResizer, newLeftResizer);

// Fix Middle Resizer (SyncTeX + Collapse)
const oldMiddleResizer = `<div className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-1 z-50">
                  {/* Sync to PDF */}
                  <div className="w-5 h-5 bg-[#2d2d2d] rounded-full flex items-center justify-center cursor-pointer border border-[#3d3d3d] hover:bg-[#4d4d4d] shadow-md text-slate-300" title="Go to PDF location">
                     <span className="text-[10px] leading-none ml-0.5">{'→'}</span>
                  </div>
                  {/* Handle dots */}
                  <div className="flex flex-col gap-[2px] my-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-[2px] h-[2px] rounded-full bg-slate-500" />
                    <div className="w-[2px] h-[2px] rounded-full bg-slate-500" />
                    <div className="w-[2px] h-[2px] rounded-full bg-slate-500" />
                  </div>
                  {/* Sync to Code */}
                  <div className="w-5 h-5 bg-[#2d2d2d] rounded-full flex items-center justify-center cursor-pointer border border-[#3d3d3d] hover:bg-[#4d4d4d] shadow-md text-slate-300" title="Go to Code location">
                     <span className="text-[10px] leading-none mr-0.5">{'←'}</span>
                  </div>
                </div>`;

const newMiddleResizer = `<div className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center gap-8 -translate-x-1/2 z-50">
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
                </div>`;

root = root.replace(oldMiddleResizer, newMiddleResizer);

fs.writeFileSync('src/components/latex-studio/LaTeXStudioRoot.tsx', root);
console.log("Updated LaTeXStudioRoot Resizers");
