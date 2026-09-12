const fs = require('fs');
fetch('https://latex.ytotech.com/builds/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    compiler: 'xelatex',
    options: {
      compiler: { halt_on_error: true }
    },
    resources: [{ main: true, path: 'main.tex', content: "\\documentclass{article}\\begin{document}Hello SyncTeX\\end{document}" }]
  })
}).then(async r => {
  console.log('Status:', r.status);
  console.log('Content-Type:', r.headers.get('content-type'));
}).catch(console.error);
