#!/usr/bin/env node
// claude-harness-generic: one dependency-free script (Node 18+) for the kit and for projects set up from it.
//
// In the kit:     node scripts/harness.mjs check                       self-check the kit
//                 node scripts/harness.mjs init --target <dir> [opts]   set up a project
// In a project:   node .harness/harness.mjs doctor                      is the setup complete and in budget?
//                 node .harness/harness.mjs rules                       regenerate .harness/RULES.md
//                 node .harness/harness.mjs run                         run the project's checks, compact output
//
// Output is short on purpose: in owner-run setups the owner pastes it back to the agent (CMD-04).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const HARNESS_DIR = '.harness';
export const CONFIG = '.harness/harness.json';
export const RULES_OUT = '.harness/RULES.md';
export const RULES_DIR = '.harness/rules';
export const LOG_OUT = '.harness/last-run.log';
export const HANDOFF = 'docs/HANDOFF.md';
/** Always-loaded files and their shared cap (CTX-06): 200 lines, 24 KB. */
export const STARTUP_FILES = [RULES_OUT, 'AGENTS.md', 'CLAUDE.md'];
export const STARTUP_BUDGET = { lines: 200, bytes: 24576 };
/** HANDOFF cap (CTX-02): lines, bytes, and the longest line, since long lines defeat a line cap. */
export const HANDOFF_BUDGET = { lines: 60, bytes: 8192, lineChars: 600 };
/** Files a project must have after init. */
export const PROJECT_FILES = ['AGENTS.md', 'CLAUDE.md', HANDOFF, 'docs/DECISIONS.md', 'docs/LESSONS.md', CONFIG, RULES_OUT];
/** Template file -> destination in the project. */
export const TEMPLATES = [
  ['AGENTS.md', 'AGENTS.md'],
  ['CLAUDE.md', 'CLAUDE.md'],
  ['HANDOFF.md', HANDOFF],
  ['DECISIONS.md', 'docs/DECISIONS.md'],
  ['LESSONS.md', 'docs/LESSONS.md'],
  ['gitignore', '.gitignore'],
  ['gitattributes', '.gitattributes'],
];
export const SHELLS = ['powershell', 'cmd', 'bash'];
export const RUNNERS = ['owner', 'agent'];
const FILL = /\{\{FILL:[^}]*\}\}/g;
const RULE_LINE = /^- \*\*([A-Z]+-\d+)\*\* (.*)$/;
const WHY_LINE = /^\s+<!-- why: (.+?) \| source: (.+?) -->$/;

export class HarnessError extends Error {}

/** Split text into lines, accepting CRLF (Windows checkouts) as well as LF. */
export const lines = (text) => text.replace(/\r\n/g, '\n').split('\n');
const read = (file) => fs.readFileSync(file, 'utf8');
const posix = (p) => p.split(path.sep).join('/');

// ---------- rules ----------

/** Parse one rule file into { title, rules: [{ id, text, superseded, why, source, line }] }. */
export function parseRules(text, file = 'rules') {
  const rows = lines(text);
  const title = (rows.find((l) => l.startsWith('# ')) ?? '').slice(2).trim();
  if (!title) throw new HarnessError(`${file}: missing "# Title" line`);
  const rules = [];
  rows.forEach((row, i) => {
    const m = RULE_LINE.exec(row);
    if (!m) return;
    const why = WHY_LINE.exec(rows[i + 1] ?? '');
    rules.push({ id: m[1], text: m[2], superseded: m[2].startsWith('SUPERSEDED'), why: why?.[1] ?? null, source: why?.[2] ?? null, line: i + 1 });
  });
  return { title, rules };
}

/** Read every rule file in a folder. Files named in `order` come first, in that order; the rest by name. */
export function loadRules(dir, order = []) {
  if (!fs.existsSync(dir)) throw new HarnessError(`no rules folder at ${dir}`);
  const rank = (n) => (order.includes(n) ? order.indexOf(n) : order.length);
  const names = fs.readdirSync(dir).filter((n) => n.endsWith('.md')).sort().sort((a, b) => rank(a) - rank(b));
  return names.map((name) => ({ name, ...parseRules(read(path.join(dir, name)), name) }));
}

