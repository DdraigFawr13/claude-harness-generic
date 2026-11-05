// Tests for scripts/harness.mjs. Run: node --test
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  doctor,
  handoffProblems,
  init,
  kitCheck,
  main,
  parseArgs,
  parseRules,
  placeholders,
  renderRules,
  ruleProblems,
  run,
  writeRules,
} from '../scripts/harness.mjs';

const kitDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const silent = () => {};
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'harness-'));
const read = (dir, rel) => fs.readFileSync(path.join(dir, rel), 'utf8');
const write = (dir, rel, text) => fs.writeFileSync(path.join(dir, rel), text);
const node = JSON.stringify(process.execPath); // quoted: the path can contain spaces on Windows

/** A project set up by init with every placeholder filled, so doctor passes. */
function filledProject() {
  const dir = tmp();
  init({ kitDir, target: dir, project: 'demo', shell: 'bash', checks: [`${node} -e "process.exit(0)"`], date: '2026-01-01', log: silent });
  for (const rel of ['AGENTS.md', 'docs/HANDOFF.md', 'docs/DECISIONS.md']) write(dir, rel, read(dir, rel).replace(/\{\{FILL:[^}]*\}\}/g, 'filled'));
  return dir;
}

const RULES = `# Example

- **EX-01** Do the thing.
  <!-- why: it broke once. | source: test -->
- **EX-02** SUPERSEDED by EX-01: merged
  <!-- why: old. | source: test -->
`;

test('parseRules reads ids, text, why, source and superseded, with LF or CRLF', () => {
  for (const text of [RULES, RULES.replace(/\n/g, '\r\n')]) {
    const { title, rules } = parseRules(text);
    assert.equal(title, 'Example');
    assert.deepEqual(
      rules.map((r) => [r.id, r.superseded, r.why, r.source]),
      [
        ['EX-01', false, 'it broke once.', 'test'],
        ['EX-02', true, 'old.', 'test'],
      ],
    );
  }
});

test('ruleProblems catches a missing why line, duplicate ids, a shared prefix and an unknown ruleOrder entry', () => {
  const files = [
    { name: 'a.md', ...parseRules('# A\n\n- **AA-01** One.\n- **AA-01** Two.\n  <!-- why: w | source: s -->\n') },
    { name: 'b.md', ...parseRules('# B\n\n- **AA-02** Three.\n  <!-- why: w | source: s -->\n') },
  ];
  const problems = ruleProblems(files, ['missing.md']).join('\n');
  assert.match(problems, /a\.md:3: AA-01 needs an indented/);
  assert.match(problems, /duplicate rule id AA-01/);
  assert.match(problems, /prefix AA is already used by a\.md/);
  assert.match(problems, /ruleOrder lists missing\.md/);
});

