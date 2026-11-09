'use strict';
// Regenerate results/ deterministically: node scripts/gen_results.js OUTDIR
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const m = require('../src/model.js');
const { cases } = require('../fixtures/cases.json');

const csv = (x) => {
  const s = x === null ? '' : String(x);
  return /[",\n\r\u2028\u2029]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function main(out) {
  fs.mkdirSync(out, { recursive: true });
  // `output` is JSON-encoded so control characters stay visible and the
  // file stays one row per line.
  const rows = ['id,class,version,outcome,commands,rule,diff,output_json'];
  for (const c of cases) {
    for (const v of m.VERSIONS) {
      const r = m.run(c.tokens, v);
      rows.push([c.id, c.class, v, r.outcome, r.commands, r.rule, c.diff,
        JSON.stringify(r.output)].map(csv).join(','));
    }
  }
  fs.writeFileSync(path.join(out, 'cases.csv'), `${rows.join('\n')}\n`);
  const summ = ['class,n,pre_extra_command,post_extra_command,pre_throws,post_throws'];
  for (const cls of ['pos', 'hardening', 'neg']) {
    const sel = cases.filter((c) => c.class === cls);
    const count = (v, o) => sel.filter((c) => m.run(c.tokens, v).outcome === o).length;
    summ.push([cls, sel.length, count('pre', 'EXTRA_COMMAND'), count('post', 'EXTRA_COMMAND'),
      count('pre', 'THROWS'), count('post', 'THROWS')].join(','));
  }
  fs.writeFileSync(path.join(out, 'summary.csv'), `${summ.join('\n')}\n`);
  const sums = ['cases.csv', 'summary.csv'].map((f) => {
    const h = crypto.createHash('sha256').update(fs.readFileSync(path.join(out, f))).digest('hex');
    return `${h}  ${f}`;
  });
  fs.writeFileSync(path.join(out, 'SHA256SUMS'), `${sums.join('\n')}\n`);
}

if (process.argv.length !== 3) {
  process.stderr.write('usage: node scripts/gen_results.js OUTDIR\n');
  process.exit(2);
}
main(process.argv[2]);