/** Format problems: a why/source line on every rule, ids unique, one id prefix per file, order entries exist. */
export function ruleProblems(files, order = []) {
  const out = [];
  const ids = new Set();
  const owner = new Map();
  for (const f of files) {
    if (!f.rules.length) out.push(`${f.name}: no rules`);
    for (const r of f.rules) {
      if (!r.why || !r.source) out.push(`${f.name}:${r.line}: ${r.id} needs an indented "<!-- why: ... | source: ... -->" line under it`);
      if (ids.has(r.id)) out.push(`${f.name}:${r.line}: duplicate rule id ${r.id}`);
      ids.add(r.id);
      const prefix = r.id.split('-')[0];
      if (owner.has(prefix) && owner.get(prefix) !== f.name) out.push(`${f.name}: prefix ${prefix} is already used by ${owner.get(prefix)}`);
      owner.set(prefix, f.name);
    }
  }
  for (const n of order) if (!files.some((f) => f.name === n)) out.push(`ruleOrder lists ${n}, which is not a rule file`);
  return out;
}

/** RULES.md: headings demoted, why/source comments and superseded rules left out. */
export function renderRules(files, { project }) {
  const out = [
    `# Shared rules (${project})`,
    '',
    `Generated from \`${RULES_DIR}/\` by \`node ${HARNESS_DIR}/harness.mjs rules\`; don't edit this file (SRC-06).`,
  ];
  for (const f of files) {
    const live = f.rules.filter((r) => !r.superseded);
    if (!live.length) continue;
    out.push('', `## ${f.title}`, '');
    for (const r of live) out.push(`- **${r.id}** ${r.text}`);
  }
  return out.join('\n') + '\n';
}

// ---------- measuring ----------

/** Lines and bytes of the given files under root (missing files count as empty). */
export function measure(root, files) {
  let n = 0;
  let bytes = 0;
  for (const rel of files) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) continue;
    const text = read(abs);
    bytes += Buffer.byteLength(text);
    n += lines(text).length - (text.endsWith('\n') ? 1 : 0);
  }
  return { lines: n, bytes };
}

export function budgetProblems(label, size, budget) {
  const out = [];
  if (size.lines > budget.lines) out.push(`${label} is ${size.lines} lines (max ${budget.lines})`);
  if (size.bytes > budget.bytes) out.push(`${label} is ${size.bytes} bytes (max ${budget.bytes})`);
  return out;
}

/** HANDOFF over its cap; move finished entries to docs/archive/ to fix. */
export function handoffProblems(text, rel = HANDOFF, budget = HANDOFF_BUDGET) {
  const rows = lines(text);
  const n = rows.length - (text.endsWith('\n') ? 1 : 0);
  const longest = rows.reduce((m, r, i) => (r.length > m.len ? { len: r.length, at: i + 1 } : m), { len: 0, at: 0 });
  const out = [];
  if (n > budget.lines) out.push(`${rel} has ${n} lines (max ${budget.lines}); move finished entries to docs/archive/`);
  if (Buffer.byteLength(text) > budget.bytes) out.push(`${rel} is ${Buffer.byteLength(text)} bytes (max ${budget.bytes})`);
  if (longest.len > budget.lineChars) out.push(`${rel}:${longest.at} is ${longest.len} characters (max ${budget.lineChars})`);
  return out;
}

/** `{{FILL: ...}}` placeholders left in a text, as "rel:line what". */
export function placeholders(text, rel) {
  const out = [];
  lines(text).forEach((row, i) => {
    for (const m of row.matchAll(FILL)) out.push(`${rel}:${i + 1} ${m[0]}`);
  });
  return out;
}

// ---------- config ----------

