'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const m = require('../src/model.js');
const { cases } = require('../fixtures/cases.json');

const expected = new Map();
for (const line of fs.readFileSync(path.join(__dirname, '../fixtures/expected.tsv'), 'utf8')
  .trim().split('\n').slice(1)) {
  const [id, v, outcome, n, out] = line.split('\t');
  expected.set(`${id}|${v}`, [outcome, Number(n), JSON.parse(out)]);
}

test('expected.tsv covers every case and version', () => {
  assert.equal(expected.size, cases.length * 2);
});

for (const c of cases) {
  for (const v of m.VERSIONS) {
    test(`${c.id} ${v}: model == independent derivation == hand label`, () => {
      const r = m.run(c.tokens, v);
      const got = [r.outcome, r.commands, r.output];
      assert.deepEqual(got, expected.get(`${c.id}|${v}`));
      assert.deepEqual(got, c.expected[v]);
    });
  }
}

test('diff tests L87-88: the two expected outputs', () => {
  for (const v of m.VERSIONS) {
    assert.equal(m.quote(['echo', 'a\nb', { comment: 'x' }], v), "echo 'a\nb' #x");
    assert.equal(m.quote(['echo', { comment: 'x' }, 'y'], v), 'echo #x y');
  }
});

test('acceptance: every pos is EXTRA_COMMAND before and THROWS after', () => {
  for (const c of cases.filter((k) => k.class === 'pos')) {
    assert.equal(m.run(c.tokens, 'pre').outcome, 'EXTRA_COMMAND', c.id);
    assert.equal(m.run(c.tokens, 'post').outcome, 'THROWS', c.id);
    assert.equal(m.run(c.tokens, 'post').rule, 'L41-43', c.id);
  }
});

test('acceptance: every neg is identical before and after', () => {
  for (const c of cases.filter((k) => k.class === 'neg')) {
    assert.deepEqual(m.run(c.tokens, 'pre'), m.run(c.tokens, 'post'), c.id);
  }
});
