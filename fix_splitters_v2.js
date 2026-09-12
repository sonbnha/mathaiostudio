const fs = require('fs');
let root = fs.readFileSync('src/components/latex-studio/LaTeXStudioRoot.tsx', 'utf8');

// Replace Left Resizer
const oldLeftResizer = /<PanelResizeHandle className="w-\[5px\].*?<\/PanelResizeHandle>/s;

const newLeftResizer = `<PanelResizeHandle className="w-[8px] bg-transparent hover:bg-slate-700/20 transition-colors cursor-col-resize z-40 relative flex justify-center group">
            {/* The visible 1px line */}
            <div className="w-[1px] h-full bg-[#1a1a1b]" />

            {/* 4-dot grip in middle */}
            <div className="absolute top-1/2 -translate-y-1/2 flex flex-col gap-[2px]">
              <div className="w-[2px] h-[2px] rounded-full bg-slate-500" />
              <div className="w-[2px] h-[2px] rounded-full bg-slate-500" />
              <div className="w-[2px] h-[2px] rounded-full bg-slate-500" />
              <div className="w-[2px] h-[2px] rounded-full bg-slate-500" />
            </div>

            {/* Collapse Tab (sticking right into Editor) */}
            <div className="absolute bottom-[20%] left-1/2 w-[12px] h-[32px] bg-[#3a3f44] hover:bg-[#525960] rounded-r-[4px] flex items-center justify-center cursor-pointer text-white shadow-sm border border-l-0 border-[#1a1a1b]">
                 <span className="text-[9px] font-bold">{'<'}</span>
            </div>

            {/* Bottom 4-dot grip */}
            <div className="absolute bottom-[10%] flex flex-col gap-[2px]">
              <div className="w-[2px] h-[2px] rounded-full bg-slate-500" />
              <div className="w-[2px] h-[2px] rounded-full bg-slate-500" />
              <div className="w-[2px] h-[2px] rounded-full bg-slate-500" />
              <div className="w-[2px] h-[2px] rounded-full bg-slate-500" />
            </div>
          </PanelResizeHandle>`;

root = root.replace(oldLeftResizer, newLeftResizer);


// Replace Middle Resizer
// We need to carefully find the second PanelResizeHandle
const parts = root.split('<PanelResizeHandle');
// parts[0] is before first
// parts[1] is first (Left Resizer) which we already replaced if we used regex, wait. 
// Let's just use string replacement carefully.