test('renderRules strips comments and superseded rules', () => {
  const out = renderRules([{ name: 'x.md', ...parseRules(RULES) }], { project: 'demo' });
  assert.match(out, /^# Shared rules \(demo\)/);
  assert.match(out, /- \*\*EX-01\*\* Do the thing\./);
  assert.doesNotMatch(out, /EX-02|<!--/);
});

test('handoffProblems flags lines, bytes and an over-long line', () => {
  assert.deepEqual(handoffProblems('# Handoff\nshort\n'), []);
  const p = handoffProblems(`${'x\n'.repeat(61)}${'y'.repeat(601)}\n`).join('\n');
  assert.match(p, /62 lines \(max 60\)/);
  assert.match(p, /:62 is 601 characters/);
  assert.match(handoffProblems('z'.repeat(9000)).join('\n'), /9000 bytes \(max 8192\)/);
});

test('placeholders lists each {{FILL: ...}} with its line', () => {
  assert.deepEqual(placeholders('a\nb {{FILL: x}} {{FILL: y}}\n', 'f.md'), ['f.md:2 {{FILL: x}}', 'f.md:2 {{FILL: y}}']);
});

test('init writes the project files, fills known values and leaves FILL placeholders for the agent', () => {
  const dir = tmp();
  const r = init({ kitDir, target: dir, project: 'demo', shell: 'powershell', runner: 'owner', checks: ['npm test'], date: '2026-01-01', log: silent });
  for (const rel of ['AGENTS.md', 'CLAUDE.md', 'docs/HANDOFF.md', 'docs/DECISIONS.md', 'docs/LESSONS.md', '.harness/harness.json', '.harness/RULES.md', '.harness/harness.mjs', '.gitignore']) {
    assert.ok(fs.existsSync(path.join(dir, rel)), `${rel} missing`);
  }
  const agents = read(dir, 'AGENTS.md');
  assert.match(agents, /# Agent instructions: demo/);
  assert.match(agents, /Shell: powershell/);
  assert.match(agents, /The owner runs every command/);
  assert.match(agents, /It runs `npm test`/);
  assert.doesNotMatch(agents, /\{\{(?!FILL:)/, 'only FILL placeholders may remain');
  assert.match(read(dir, 'docs/DECISIONS.md'), /run by the owner in powershell/);
  const config = JSON.parse(read(dir, '.harness/harness.json'));
  assert.deepEqual(config.checks, [{ name: 'test', run: 'npm test' }]);
  assert.ok(r.fills > 0);
  assert.match(read(dir, '.harness/RULES.md'), /\*\*CMD-01\*\*/);
});

test('init never overwrites, so a re-run keeps the agent\'s edits', () => {
  const dir = tmp();
  init({ kitDir, target: dir, project: 'demo', date: '2026-01-01', log: silent });
  write(dir, 'AGENTS.md', 'mine\n');
  const r = init({ kitDir, target: dir, project: 'other', date: '2026-01-02', log: silent });
  assert.equal(read(dir, 'AGENTS.md'), 'mine\n');
  assert.ok(r.kept.includes('AGENTS.md'));
  assert.equal(JSON.parse(read(dir, '.harness/harness.json')).project, 'demo');
});

test('doctor passes on a filled project', () => {
  assert.deepEqual(doctor(filledProject()), []);
});

test('doctor lists placeholders, empty checks, a stale RULES.md, a missing import and an over-cap HANDOFF', () => {
  const dir = tmp();
  init({ kitDir, target: dir, project: 'demo', date: '2026-01-01', log: silent });
  write(dir, '.harness/RULES.md', read(dir, '.harness/RULES.md') + '- **X-01** hand edit\n');
  write(dir, 'CLAUDE.md', '@AGENTS.md\n');
  write(dir, 'docs/HANDOFF.md', 'x\n'.repeat(70));
  const p = doctor(dir).join('\n');
  assert.match(p, /fill AGENTS\.md:\d+ \{\{FILL:/);
  assert.match(p, /"checks" is empty/);
  assert.match(p, /RULES\.md is out of date or hand-edited/);
  assert.match(p, /CLAUDE\.md does not import @\.harness\/RULES\.md/);
  assert.match(p, /HANDOFF\.md has 70 lines/);
});

test('doctor reports a bad rule edit, and rules regenerates RULES.md after a good one', () => {
  const dir = filledProject();
  const file = '.harness/rules/working-style.md';
  write(dir, file, read(dir, file).replace(/(- \*\*WS-04\*\*) .*/, '$1 SUPERSEDED by WS-01: not wanted here'));
  assert.match(doctor(dir).join('\n'), /RULES\.md is out of date/);
  assert.equal(writeRules(dir, { quiet: true }), true);
  assert.deepEqual(doctor(dir), []);
  assert.doesNotMatch(read(dir, '.harness/RULES.md'), /WS-04/);
  write(dir, file, read(dir, file) + '- **WS-99** No why line.\n');
  assert.match(doctor(dir).join('\n'), /WS-99 needs an indented/);
});

test('doctor flags the start-up budget', () => {
  const dir = filledProject();
  write(dir, 'AGENTS.md', read(dir, 'AGENTS.md') + '- padding line\n'.repeat(200));
  assert.match(doctor(dir).join('\n'), /start-up files .* lines \(max 200\)/);
});

test('run prints PASS and FAIL with error lines, writes the full log and counts failures', () => {
  const dir = filledProject();
  const config = JSON.parse(read(dir, '.harness/harness.json'));
  config.checks = [
    { name: 'ok', run: `${node} -e "console.log('fine')"` },
    { name: 'bad', run: `${node} -e "console.log('noise'); console.error('Error: boom'); process.exit(3)"` },
  ];
  write(dir, '.harness/harness.json', JSON.stringify(config));
  const out = [];
  assert.equal(run(dir, { log: (l) => out.push(l) }), 1);
  const text = out.join('\n');
  assert.match(text, /^PASS ok/m);
  assert.match(text, /^FAIL bad \(exit 3/m);
  assert.match(text, /Error: boom/);
  assert.doesNotMatch(text, /^ {2}noise$/m, 'only marked lines when some match');
  assert.match(text, /1 passed, 1 failed/);
  assert.match(read(dir, '.harness/last-run.log'), /noise/);
  assert.equal(run(dir, { log: silent, only: 'ok' }), 0);
});

test('run with no checks is a failure, not a pass', () => {
  const dir = tmp();
  init({ kitDir, target: dir, date: '2026-01-01', log: silent });
  const out = [];
  assert.equal(run(dir, { log: (l) => out.push(l) }), 1);
  assert.match(out.join('\n'), /FAIL no checks configured/);
});

test('the CLI parses options, rejects unknown ones and returns exit codes', () => {
  assert.deepEqual(parseArgs(['init', '--target', 'x', '--check', 'a', '--check', 'b']), { command: 'init', opts: { target: 'x', checks: ['a', 'b'] } });
  const errors = [];
  assert.equal(main(['doctor', '--bogus'], { log: silent, error: (l) => errors.push(l) }), 1);
  assert.match(errors.join('\n'), /unknown option --bogus/);
  assert.equal(main(['doctor', '--target', filledProject()], { log: silent, error: silent }), 0);
});

test('the copied script works inside the project', () => {
  const dir = filledProject();
  const copied = read(dir, '.harness/harness.mjs');
  assert.equal(copied, read(kitDir, 'scripts/harness.mjs'));
});

test('the kit passes its own check', () => {
  assert.deepEqual(kitCheck(kitDir).problems, []);
});
