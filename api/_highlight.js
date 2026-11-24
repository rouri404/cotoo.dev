// Small server-side syntax highlighter for the blog's code blocks. Each rule is [token class, regex source]; the first
// rule that matches at a position wins, so comments and strings come before keywords
const STR = `"(?:[^"\\\\\\n]|\\\\.)*"|'(?:[^'\\\\\\n]|\\\\.)*'`;
const NUM = `\\b0x[\\da-fA-F]+\\b|\\b\\d+(?:\\.\\d+)?\\b`;
const HASH_COMMENT = `(?<=^|\\s)#.*`;
const FN = `\\b[A-Za-z_$][\\w$]*(?=\\s*\\()`;
const words = (list) => `\\b(?:${list.split(' ').join('|')})\\b`;
// Start of a command: a new line (unless the last one ended in "\"), or after a pipe, separator or sudo
const CMD_START = `(?<=(?<!\\\\\\n)^[ \\t]*(?:\\$ +)?|[|;&(]\\s*|\\bsudo\\s+)`;

const JS_RULES = [
  ['com', `//.*|/\\*[\\s\\S]*?\\*/`],
  ['str', `${STR}|\`(?:[^\`\\\\]|\\\\[\\s\\S])*\``],
  ['kw', words('async await break case catch class const continue default delete do else export extends finally for from function if import in instanceof let new of return static super switch this throw try typeof var void while yield true false null undefined')],
  ['num', NUM],
  ['fn', FN],
];

const BASH_RULES = [
  ['com', HASH_COMMENT],
  ['str', STR],
  ['var', `\\$(?:\\{[^}\\n]*\\}|[A-Za-z_]\\w*|[0-9@*#?$!])`],
  ['kw', `${CMD_START}(?:if|then|else|elif|fi|for|while|until|do|done|case|esac|function|export|local|return|exit)\\b`],
  ['fn', `${CMD_START}[A-Za-z_./~][\\w./+~-]*`],
  ['key', `(?<=\\s)--?[A-Za-z][\\w-]*`],
];

const YAML_RULES = [
  ['com', HASH_COMMENT],
  ['key', `(?<=^[ \\t]*(?:- +)*)(?:"[^"\\n]*"|'[^'\\n]*'|[\\w.\\/-]+)(?=\\s*:(?:\\s|$))`],
  ['str', STR],
  ['var', `\\$\\{?\\w+\\}?`],
  ['kw', `(?<=:\\s+|-\\s+)(?:true|false|null|yes|no)(?=\\s*$)`],
  ['num', `(?<=:\\s+|-\\s+)\\d+(?:\\.\\d+)?(?=\\s*$)`],
];

const LANGS = {
  js: { rules: JS_RULES },
  bash: { rules: BASH_RULES },
  yaml: { rules: YAML_RULES },
  json: {
    rules: [
      ['key', `"(?:[^"\\\\\\n]|\\\\.)*"(?=\\s*:)`],
      ['str', `"(?:[^"\\\\\\n]|\\\\.)*"`],
      ['kw', words('true false null')],
      ['num', `-?\\b\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b`],
    ],
  },
  python: {
    rules: [
      ['com', `#.*`],
      ['str', `"""[\\s\\S]*?"""|'''[\\s\\S]*?'''|\\b[fFrRbB]?(?:${STR})`],
      ['kw', words('and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield True False None')],
      ['num', NUM],
      ['fn', FN],
    ],
  },
  sql: {
    flags: 'i',
    rules: [
      ['com', `--.*|/\\*[\\s\\S]*?\\*/`],
      ['str', `'(?:[^']|'')*'`],
      ['kw', words('select from where insert into values update set delete create drop alter table index view join left right inner outer on group by order having limit offset as and or not null primary key foreign references default unique distinct union if exists')],
      ['num', NUM],
      ['fn', FN],
    ],
  },
  dockerfile: {
    rules: [
      ['com', `^[ \\t]*#.*`],
      ['kw', `^[ \\t]*(?:FROM|RUN|CMD|LABEL|EXPOSE|ENV|ADD|COPY|ENTRYPOINT|VOLUME|USER|WORKDIR|ARG|ONBUILD|STOPSIGNAL|HEALTHCHECK|SHELL)\\b|\\bAS\\b`],
      ['str', STR],
      ['var', `\\$\\{?\\w+\\}?`],
      ['key', `(?<=\\s)--[a-z][\\w-]*`],
    ],
  },
  markdown: {
    rules: [
      ['kw', `^#{1,6} .*`],
      ['key', `\\*\\*[^*\\n]+\\*\\*`],
      ['str', '`[^`\\n]+`'],
    ],
  },
  // Terminal output and unknown languages: only comments, since anything else would be a guess
  plain: { rules: [['com', HASH_COMMENT]] },
};

const ALIASES = {
  javascript: 'js', jsx: 'js', mjs: 'js', ts: 'js', tsx: 'js', typescript: 'js',
  sh: 'bash', shell: 'bash', zsh: 'bash',
  yml: 'yaml', py: 'python', docker: 'dockerfile', md: 'markdown',
};

const compiled = new Map();
function compile(lang) {
  if (compiled.has(lang)) return compiled.get(lang);
  const { rules, flags = '' } = LANGS[lang];
  const entry = {
    classes: rules.map(([cls]) => cls),
    re: new RegExp(rules.map(([, src]) => `(${src})`).join('|'), `gm${flags}`),
  };
  compiled.set(lang, entry);
  return entry;
}

// Spans never cross a line break, so every line can be its own element for the theme wave
function highlightCode(text, rawLang, escapeHtml) {
  const key = String(rawLang || '').toLowerCase();
  const lang = LANGS[key] ? key : ALIASES[key] || 'plain';
  const { classes, re } = compile(lang);
  const lines = [''];
  const push = (chunk, cls) => {
    chunk.split('\n').forEach((part, i) => {
      if (i) lines.push('');
      if (!part) return;
      const safe = escapeHtml(part);
      lines[lines.length - 1] += cls ? `<span class="tok-${cls}">${safe}</span>` : safe;
    });
  };
  let last = 0;
  re.lastIndex = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (!m[0]) {
      re.lastIndex++;
      continue;
    }
    push(text.slice(last, m.index));
    push(m[0], classes[m.slice(1).findIndex((g) => g !== undefined)]);
    last = m.index + m[0].length;
  }
  push(text.slice(last));
  return lines.map((line) => `<span class="code-line">${line}</span>`).join('\n');
}

module.exports = { highlightCode };
