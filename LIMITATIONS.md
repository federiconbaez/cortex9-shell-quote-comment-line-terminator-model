# Limitations

- **Reduced quoting.** The real string-quoting rules of `quote.js` and the
  real `LINE_TERMINATORS` constant are outside the diff hunks. The model
  single-quotes any non-trivial string and takes the terminator list from
  the GHSA. Outputs match the two expected outputs in the upstream tests
  (L87-88) but are **not verified** to be byte-identical to shell-quote for
  other inputs (e.g. strings with `'`, `!`, `$`). Commits between the fix
  and v1.11.0 also change `quote`.
- **Token shapes.** `{ op }` and `{ op: 'glob', pattern }` are not modelled;
  they fail closed. `parse()` is not modelled: `p03` writes by hand the
  token shape the GHSA says `parse()` produces for a mid-word `#`; its exact
  output is **not verified**.
- **Not a shell.** `posixCommands` is a small POSIX-style counter, not a
  shell grammar (no here-docs, `$'...'`, subshells, expansions, aliases).
  Whether `bash`, `dash`, `ksh` or `zsh` treat `\r`, U+2028 or U+2029 as a
  line end in any mode was **not tested**; nothing was executed.
- **Callers.** Whether a given application passes attacker-controlled
  strings after a comment token is outside this model.
- This is not a finding and not an exploit. The only command named in the
  fixtures is the GHSA's harmless `id`, as inert text.
