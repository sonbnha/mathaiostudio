const fs = require('fs');
let code = fs.readFileSync('src/components/latex/TeXEditor.tsx', 'utf8');
code = code.replace(
  'if (viewRef.current && targetLine && targetLine.line > 0) {',
  'let lineToJump = typeof targetLine === "number" ? targetLine : targetLine?.line;\n    if (viewRef.current && lineToJump && lineToJump > 0) {'
);
code = code.replace(
  'if (targetLine.line <= doc.lines) {',
  'if (lineToJump <= doc.lines) {'
);
code = code.replace(
  'const linePos = doc.line(targetLine.line).from;',
  'const linePos = doc.line(lineToJump).from;'
);
fs.writeFileSync('src/components/latex/TeXEditor.tsx', code);
