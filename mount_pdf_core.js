const fs = require('fs');
let code = fs.readFileSync('src/components/latex-studio/PDFViewerPanel.tsx', 'utf8');

if (!code.includes('import PDFViewerCore')) {
  code = code.replace(
    "import { ChevronDown",
    "import PDFViewerCore from './PDFViewerCore';\nimport { ChevronDown"
  );
}

const target = `{/* Placeholder for PDF Render */}
        <div className="bg-white w-[600px] h-[800px] shadow-lg flex flex-col items-center justify-center relative">
          <p className="text-slate-400 font-serif">PDF Document Preview</p>
          
          {/* Fake SyncTeX Highlight Overlay */}
          <div className="absolute top-[200px] left-[50px] w-[300px] h-[20px] bg-yellow-400/40 pointer-events-none hidden" />
        </div>`;

const replacement = `<PDFViewerCore url={pdfUrl} scale={1.0} />`;

if (code.includes(target)) {
  fs.writeFileSync('src/components/latex-studio/PDFViewerPanel.tsx', code.replace(target, replacement));
  console.log("Mounted PDFViewerCore successfully");
} else {
  console.log("Failed to find target block");
}
