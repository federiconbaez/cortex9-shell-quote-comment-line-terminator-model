# Guía práctica (6 niveles)

Ejercicios **offline**: el modelo solo cuenta comandos en un texto, nunca
ejecuta una shell. Si quieres verlo en una shell real, hazlo en una VM o
contenedor tuyo, sin red y con comandos inofensivos (`id`, `echo`), y con
código tuyo, nunca contra servicios de terceros. Respuestas en
`test/practice.test.js`.

Ayuda: `node -e "const m=require('./src/model.js');console.log(m.run(['echo',{comment:'x'},'a\nid;#'],'pre'))"`.

**Básico**

1. **Qué emite un comentario.** `['echo', {comment:'x'}, 'y']`. (`echo #x y`)
2. **La comilla tragada.** `['echo', {comment:'x'}, 'a\nid;#']` en pre:
   ¿por qué la comilla de apertura no protege nada? (dos comandos)
   2b. Quita `;#`: ¿por qué queda una comilla sin cerrar?

**Intermedio**

3. **El fix.** Lo mismo en post. (`TypeError`, L41-43)
4. **El fix anterior.** `{comment:'a\nb'}` ya lanzaba antes (L48-50): ¿por
   qué no alcanzaba?

**Avanzado**

5. **Endurecimiento.** `'a\rid'` tras un comentario: pre da un solo
   comando en `sh` POSIX, post lanza igual. ¿Por qué rechazarlo de todos
   modos?
6. **Antes del comentario.** `['echo', 'a\nid', {comment:'x'}]`: ¿por qué
   el fix lo permite?

Más allá: agrega un caso a `fixtures/cases.json`, regenera
`fixtures/expected.tsv` con `scripts/derive_expected.py` y comprueba que
coinciden.