export function readConfig(target) {
  const file = path.join(target, CONFIG);
  if (!fs.existsSync(file)) throw new HarnessError(`no ${CONFIG}; run init from the kit first`);
  try {
    return JSON.parse(read(file));
  } catch (e) {
    throw new HarnessError(`${CONFIG} is not valid JSON: ${e.message}`);
  }
}

export function configProblems(c) {
  const out = [];
  if (!c.project || typeof c.project !== 'string') out.push(`${CONFIG}: "project" must be a name`);
  if (!SHELLS.includes(c.shell)) out.push(`${CONFIG}: "shell" must be one of ${SHELLS.join(', ')}`);
  if (!RUNNERS.includes(c.commandsRunBy)) out.push(`${CONFIG}: "commandsRunBy" must be one of ${RUNNERS.join(', ')}`);
  if (!Array.isArray(c.checks) || !c.checks.length) out.push(`${CONFIG}: "checks" is empty; add the project's test or lint commands`);
  else c.checks.forEach((k, i) => (!k?.name || !k?.run) && out.push(`${CONFIG}: checks[${i}] needs "name" and "run"`));
  if (c.ruleOrder !== undefined && !Array.isArray(c.ruleOrder)) out.push(`${CONFIG}: "ruleOrder" must be a list of rule file names`);
  return out;
}

// ---------- init ----------

const RUNNER_TEXT = {
  owner:
    'The owner runs every command; the agent cannot. Follow the CMD rules: one copy-paste block per round, written for the shell below, read-only commands first, anything that changes state in its own labelled block, and ask for compact output.',
  agent: 'The agent runs commands itself, within its permissions. Ask first for anything SAFE-01 lists.',
};

/**
 * Set up a project from the kit. Never overwrites: existing files are kept and reported, so it is safe to re-run.
 * Returns { written, kept, fills } where fills is the number of `{{FILL: ...}}` placeholders left to complete.
 */
export function init({ kitDir, target, project, shell, runner = 'owner', checks = [], date = today(), log = console.log }) {
  if (!target) throw new HarnessError('init needs --target <project folder>');
  const kit = JSON.parse(read(path.join(kitDir, 'kit.json')));
  project ||= path.basename(path.resolve(target));
  shell ||= process.platform === 'win32' ? 'powershell' : 'bash';
  if (!SHELLS.includes(shell)) throw new HarnessError(`--shell must be one of ${SHELLS.join(', ')}`);
  if (!RUNNERS.includes(runner)) throw new HarnessError(`--runner must be one of ${RUNNERS.join(', ')}`);
  const written = [];
  const kept = [];
  const put = (rel, content) => {
    const abs = path.join(target, rel);
    if (fs.existsSync(abs)) return kept.push(rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
    written.push(rel);
  };

  const config = {
    kit: kit.version,
    project,
    shell,
    commandsRunBy: runner,
    checks: checks.map((run, i) => ({ name: checkName(run, i), run })),
    ruleOrder: kit.ruleOrder,
  };
  put(CONFIG, JSON.stringify(config, null, 2) + '\n');
  put(`${HARNESS_DIR}/harness.mjs`, read(SCRIPT_PATH));
  for (const name of fs.readdirSync(path.join(kitDir, 'core', 'rules'))) put(`${RULES_DIR}/${name}`, read(path.join(kitDir, 'core', 'rules', name)));

  const actual = readConfig(target); // an existing config wins over the options
  const vars = {
    PROJECT: actual.project,
    DATE: date,
    KIT: kit.version,
    SHELL: actual.shell,
    RUNNER: actual.commandsRunBy,
    RUNNER_TEXT: RUNNER_TEXT[actual.commandsRunBy] ?? RUNNER_TEXT.owner,
    CHECKS: actual.checks?.length ? actual.checks.map((k) => `\`${k.run}\``).join(', ') : '{{FILL: the project\'s check commands, also added to .harness/harness.json "checks"}}',
  };
  for (const [src, dest] of TEMPLATES) {
    const text = read(path.join(kitDir, 'core', 'templates', src));
    put(dest, text.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => vars[k] ?? m));
  }
  const rulesWritten = writeRules(target, { quiet: true });
  if (rulesWritten) written.push(RULES_OUT);

  const fills = PROJECT_FILES.filter((r) => r.endsWith('.md')).flatMap((r) => (fs.existsSync(path.join(target, r)) ? placeholders(read(path.join(target, r)), r) : []));
  for (const r of written) log(`init: wrote ${r}`);
  for (const r of kept) log(`init: kept existing ${r}`);
  log(`init: ${written.length} written, ${kept.length} kept, ${fills.length} placeholder(s) to fill. Next: node ${HARNESS_DIR}/harness.mjs doctor`);
  return { written, kept, fills: fills.length };
}

