const fs = require('fs');
let code = fs.readFileSync('src/components/latex-studio/LaTeXStudioRoot.tsx', 'utf8');

const target = `<PanelGroup orientation="horizontal">
          
          {/* COLUMN 1: LEFT SIDEBAR */}
          <Panel defaultSize={15} minSize={5} className="bg-slate-50 dark:bg-[#252526] flex flex-col">
            <div className="p-3 font-semibold text-xs tracking-wider uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span>Files</span>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {files.map(f => (
                <div 
                  key={f.id} 
                  className={\`px-4 py-1.5 text-sm cursor-pointer \${activeFileId === f.id ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium border-l-2 border-blue-500' : 'hover:bg-slate-200 dark:hover:bg-slate-800 border-l-2 border-transparent text-slate-700 dark:text-slate-300'}\`}
                  onClick={() => useLaTeXStore.getState().setActiveFile(f.id)}
                >
                  {f.name}
                </div>
              ))}
            </div>
          </Panel>

          <PanelResizeHandle className="w-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-blue-500 transition-colors cursor-col-resize z-20" />

          {/* COLUMN 2: EDITOR */}
          <Panel defaultSize={45} minSize={25} className="bg-white dark:bg-[#1e1e1e] flex flex-col z-10 shadow-[0_0_15px_rgba(0,0,0,0.05)] dark:shadow-[0_0_15px_rgba(0,0,0,0.2)]">
             <EditorPanel />
          </Panel>

          <PanelResizeHandle className="w-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-blue-500 transition-colors cursor-col-resize z-20" />

          {/* COLUMN 3: PDF VIEWER */}
          <Panel defaultSize={40} minSize={20} className="bg-slate-100 dark:bg-[#333333] flex flex-col relative">
             <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md font-medium text-sm shadow-md transition-colors">
                  Recompile
                </button>
             </div>
             <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
               [PDF Viewer Panel Coming Soon]
             </div>
          </Panel>

        </PanelGroup>`;

const replacement = `<PanelGroup orientation="horizontal">
          
          {/* COLUMN 1: LEFT SIDEBAR */}
          <Panel defaultSize={15} minSize={5} className="bg-slate-50 dark:bg-[#252526] flex flex-col z-30">
            <div className="p-3 font-semibold text-xs tracking-wider uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span>Files</span>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {files.map(f => (
                <div 
                  key={f.id} 
                  className={\`px-4 py-1.5 text-sm cursor-pointer \${activeFileId === f.id ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium border-l-2 border-blue-500' : 'hover:bg-slate-200 dark:hover:bg-slate-800 border-l-2 border-transparent text-slate-700 dark:text-slate-300'}\`}
                  onClick={() => useLaTeXStore.getState().setActiveFile(f.id)}
                >
                  {f.name}
                </div>
              ))}
            </div>
          </Panel>

          <PanelResizeHandle className="w-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-blue-500 transition-colors cursor-col-resize z-40" />

          {/* COLUMN 2 & 3: EDITOR + PDF VIEWER */}
          <Panel defaultSize={85} minSize={20} className="flex flex-col">
            <PanelGroup orientation="horizontal">
              {/* COLUMN 2: EDITOR */}
              <Panel defaultSize={50} minSize={10} className="bg-white dark:bg-[#1e1e1e] flex flex-col z-10 shadow-[0_0_15px_rgba(0,0,0,0.05)] dark:shadow-[0_0_15px_rgba(0,0,0,0.2)]">
                 <EditorPanel />
              </Panel>

              <PanelResizeHandle className="w-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-blue-500 transition-colors cursor-col-resize z-20" />

              {/* COLUMN 3: PDF VIEWER */}
              <Panel defaultSize={50} minSize={10} className="bg-slate-100 dark:bg-[#333333] flex flex-col relative z-10">
                 <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md font-medium text-sm shadow-md transition-colors">
                      Recompile
                    </button>
                 </div>
                 <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                   [PDF Viewer Panel Coming Soon]
                 </div>
              </Panel>
            </PanelGroup>
          </Panel>

        </PanelGroup>`;

if (code.includes(target)) {
  fs.writeFileSync('src/components/latex-studio/LaTeXStudioRoot.tsx', code.replace(target, replacement));
  console.log("Success");
} else {
  console.log("Failed to find target");
}
