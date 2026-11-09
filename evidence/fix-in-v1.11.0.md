# Is commit 6002b2e in shell-quote 1.11.0?

Answer: **yes**, and not in 1.10.0.

- GHSA-pqg4-j6r4-53mv (saved `ghsa_rec/CVE-2026-102422.json`, sha256
  cd7f73117639d6aba89250bf68d18cfd924a9ee7e655ef8e53c1ee66536ac000):
  npm `shell-quote` `>= 1.8.4, < 1.11.0`, first patched `1.11.0`; references
  commit 6002b2ed90c6b83095eb272b6b0adaf3a172b0bc.
- Read-only GitHub API, 2026-11-09 (ART). Raw responses kept outside the
  repo (they contain upstream committer e-mail addresses).

| Request | status / ahead_by / behind_by | SHA-256 of raw response |
|---|---|---|
| `GET /repos/ljharb/shell-quote/compare/6002b2ed90c6b83095eb272b6b0adaf3a172b0bc...v1.11.0` | `ahead` / 7 / 0, merge base 6002b2e | dc24e7b3faa0fe376a1d5a0f7fd2b5fe2f20cdecc5bfa86ba3f8181fcb22a3f2 |
| `GET /repos/ljharb/shell-quote/compare/v1.10.0...6002b2ed90c6b83095eb272b6b0adaf3a172b0bc` | `ahead` / 8 / 0 | ca709c3e649801db15d0d187300474ea365c951e5f43c005e8f2035b4f75aec1 |

The fix commit is dated 2026-09-27T09:05:08Z; the v1.11.0 tag commit
88241f8fa324a85da03b40fc69443c069837b472 is dated 2026-09-29T02:29:38Z.
The 7 commits between them include `quote` changes ("preserve `!` in
arguments that also contain `'`", "drop a replace that can never match in
the single-quote branch") that this model does not reproduce.

The independent audit (`review/cve2026-audit-sentinel.md`, sha256
38e45892cc42d5ca39ecbd049f35cea0147b70b3a4c3e7f6aba35025a5418d9a, item 15)
reaches the same result.
