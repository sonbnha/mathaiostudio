/**
 * LaTeX Preprocessor
 * 1. Guarantees essential math packages (amsmath, amssymb, amsfonts, mathtools) in preamble.
 * 2. Automatically detects naked math commands, symbols, super/subscripts, and environments
 *    outside math mode and wraps them with $...$ to prevent "Missing $ inserted" errors.
 */

const ESSENTIAL_PACKAGES = ['amsmath', 'amssymb', 'amsfonts', 'mathtools'];

const FULL_MATH_ENVIRONMENTS = [
  'equation',
  'equation*',
  'align',
  'align*',
  'alignat',
  'alignat*',
  'gather',
  'gather*',
  'multline',
  'multline*',
  'flalign',
  'flalign*',
  'math',
  'displaymath',
  'tikzpicture',
  'tabular',
  'verbatim',
  'lstlisting',
  'minted',
];

const INLINE_MATH_ENVIRONMENTS = [
  'cases',
  'dcases',
  'rcases',
  'matrix',
  'pmatrix',
  'bmatrix',
  'vmatrix',
  'Vmatrix',
  'smallmatrix',
];

// Distinct math commands that require math mode
const MATH_COMMANDS = [
  'dfrac', 'frac', 'cfrac', 'sqrt', 'int', 'iint', 'iiint', 'oint',
  'sum', 'prod', 'coprod', 'lim', 'limsup', 'liminf',
  'vec', 'overrightarrow', 'overleftarrow', 'widehat', 'widecheck', 'widetilde',
  'overbrace', 'underbrace', 'left', 'right', 'pm', 'mp', 'times', 'div', 'cdot',
  'ast', 'star', 'bullet', 'cap', 'cup', 'setminus', 'emptyset', 'varnothing',
  'le', 'ge', 'leq', 'geq', 'neq', 'approx', 'equiv', 'sim', 'cong', 'simeq',
  'll', 'gg', 'subset', 'supset', 'subseteq', 'supseteq', 'in', 'notin', 'ni',
  'propto', 'perp', 'parallel', 'not\\\\parallel', 'angle', 'forall', 'exists',
  'nexists', 'implies', 'impliedby', 'iff', 'to', 'rightarrow', 'leftarrow',
  'Rightarrow', 'Leftarrow', 'Leftrightarrow', 'neg', 'land', 'lor',
  'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon', 'zeta', 'eta',
  'theta', 'vartheta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'pi',
  'varpi', 'rho', 'varrho', 'sigma', 'varsigma', 'tau', 'upsilon', 'phi',
  'varphi', 'chi', 'psi', 'omega', 'Gamma', 'Delta', 'Theta', 'Lambda',
  'Xi', 'Pi', 'Sigma', 'Upsilon', 'Phi', 'Psi', 'Omega',
  'mathbb', 'mathbf', 'mathcal', 'degree'
];

const MATH_CMD_REGEX_STRING = `\\\\(?:${MATH_COMMANDS.join('|')})\\b`;

/**
 * Ensures preamble contains amsmath, amssymb, amsfonts, mathtools
 */
export function ensureMathPreamble(source: string): string {
  if (!source.includes('\\documentclass')) {
    return source;
  }

  const docClassMatch = source.match(/\\documentclass(\[[^\]]*\])?\{[^}]+\}/);
  if (!docClassMatch || docClassMatch.index === undefined) return source;

  const docClassEndIndex = docClassMatch.index + docClassMatch[0].length;
  const docBeginIdx = source.indexOf('\\begin{document}');
  const preamble =
    docBeginIdx !== -1 ? source.substring(0, docBeginIdx) : source;

  const missing = ESSENTIAL_PACKAGES.filter(
    (pkg) => !new RegExp(`\\\\usepackage(?:\\s*\\[[^\\]]*\\])?\\s*\\{[^}]*\\b${pkg}\\b[^}]*\\}`).test(preamble)
  );

  if (missing.length > 0) {
    const pkgString = `\n\\usepackage{${missing.join(', ')}}\n`;
    return (
      source.substring(0, docClassEndIndex) +
      pkgString +
      source.substring(docClassEndIndex)
    );
  }
  return source;
}

/**
 * Wrap standalone math expressions inside text mode segments with $ ... $
 */
