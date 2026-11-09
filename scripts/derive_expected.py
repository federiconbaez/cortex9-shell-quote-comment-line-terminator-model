"""Independent expectations for fixtures/cases.json.

Written again from the saved diff and GHSA-pqg4-j6r4-53mv, without reading
src/model.js: a line-oriented pass (split on unquoted newlines, drop
comments, split on separators) instead of the model's single scanner.
Prints fixtures/expected.tsv. Python 3.10+ standard library only.
"""

import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
TERMINATORS = ("\n", "\r", "\u2028", "\u2029")
SAFE = re.compile(r"[A-Za-z0-9_./:=@%+,-]+")


def has_terminator(s):
    return any(t in s for t in TERMINATORS)


def quote_one(tok):
    if tok == "":
        return "''"
    if SAFE.fullmatch(tok):
        return tok
    return "'" + tok.replace("'", "'\\''") + "'"


def emit(tokens, version):
    """Return the quoted string, or None when quote() would throw."""
    parts = []
    after_comment = False
    for tok in tokens:
        if isinstance(tok, dict):
            if has_terminator(tok["comment"]):
                return None
            after_comment = True
            parts.append("#" + tok["comment"])
            continue
        if version == "post" and after_comment and has_terminator(tok):
            return None
        parts.append(quote_one(tok))
    return " ".join(parts)


def logical_lines(text):
    """Split on unquoted, unescaped newlines; drop word-start '#' comments.

    A comment is recognised before quotes: once '#' starts a word, nothing
    up to the next newline is read, not even a quote character.
    """
    lines, cur, quote, i = [], [], "", 0
    while i < len(text):
        ch = text[i]
        word_start = not cur or cur[-1] in " \t;&|"
        if quote:
            cur.append(ch)
            if ch == "\\" and quote == '"' and i + 1 < len(text):
                cur.append(text[i + 1])
                i += 1
            elif ch == quote:
                quote = ""
        elif ch == "\n":
            lines.append("".join(cur))
            cur = []
        elif ch == "#" and word_start:
            nl = text.find("\n", i)
            i = len(text) if nl < 0 else nl
            continue
        else:
            cur.append(ch)
            if ch in "'\"":
                quote = ch
            elif ch == "\\" and i + 1 < len(text):
                cur.append(text[i + 1])
                i += 1
        i += 1
    lines.append("".join(cur))
    return lines


def count_commands(text):
    total = 0
    for line in logical_lines(text):
        masked = re.sub(r"'[^']*'|\"(?:\\.|[^\"\\])*\"", "Q", line)
        pieces = re.split(r"[;&|]", masked)
        total += sum(1 for p in pieces if p.strip())
    return total


def main():
    data = json.loads((ROOT / "fixtures/cases.json").read_text(encoding="utf-8"))
    print("id\tversion\toutcome\tcommands\toutput")
    for case in data["cases"]:
        for version in ("pre", "post"):
            out = emit(case["tokens"], version)
            if out is None:
                row = ("THROWS", 0, None)
            else:
                n = count_commands(out)
                row = ("EXTRA_COMMAND" if n > 1 else "ONE_COMMAND", n, out)
            print(f"{case['id']}\t{version}\t{row[0]}\t{row[1]}\t{json.dumps(row[2])}")


if __name__ == "__main__":
    main()