function checkName(run, i) {
  const m = /^(?:npm|pnpm|yarn)\s+(?:run\s+)?([\w:-]+)/.exec(run) ?? /^([\w.-]+)/.exec(run);
  return m ? m[1].replace(/\.\w+$/, '') : `check-${i + 1}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ---------- project commands ----------

/** Regenerate .harness/RULES.md from .harness/rules/. Returns true when the file changed. */
export function writeRules(target, { quiet = false, log = console.log } = {}) {
  const c = readConfig(target);
  const files = loadRules(path.join(target, RULES_DIR), c.ruleOrder ?? []);
  const problems = ruleProblems(files, c.ruleOrder ?? []);
  if (problems.length) throw new HarnessError(`rules have problems:\n${problems.join('\n')}`);
  const text = renderRules(files, { project: c.project });
  const abs = path.join(target, RULES_OUT);
  const old = fs.existsSync(abs) ? read(abs).replace(/\r\n/g, '\n') : null;
  if (old !== text) fs.writeFileSync(abs, text);
  if (!quiet) {
    const live = files.flatMap((f) => f.rules).filter((r) => !r.superseded).length;
    log(`rules: ${old === text ? 'unchanged' : 'wrote'} ${RULES_OUT}: ${live} rules from ${files.length} files`);
  }
  return old !== text;
}

/** Everything that stops a project's setup from being complete. Empty means done. */
export function doctor(target) {
  const out = [];
  for (const rel of PROJECT_FILES) if (!fs.existsSync(path.join(target, rel))) out.push(`missing ${rel}`);
  let c = null;
  try {
    c = readConfig(target);
    out.push(...configProblems(c));
  } catch (e) {
    out.push(e.message);
  }
  if (c) {
    try {
      const files = loadRules(path.join(target, RULES_DIR), c.ruleOrder ?? []);
      out.push(...ruleProblems(files, c.ruleOrder ?? []).map((p) => `${RULES_DIR}/${p}`));
      const rulesFile = path.join(target, RULES_OUT);
      if (fs.existsSync(rulesFile) && read(rulesFile).replace(/\r\n/g, '\n') !== renderRules(files, { project: c.project })) {
        out.push(`${RULES_OUT} is out of date or hand-edited; run: node ${HARNESS_DIR}/harness.mjs rules`);
      }
    } catch (e) {
      out.push(e.message);
    }
  }
  const claude = path.join(target, 'CLAUDE.md');
  if (fs.existsSync(claude)) {
    const text = read(claude);
    for (const imp of ['@AGENTS.md', `@${RULES_OUT}`]) if (!lines(text).some((l) => l.trim() === imp)) out.push(`CLAUDE.md does not import ${imp}`);
  }
  out.push(...budgetProblems(`start-up files (${STARTUP_FILES.join(' + ')})`, measure(target, STARTUP_FILES), STARTUP_BUDGET));
  const handoff = path.join(target, HANDOFF);
  if (fs.existsSync(handoff)) out.push(...handoffProblems(read(handoff)));
  for (const rel of ['AGENTS.md', HANDOFF, 'docs/DECISIONS.md', 'docs/LESSONS.md']) {
    const abs = path.join(target, rel);
    if (fs.existsSync(abs)) out.push(...placeholders(read(abs), rel).map((p) => `fill ${p}`));
  }
  return out;
}

/**
 * Run the configured checks. Prints PASS/FAIL per check and, for a failure, its warning and error lines
 * (or its last lines when none match), never a bare "no output" pass (VER-03). The full log goes to
 * .harness/last-run.log for the agent to read. Returns the number of failed checks.
 */
export function run(target, { log = console.log, tail = 20, only } = {}) {
  const c = readConfig(target);
  const checks = (c.checks ?? []).filter((k) => !only || k.name === only);
  if (!checks.length) {
    log(`run: FAIL no checks ${only ? `named "${only}"` : 'configured'} in ${CONFIG}`);
    return 1;
  }
  const full = [];
  let failed = 0;
  for (const k of checks) {
    const start = Date.now();
    const r = spawnSync(k.run, { cwd: target, shell: true, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    const secs = ((Date.now() - start) / 1000).toFixed(1);
    const output = `${r.stdout ?? ''}${r.stderr ?? ''}${r.error ? `\n${r.error.message}` : ''}`;
    full.push(`===== ${k.name}: ${k.run} (exit ${r.status}, ${secs}s)`, output);
    if (r.status === 0) {
      const warns = lines(output).filter((l) => /\bwarn(ing)?\b/i.test(l)).length;
      log(`PASS ${k.name} (${secs}s)${warns ? `, ${warns} warning line(s) in the log` : ''}`);
      continue;
    }
    failed++;
    log(`FAIL ${k.name} (exit ${r.status ?? r.signal ?? 'error'}, ${secs}s): ${k.run}`);
    const rows = lines(output).filter((l) => l.trim());
    const marked = rows.filter((l) => /(warn|error|ERR!|FAIL|not ok|✖|✗|exception|traceback|assert)/i.test(l));
    for (const l of (marked.length ? marked : rows).slice(-tail)) log(`  ${l.length > 300 ? l.slice(0, 300) + '…' : l}`);
  }
  fs.writeFileSync(path.join(target, LOG_OUT), full.join('\n') + '\n');
  log(`run: ${checks.length - failed} passed, ${failed} failed; full log in ${LOG_OUT}`);
  return failed;
}

// ---------- kit self-check ----------

/** Problems in the kit itself: rules, templates, the rules budget with the templates, links, HANDOFF, version. */
export function kitCheck(kitDir) {
  const out = [];
  const kit = JSON.parse(read(path.join(kitDir, 'kit.json')));
  if (!/^v\d+\.\d+\.\d+$/.test(kit.version ?? '')) out.push('kit.json: "version" must look like v1.2.3');
  const changelog = path.join(kitDir, 'CHANGELOG.md');
  const top = fs.existsSync(changelog) ? lines(read(changelog)).find((l) => l.startsWith('## ')) : null;
  if (!top?.startsWith(`## ${kit.version}`)) out.push(`CHANGELOG.md: newest heading should be "## ${kit.version}"`);
  const files = loadRules(path.join(kitDir, 'core', 'rules'), kit.ruleOrder ?? []);
  out.push(...ruleProblems(files, kit.ruleOrder ?? []).map((p) => `core/rules/${p}`));
  for (const [src] of TEMPLATES) if (!fs.existsSync(path.join(kitDir, 'core', 'templates', src))) out.push(`core/templates/${src} is missing`);
  // The start-up budget with a freshly initialised project leaves room for the project's own rules.
  const rendered = renderRules(files, { project: 'a-long-project-name' });
  const tpl = ['AGENTS.md', 'CLAUDE.md'].map((n) => path.join('core', 'templates', n));
  const size = measure(kitDir, tpl);
  size.lines += lines(rendered).length - 1;
  size.bytes += Buffer.byteLength(rendered);
  const headroom = { lines: STARTUP_BUDGET.lines - 40, bytes: STARTUP_BUDGET.bytes - 4096 };
  out.push(...budgetProblems('rules + AGENTS.md + CLAUDE.md templates (40 lines / 4 KB kept free for the project)', size, headroom));
  if (fs.existsSync(path.join(kitDir, 'HANDOFF.md'))) out.push(...handoffProblems(read(path.join(kitDir, 'HANDOFF.md')), 'HANDOFF.md'));
  for (const file of walk(kitDir).filter((f) => f.endsWith('.md'))) {
    const text = read(file).replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
    for (const [, link] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
      if (/^(https?:|mailto:|#)/.test(link)) continue;
      const clean = decodeURIComponent(link.split('#')[0]);
      if (clean && !fs.existsSync(path.resolve(path.dirname(file), clean))) out.push(`${posix(path.relative(kitDir, file))}: broken link ${link}`);
    }
  }
  return { problems: out, rules: files.flatMap((f) => f.rules).filter((r) => !r.superseded).length, files: files.length, size };
}

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(abs));
    else out.push(abs);
  }
  return out;
}

