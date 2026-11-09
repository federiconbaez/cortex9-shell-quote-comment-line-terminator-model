'use strict';
// Offline, inert model of shell-quote quote() before and after commit
// 6002b2ed90c6b83095eb272b6b0adaf3a172b0bc (CVE-2026-102422).
// Lnnn = `cat -n` line of the saved diff
// diffs/CVE-2026-102422_shell-quote_6002b2ed90c6.diff (see SOURCES.md).
// Nothing here runs a shell: posixCommands() only counts commands in text.

const VERSIONS = ['pre', 'post'];

// Line terminators named by GHSA-pqg4-j6r4-53mv ("Patches"). The real
// LINE_TERMINATORS constant of quote.js is outside the diff hunks.
const LINE_TERMINATORS = /[\n\r\u2028\u2029]/;

// MODEL ASSUMPTION: a reduced string quoting, not the real quote.js rules
// (also outside the hunks). Safe words pass as-is; anything else is
// single-quoted with ' written as '\''. It reproduces the two expected
// outputs in the diff's tests (L87-88).
const SAFE = /^[A-Za-z0-9_./:=@%+,-]+$/;

function quoteString(s) {
  if (s === '') return "''"; // L44-45 (context)
  if (SAFE.test(s)) return s;
  return `'${s.split("'").join("'\\''")}'`;
}

class ModelTypeError extends Error {
  constructor(message, rule) {
    super(message);
    this.name = 'TypeError';
    this.rule = rule;
  }
}

function quote(xs, version) {
  if (!VERSIONS.includes(version)) throw new Error(`unknown version ${version}`);
  let sawComment = false; // L39 (+)
  return xs.map((s) => {
    if (version === 'post' && sawComment && typeof s === 'string'
      && LINE_TERMINATORS.test(s)) {
      // L41-43 (+)
      throw new ModelTypeError(
        'a token after a `comment` must not contain line terminators', 'L41-43');
    }
    if (typeof s === 'string') return quoteString(s);
    if (s && typeof s === 'object' && Object.keys(s).length === 1
      && typeof s.comment === 'string') {
      if (LINE_TERMINATORS.test(s.comment)) {
        // L48-50 (context): the earlier fix for CVE-2026-9277, in both versions
        throw new ModelTypeError('`comment` must not contain line terminators', 'L48-50');
      }
      sawComment = true; // L51 (+); harmless in pre, where nothing reads it
      return `#${s.comment}`; // L52
    }
    // MODEL REDUCTION: {op} and {op:'glob'} shapes are not modelled.
    throw new ModelTypeError('token shape not modelled', 'MODEL');
  }).join(' ');
}

// Count the commands a POSIX sh would see in `text`, without running it.
// Handles '...', "..." (backslash escapes), backslash, word-start '#'
// comments to end of line, and the separators \n ; & | (&& and || too).
// Only \n ends a line in POSIX sh; \r, U+2028 and U+2029 are ordinary
// characters there.
function posixCommands(text) {
  const cmds = [];
  let cmd = [];
  let word = null;
  const endWord = () => { if (word !== null) { cmd.push(word); word = null; } };
  const endCmd = () => { endWord(); if (cmd.length) cmds.push(cmd); cmd = []; };
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === "'") {
      const j = text.indexOf("'", i + 1);
      if (j < 0) return { error: 'UNTERMINATED_QUOTE', commands: cmds };
      word = (word ?? '') + text.slice(i + 1, j);
      i = j + 1;
    } else if (c === '"') {
      let j = i + 1;
      let buf = '';
      while (j < text.length && text[j] !== '"') {
        if (text[j] === '\\' && j + 1 < text.length) { buf += text[j + 1]; j += 2; } else { buf += text[j]; j += 1; }
      }
      if (j >= text.length) return { error: 'UNTERMINATED_QUOTE', commands: cmds };
      word = (word ?? '') + buf;
      i = j + 1;
    } else if (c === '\\') {
      if (text[i + 1] === '\n') { i += 2; continue; }
      word = (word ?? '') + (text[i + 1] ?? '');
      i += 2;
    } else if (c === ' ' || c === '\t') {
      endWord(); i += 1;
    } else if (c === '\n' || c === ';' || c === '&' || c === '|') {
      endCmd(); i += 1;
    } else if (c === '#' && word === null) {
      const j = text.indexOf('\n', i);
      i = j < 0 ? text.length : j;
    } else {
      word = (word ?? '') + c; i += 1;
    }
  }
  endCmd();
  return { error: null, commands: cmds };
}

// One case, one version -> { outcome, commands, output, rule }.
function run(tokens, version) {
  let output;
  try {
    output = quote(tokens, version);
  } catch (e) {
    if (e instanceof ModelTypeError) {
      return { outcome: 'THROWS', commands: 0, output: null, rule: e.rule };
    }
    throw e;
  }
  const r = posixCommands(output);
  if (r.error) return { outcome: r.error, commands: r.commands.length, output, rule: 'EMIT' };
  const n = r.commands.length;
  return { outcome: n > 1 ? 'EXTRA_COMMAND' : 'ONE_COMMAND', commands: n, output, rule: 'EMIT' };
}

module.exports = { VERSIONS, LINE_TERMINATORS, quote, quoteString, posixCommands, run, ModelTypeError };
