const fs = require('fs');

let editorPanel = fs.readFileSync('src/components/latex-studio/EditorPanel.tsx', 'utf8');

// Replace the styles array with a more aggressive mapping for Cobalt LaTeX
const oldStyles = `  styles: [
    { tag: t.keyword, color: '#ff9d00' }, // Cobalt has some orange, but Overleaf LaTeX commands are magenta. Wait, we'll use magenta.
    { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: '#ff66b2' }, // Magenta for \\begin, \\item
    { tag: [t.variableName], color: '#ff66b2' }, 
    { tag: [t.function(t.variableName)], color: '#ff66b2' },
    { tag: [t.labelName], color: '#ff66b2' },
    { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: '#ff66b2' },
    { tag: [t.definition(t.name), t.separator], color: '#ff66b2' },
    { tag: [t.brace, t.bracket], color: '#8599a6' },
    { tag: [t.annotation], color: '#ff66b2' },
    { tag: [t.number, t.changed, t.annotation, t.modifier, t.self], color: '#3ad900' }, // Bright green
    { tag: [t.string, t.special(t.brace)], color: '#3ad900' }, // Math strings green
    { tag: t.operator, color: '#ffffff' },
    { tag: t.comment, color: '#8599a6', fontStyle: 'italic' },
    { tag: t.strong, fontWeight: 'bold' },
    { tag: t.emphasis, fontStyle: 'italic' },
  ],`;

const newStyles = `  styles: [
    { tag: [t.keyword, t.name, t.deleted, t.character, t.propertyName, t.macroName, t.variableName, t.labelName, t.color, t.constant(t.name), t.standard(t.name), t.definition(t.name), t.separator, t.annotation], color: '#ff66b2' },
    { tag: [t.function(t.variableName)], color: '#ff66b2' },
    { tag: [t.number, t.changed, t.modifier, t.self, t.string, t.special(t.brace), t.content, t.literal, t.heading, t.processingInstruction, t.inserted], color: '#3ad900' },
    { tag: [t.brace, t.bracket, t.angleBracket], color: '#3ad900' },
    { tag: t.operator, color: '#ff66b2' },
    { tag: t.comment, color: '#8599a6', fontStyle: 'italic' },
    { tag: t.strong, fontWeight: 'bold' },
    { tag: t.emphasis, fontStyle: 'italic' },
  ],`;

editorPanel = editorPanel.replace(oldStyles, newStyles);
fs.writeFileSync('src/components/latex-studio/EditorPanel.tsx', editorPanel);
console.log("Updated CodeMirror Theme");
