# cortex9-shell-quote-comment-line-terminator-model

Modelo offline e inerte de **CVE-2026-102422** (GHSA-pqg4-j6r4-53mv,
CWE-78) en el paquete npm `shell-quote` `>= 1.8.4, < 1.11.0`. `quote()`
emite un token `{ comment }` como `#texto`, que comenta el resto de la línea,
**incluida la comilla de apertura de un string posterior**. Un salto de línea
en ese string termina el comentario y el resto se lee como entrada de shell.
El fix, commit `6002b2ed90c6b83095eb272b6b0adaf3a172b0bc` (en 1.11.0, ver
[evidence/fix-in-v1.11.0.md](evidence/fix-in-v1.11.0.md)), lanza `TypeError`
ante un terminador de línea en cualquier string posterior a un comentario.

Inglés: [README.md](README.md). Ejercicios: [PRACTICE.md](PRACTICE.md).

## El modelo

- `src/model.js` `quote(tokens, 'pre'|'post')`: la bandera `sawComment`
  (L39, L51 del diff), el chequeo nuevo (L41-43) y el chequeo anterior del
  texto del comentario (L48-50, contexto). El quoting de strings es un
  **sustituto reducido**; ver LIMITATIONS.
- `posixCommands(texto)`: cuenta los comandos que vería un `sh` POSIX.
  **Nunca se ejecuta una shell.**

## Evidencia diferencial (`results/summary.csv`)

| Clase | n | pre: comando extra | post: comando extra | post: lanza |
|---|---|---|---|---|
| pos (`\n` tras un comentario) | 3 | 3 | 0 | 3 |
| endurecimiento (`\r`, U+2028, U+2029) | 3 | 0 | 0 | 3 |
| neg (sin cambio) | 6 | 0 | 0 | 1 (igual que pre) |

**Matiz.** En `sh` POSIX solo `\n` termina una línea; `\r`, U+2028 y U+2029
son caracteres comunes, así que el modelo no muestra comando extra con
ellos. El fix los rechaza igual: se clasifican como endurecimiento.

## Uso

```sh
node --test test/*.test.js
python3 scripts/derive_expected.py | diff - fixtures/expected.tsv
node scripts/gen_results.js /tmp/r && diff -r results /tmp/r
```

Un modelo no es un hallazgo. Ver [LIMITATIONS.md](LIMITATIONS.md) y
[SOURCES.md](SOURCES.md). Licencia: Apache-2.0.