function processTextChunk(text: string): string {
  let result = text;

  // 1. Wrap standalone inner environments like \begin{cases}...\end{cases}, \begin{pmatrix}...\end{pmatrix}
  for (const env of INLINE_MATH_ENVIRONMENTS) {
    const envRegex = new RegExp(
      `\\\\begin\\{${env}\\}[\\s\\S]*?\\\\end\\{${env}\\}`,
      'g'
    );
    result = result.replace(envRegex, (m) => `$${m}$`);
  }

  // 2. Wrap isolated math commands with optional args and scripts:
  // e.g. \dfrac{...}{...}, \sqrt[3]{...}, \int_{a}^{b}, \alpha, \mathbb{R}, \vec{u}, etc.
  const commandPattern = new RegExp(
    `(${MATH_CMD_REGEX_STRING}(?:(?:\\[[^\\]]*\\])|(?:\\{[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\}))*(?:(?:[_\\^](?:\\{[^{}]*\\}|[a-zA-Z0-9\\\\])))*)`,
    'g'
  );

  result = result.replace(commandPattern, (m) => `$${m}$`);

  // 3. Wrap naked scripts on words or numbers, e.g. x^2, y_1, 180^\circ, AB^2
  result = result.replace(
    /(?<!\$|[a-zA-Z0-9_\\])([a-zA-Z0-9]+[\^_](?:\{[^{}]*\}|[a-zA-Z0-9\\^\circ]+))(?!\$|[a-zA-Z0-9_\\])/g,
    (m) => `$${m}$`
  );

  // 4. Merge immediately adjacent dollar signs: e.g. $$ -> $$ or $a$$b$ -> $ab$ or $a$ $b$ (optional clean)
  result = result.replace(/\$\s*\$/g, ' ');

  return result;
}

/**
 * Preprocesses LaTeX source code before compilation
 */
export function preprocessLatex(source: string): string {
  if (!source || typeof source !== 'string') return source;

  // 1. Ensure Preamble
  const codeWithPreamble = ensureMathPreamble(source);

  // 2. Identify Document Body vs Preamble
  const docBeginMatch = codeWithPreamble.match(/\\begin\{document\}/);
  const docEndMatch = codeWithPreamble.match(/\\end\{document\}/);

  let prefix = '';
  let body = codeWithPreamble;
  let suffix = '';

  if (docBeginMatch && docBeginMatch.index !== undefined) {
    const beginIndex = docBeginMatch.index + docBeginMatch[0].length;
    prefix = codeWithPreamble.substring(0, beginIndex);

    if (docEndMatch && docEndMatch.index !== undefined) {
      body = codeWithPreamble.substring(beginIndex, docEndMatch.index);
      suffix = codeWithPreamble.substring(docEndMatch.index);
    } else {
      body = codeWithPreamble.substring(beginIndex);
    }
  }

  // 3. Extract and stash protected math environments and delimiters
  const placeholders: string[] = [];
  const placeholderPrefix = `@@MATHBLOCK_${Date.now()}_`;

  const pushPlaceholder = (match: string) => {
    const id = `${placeholderPrefix}${placeholders.length}@@`;
    placeholders.push(match);
    return id;
  };

  // Stash multiline comments
  let protectedBody = body.replace(/(^|[^\\])%.*$/gm, (m) => pushPlaceholder(m));

  // Stash display/full math environments
  for (const env of FULL_MATH_ENVIRONMENTS) {
    const envRegex = new RegExp(
      `\\\\begin\\{${env.replace('*', '\\*')}\\}[\\s\\S]*?\\\\end\\{${env.replace('*', '\\*')}\\}`,
      'g'
    );
    protectedBody = protectedBody.replace(envRegex, (m) => pushPlaceholder(m));
  }

  // Stash $$ ... $$
  protectedBody = protectedBody.replace(/\$\$[\s\S]*?\$\$/g, (m) => pushPlaceholder(m));

  // Stash \[ ... \]
  protectedBody = protectedBody.replace(/\\\[[\s\S]*?\\\]/g, (m) => pushPlaceholder(m));

  // Stash \( ... \)
  protectedBody = protectedBody.replace(/\\\([\s\S]*?\\\)/g, (m) => pushPlaceholder(m));

  // Stash $ ... $ (inline math, non-empty, ignoring escaped \$)
  protectedBody = protectedBody.replace(/(?<!\\)\$(?!\$)((?:\\\$|[^\$])+?)(?<!\\)\$/g, (m) =>
    pushPlaceholder(m)
  );

  // 4. Now process remaining unprotected text
  const transformedBody = processTextChunk(protectedBody);

  // 5. Restore placeholders
  let finalBody = transformedBody;
  for (let i = 0; i < placeholders.length; i++) {
    const id = `${placeholderPrefix}${i}@@`;
    finalBody = finalBody.replace(id, () => placeholders[i]);
  }

  return prefix + finalBody + suffix;
}