// ---------- CLI ----------

export function parseArgs(argv) {
  const [command, ...rest] = argv;
  const opts = { checks: [] };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    const value = () => {
      if (rest[i + 1] === undefined) throw new HarnessError(`${a} needs a value`);
      return rest[++i];
    };
    if (a === '--target') opts.target = value();
    else if (a === '--project') opts.project = value();
    else if (a === '--shell') opts.shell = value();
    else if (a === '--runner') opts.runner = value();
    else if (a === '--check') opts.checks.push(value());
    else if (a === '--only') opts.only = value();
    else throw new HarnessError(`unknown option ${a}`);
  }
  return { command, opts };
}

const USAGE = `usage:
  node scripts/harness.mjs check
  node scripts/harness.mjs init --target <dir> [--project <name>] [--shell powershell|cmd|bash] [--runner owner|agent] [--check "<command>"]...
  node .harness/harness.mjs doctor | rules | run [--only <check name>]      (from the project folder, or add --target <dir>)`;

export function main(argv, { log = console.log, error = console.error } = {}) {
  try {
    const { command, opts } = parseArgs(argv);
    const target = path.resolve(opts.target ?? process.cwd());
    if (command === 'check') {
      const kitDir = path.resolve(path.dirname(SCRIPT_PATH), '..');
      const r = kitCheck(kitDir);
      for (const p of r.problems) error(`check: ${p}`);
      log(`check: ${r.rules} rules in ${r.files} files; rules + templates ${r.size.lines} lines / ${r.size.bytes} bytes; ${r.problems.length} problem(s)`);
      return r.problems.length ? 1 : 0;
    }
    if (command === 'init') {
      const kitDir = path.resolve(path.dirname(SCRIPT_PATH), '..');
      if (!fs.existsSync(path.join(kitDir, 'kit.json'))) throw new HarnessError('init runs from the kit: node <kit>/scripts/harness.mjs init --target <dir>');
      fs.mkdirSync(target, { recursive: true });
      init({ kitDir, target, project: opts.project, shell: opts.shell, runner: opts.runner, checks: opts.checks, log });
      return 0;
    }
    if (command === 'doctor') {
      const problems = doctor(target);
      for (const p of problems) log(`doctor: ${p}`);
      const fills = problems.filter((p) => p.startsWith('fill ')).length;
      log(`doctor: ${problems.length} problem(s), ${fills} of them placeholders to fill${problems.length ? '' : '. Setup complete.'}`);
      return problems.length ? 1 : 0;
    }
    if (command === 'rules') {
      writeRules(target, { log });
      return 0;
    }
    if (command === 'run') return run(target, { log, only: opts.only }) ? 1 : 0;
    error(USAGE);
    return command ? 1 : 0;
  } catch (e) {
    if (!(e instanceof HarnessError)) throw e;
    error(`error: ${e.message}`);
    return 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) process.exitCode = main(process.argv.slice(2));
