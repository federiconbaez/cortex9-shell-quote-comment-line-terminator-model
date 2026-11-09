'use strict';
// Answers to PRACTICE.md (offline, model only).
const test = require('node:test');
const assert = require('node:assert/strict');
const m = require('../src/model.js');

const C = { comment: 'x' };

test('level 1: what a comment token emits', () => {
  assert.equal(m.quote(['echo', C, 'y'], 'pre'), 'echo #x y');
});

test('level 2: the comment swallows the opening quote', () => {
  const out = m.quote(['echo', C, 'a\nid;#'], 'pre');
  assert.equal(out, "echo #x 'a\nid;#'");
  assert.deepEqual(m.posixCommands(out).commands, [['echo'], ['id']]);
});

test('level 2b: why the GHSA example ends in ;#', () => {
  // Without it the closing quote is left open on the second line.
  assert.equal(m.run(['echo', C, 'a\nid'], 'pre').outcome, 'UNTERMINATED_QUOTE');
});

test('level 3: the fix', () => {
  assert.throws(() => m.quote(['echo', C, 'a\nid'], 'post'), /after a `comment`/);
});

test('level 4: the earlier fix covered only the comment text', () => {
  assert.throws(() => m.quote(['echo', { comment: 'a\nb' }], 'pre'), /`comment` must not/);
});

test('level 5: \\r is hardening, not a split, in POSIX sh', () => {
  assert.equal(m.run(['echo', C, 'a\rid'], 'pre').outcome, 'ONE_COMMAND');
  assert.equal(m.run(['echo', C, 'a\rid'], 'post').outcome, 'THROWS');
});

test('level 6: before a comment, newlines stay quoted', () => {
  assert.equal(m.run(['echo', 'a\nid', C], 'post').outcome, 'ONE_COMMAND');
});
