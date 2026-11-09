# cortex9-shell-quote-comment-line-terminator-model

Offline, inert model of **CVE-2026-102422** (GHSA-pqg4-j6r4-53mv, CWE-78) in
the npm package `shell-quote` `>= 1.8.4, < 1.11.0`. `quote()` emits a
`{ comment }` token as `#text`, which comments out the rest of the shell
line, **including the opening quote of a later string token**. A newline in
that later string ends the comment, and the rest of the string is read as
shell input. The fix, commit `6002b2ed90c6b83095eb272b6b0adaf3a172b0bc`
(in 1.11.0, see [evidence/fix-in-v1.11.0.md](evidence/fix-in-v1.11.0.md)),
throws a `TypeError` for a line terminator in any string after a comment.

Spanish: [README.es.md](README.es.md). Exercises: [PRACTICE.md](PRACTICE.md).

## The model

- `src/model.js` `quote(tokens, 'pre'|'post')`: the `sawComment` flag (diff
  L39, L51) and the new check (L41-43), plus the earlier comment-text check
  (L48-50, context; the fix for CVE-2026-9277). String quoting is a
  **reduced stand-in** (safe words as-is, else `'...'`); see LIMITATIONS.
- `posixCommands(text)`: counts the commands a POSIX `sh` would see in the
  emitted text (quotes, backslash, word-start `#` comments, `\n ; & |`).
  **No shell is ever run**; tests check that `child_process` is never used.
- Outcomes: `EXTRA_COMMAND` (text after the comment becomes a new command),
  `ONE_COMMAND`, `THROWS`, `UNTERMINATED_QUOTE`.

## Differential evidence (`results/summary.csv`)

| Class | n | pre: extra command | post: extra command | post: throws |
|---|---|---|---|---|
| pos (`\n` after a comment) | 3 | 3 | 0 | 3 |
| hardening (`\r`, U+2028, U+2029) | 3 | 0 | 0 | 3 |
| neg (unchanged) | 6 | 0 | 0 | 1 (same as pre) |

`p01` is the GHSA example: `["echo","ok",{comment:"x"},"a\nid;#"]` gives
`echo ok #x 'a` / `id;#'` before (two commands; the harmless `id` is the
GHSA's own) and a `TypeError` after. The `;#` matters: without it the
trailing quote is left open (`UNTERMINATED_QUOTE`).

**Honest nuance.** In POSIX `sh` only `\n` ends a line; `\r`, U+2028 and
U+2029 are ordinary characters, so the model shows no extra command for
them. The fix rejects them anyway; they are classed as hardening.

## Run (Node 20+, Python 3.10+, nothing installed)

```sh
node --test test/*.test.js
python3 scripts/derive_expected.py | diff - fixtures/expected.tsv
node scripts/gen_results.js /tmp/r && diff -r results /tmp/r
```

`fixtures/expected.tsv` comes from `scripts/derive_expected.py`, an
independent, line-oriented Python derivation that does not read
`src/model.js`.

A model is not a finding. See [LIMITATIONS.md](LIMITATIONS.md) and
[SOURCES.md](SOURCES.md). License: Apache-2.0.
