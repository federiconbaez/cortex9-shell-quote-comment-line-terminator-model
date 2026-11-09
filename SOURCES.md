# Sources

Local copies under `security-research-45/sources/cve2026/` (not in this
repo). SHA-256 re-verified against `sources/cve2026/SHA256SUMS` when this
repo was built. `Lnnn` are `cat -n` line numbers of the diff file.

| Source | URL | Used for | SHA-256 of copy |
|---|---|---|---|
| Fix commit 6002b2ed90c6b83095eb272b6b0adaf3a172b0bc (2026-09-27, "[Fix] `quote`: reject line terminators in tokens after a `comment`") as `diffs/CVE-2026-102422_shell-quote_6002b2ed90c6.diff` | https://github.com/ljharb/shell-quote/commit/6002b2ed90c6b83095eb272b6b0adaf3a172b0bc | `sawComment` L39/L51, new throw L41-43, comment-text check L48-50 (context), upstream tests L71-90 | 0210f7af95a4840ec4e443388dbdd839e2d89ff411c22f8739252dd6225dba0a |
| GHSA-pqg4-j6r4-53mv (`ghsa_rec/CVE-2026-102422.json`, published 2026-10-06) | https://github.com/ljharb/shell-quote/security/advisories/GHSA-pqg4-j6r4-53mv | affected `>= 1.8.4, < 1.11.0`, patched 1.11.0, CWE-78, the list of line terminators, the `p01` example | cd7f73117639d6aba89250bf68d18cfd924a9ee7e655ef8e53c1ee66536ac000 |
| NVD CVE-2026-102422 (`nvd/CVE-2026-102422.json`, status Deferred, published 2026-09-29) | https://nvd.nist.gov/vuln/detail/CVE-2026-102422 | the CVE ID exists and points to the commit and GHSA | bfc729c6f3de0e13d01e2b7046aab37368f22f7042f566b36f088edc5cbd58cc |
| Compare API, read-only (2026-11-09) | https://github.com/ljharb/shell-quote/compare/v1.10.0...v1.11.0 | the fix is in 1.11.0, not in 1.10.0: `evidence/fix-in-v1.11.0.md` | see that file |

No source contained instructions addressed to a tool or agent.
