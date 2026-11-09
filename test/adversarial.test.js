'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');
const m = require('../src/model.js');
const { cases } = require('../fixtures/cases.json');

const C = { comment: 'x' };

test('model and scripts never reference a process or eval API', () => {
  for (const f of ['src/model.js', 'scripts/gen_results.js', 'scripts/derive_expected.py']) {
    const src = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
    for (const bad of ['child_process', 'spawn(', 'execSync', 'eval(', 'new Function', 'subprocess', 'os.system']) {
      assert.ok(!src.includes(bad), `${f} contains ${bad}`);
    }
  }
});

test('running every case never touches child_process', (t) => {
  for (const fn of ['exec', 'execSync', 'spawn', 'spawnSync', 'execFile', 'execFileSync', 'fork']) {
    t.mock.method(childProcess, fn, () => { throw new Error(`${fn} called`); });
  }
  for (const c of cases) for (const v of m.VERSIONS) m.run(c.tokens, v);
});

test('post: a terminator anywhere in any later token throws', () => {
  for (const s of ['\nx', 'x\n', 'a\r', '\u2028', 'x\u2029y']) {
    assert.throws(() => m.quote(['a', C, 'b', 'c', s], 'post'), { name: 'TypeError' });
  }
});

test('post: the flag never resets after a second comment', () => {
  assert.throws(() => m.quote(['a', C, 'b', { comment: 'y' }, 'c\nd'], 'post'));
});

test('post: terminators only before the first comment are allowed', () => {
  assert.equal(m.quote(['a\nb', 'c\rd', C], 'post'), "'a\nb' 'c\rd' #x");
});

test('NEL (U+0085) and VT are not in the GHSA list: not rejected', () => {
  for (const s of ['a\u0085b', 'a\u000bb']) {
    assert.doesNotThrow(() => m.quote(['echo', C, s], 'post'));
  }
});

test('pre: the line split exists only for \\n in POSIX sh', () => {
  assert.equal(m.run(['echo', C, 'a\nid;#'], 'pre').commands, 2);
  for (const t of ['\r', '\u2028', '\u2029']) {
    assert.equal(m.run(['echo', C, `a${t}id;#`], 'pre').commands, 1);
  }
});

test('quoting round-trips through the analyzer', () => {
  for (const s of ["it's", 'a b', '$(x)', '`x`', 'a;b', 'a|b', '#x', "''", 'a\nb', '\\']) {
    const r = m.posixCommands(`echo ${m.quoteString(s)}`);
    assert.deepEqual(r.commands, [['echo', s]], JSON.stringify(s));
  }
});

test('analyzer: # inside a word is not a comment, at word start it is', () => {
  assert.deepEqual(m.posixCommands('echo a#b #c\nls').commands, [['echo', 'a#b'], ['ls']]);
});

test('analyzer: separators, continuation and unterminated quotes', () => {
  assert.equal(m.posixCommands('a && b || c | d & e; f').commands.length, 6);
  assert.deepEqual(m.posixCommands('ec\\\nho x').commands, [['echo', 'x']]);
  assert.equal(m.posixCommands("echo 'x").error, 'UNTERMINATED_QUOTE');
});

test('unmodelled token shapes fail closed', () => {
  assert.equal(m.run([{ op: ';' }], 'pre').outcome, 'THROWS');
  assert.equal(m.run([{ comment: 'x', extra: 1 }], 'post').rule, 'MODEL');
  assert.throws(() => m.quote(['a'], 'v9'));
});

test('results are deterministic', () => {
  const a = cases.map((c) => JSON.stringify(m.run(c.tokens, 'pre')));
  const b = cases.map((c) => JSON.stringify(m.run(c.tokens, 'pre')));
  assert.deepEqual(a, b);
});
