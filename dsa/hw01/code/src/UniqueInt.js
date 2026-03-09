#!/usr/bin/env node

/**
 * UniqueInt.js — DSA Assignment 1: Unique Integers
 * ─────────────────────────────────────────────────
 * Run:  node UniqueInt.js
 * ─────────────────────────────────────────────────
 * - Prompts for input folder (defaults to ./sample_inputs)
 * - Reads every .txt file, extracts valid integers (-1023 to 1023)
 * - Skips: empty lines, multi-token lines, floats, non-integers
 * - Outputs sorted unique integers to ./sample_results/
 * - No built-in sort / Array methods / collection libs used
 */

const fs   = require('fs');
const path = require('path');
const rl   = require('readline');

// ─── Terminal colours ────────────────────────────────────────────────────────
const C = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', white: '\x1b[37m',
  bgBlue: '\x1b[44m',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function rep(ch, n) { let s = ''; for (let i = 0; i < n; i++) s += ch; return s; }
function stripAnsi(s) { return s.replace(/\x1b\[[0-9;]*m/g, ''); }
function center(str, w) {
  const pad = Math.max(0, Math.floor((w - stripAnsi(str).length) / 2));
  return rep(' ', pad) + str;
}

const W = process.stdout.columns || 72;

function banner() {
  const line = C.cyan + rep('═', W) + C.reset;
  console.log(line);
  console.log(center(C.bold + C.cyan + '◈  UNIQUE INT PROCESSOR  ◈' + C.reset, W));
  console.log(center(C.dim + 'DSA Assignment 1 — Enterprise Web Development' + C.reset, W));
  console.log(line);
  console.log();
}

function section(title) {
  console.log();
  console.log(C.yellow + rep('─', W) + C.reset);
  console.log(C.bold + C.yellow + '  ' + title + C.reset);
  console.log(C.yellow + rep('─', W) + C.reset);
}

// ─── Core: read and validate one line ────────────────────────────────────────
function readNextItemFromFile(line) {
  // Manual trim (spaces + tabs only)
  let s = 0, e = line.length - 1;
  while (s <= e && (line[s] === ' ' || line[s] === '\t')) s++;
  while (e >= s && (line[e] === ' ' || line[e] === '\t')) e--;
  if (s > e) return null;                          // blank line

  const trimmed = line.slice(s, e + 1);

  // Reject if internal whitespace exists (two tokens)
  for (let i = 0; i < trimmed.length; i++)
    if (trimmed[i] === ' ' || trimmed[i] === '\t') return null;

  // Validate: optional '-' then only digits
  let i = 0;
  if (trimmed[i] === '-') i++;
  if (i === trimmed.length) return null;           // bare '-'
  for (; i < trimmed.length; i++) {
    const c = trimmed.charCodeAt(i);
    if (c < 48 || c > 57) return null;            // non-digit (catches '.')
  }

  const num = parseInt(trimmed, 10);
  if (num < -1023 || num > 1023) return null;     // out of range
  return num;
}

// ─── Core: process one file ───────────────────────────────────────────────────
function processFile(inputFilePath, outputFilePath) {
  const t0  = process.hrtime.bigint();
  const m0  = process.memoryUsage().heapUsed;

  // Boolean bitmap: index 0 = -1023 … index 2046 = 1023
  const OFFSET = 1023;
  const seen   = new Uint8Array(2047);             // ~2 KB, no built-in sort needed

  const content = fs.readFileSync(inputFilePath, 'utf8');

  // Manual line splitting
  let lineStart = 0;
  for (let i = 0; i <= content.length; i++) {
    if (i === content.length || content[i] === '\n') {
      const line = content.slice(lineStart, (content[i - 1] === '\r' ? i - 1 : i));
      lineStart  = i + 1;
      const val  = readNextItemFromFile(line);
      if (val !== null) seen[val + OFFSET] = 1;
    }
  }

  // Build output: iterate bitmap in order → naturally sorted
  let out = '';
  for (let i = 0; i < 2047; i++)
    if (seen[i]) out += (i - OFFSET) + '\n';

  fs.writeFileSync(outputFilePath, out.trimEnd(), 'utf8');

  return {
    runtime: Number(process.hrtime.bigint() - t0) / 1_000_000,  // ms
    memory : process.memoryUsage().heapUsed - m0,                // bytes
  };
}

// ─── Summary table ────────────────────────────────────────────────────────────
function printTable(results) {
  const cw = [28, 13, 13, 12];
  const h  = (s, w) => C.bold + C.bgBlue + C.white + s.padEnd(w) + C.reset;

  console.log();
  console.log('  ' + h('File', cw[0]) + ' ' + h('Time (ms)', cw[1]) +
              ' ' + h('Memory (B)', cw[2]) + ' ' + h('Status', cw[3]));
  console.log('  ' + rep('─', cw[0] + cw[1] + cw[2] + cw[3] + 3));

  let totT = 0, totM = 0;
  for (const r of results) {
    const name = r.name.length > 26 ? '…' + r.name.slice(-25) : r.name;
    const mem  = (r.memory >= 0 ? '+' : '') + r.memory;
    console.log(
      '  ' + C.white   + name.padEnd(cw[0])              + C.reset + ' ' +
             C.yellow  + r.runtime.toFixed(3).padEnd(cw[1]) + C.reset + ' ' +
             C.magenta + mem.padEnd(cw[2])                + C.reset + ' ' +
             (r.ok ? C.green + '✔ OK' : C.red + '✘ ERR') + C.reset
    );
    totT += r.runtime; totM += r.memory;
  }

  console.log('  ' + rep('─', cw[0] + cw[1] + cw[2] + cw[3] + 3));
  console.log(
    '  ' + C.bold + 'TOTAL'.padEnd(cw[0])                              + C.reset + ' ' +
           C.bold + C.yellow  + totT.toFixed(3).padEnd(cw[1])          + C.reset + ' ' +
           C.bold + C.magenta + ((totM >= 0 ? '+' : '') + totM).padEnd(cw[2]) + C.reset + ' ' +
           C.bold + C.cyan    + results.length + ' file(s)'            + C.reset
  );
  console.log();
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function run(inputDir) {
  const absIn  = path.resolve(inputDir);
  const absOut = path.resolve(path.join(absIn, '..', 'sample_results'));

  if (!fs.existsSync(absIn)) {
    console.log(C.red + C.bold + '\n  ✘ Folder not found: ' + absIn + C.reset + '\n');
    process.exit(1);
  }
  if (!fs.existsSync(absOut)) fs.mkdirSync(absOut, { recursive: true });

  // Collect .txt files (manual loop, no filter())
  const all = fs.readdirSync(absIn);
  const txts = [];
  for (let i = 0; i < all.length; i++)
    if (all[i].endsWith('.txt')) txts[txts.length] = all[i];

  if (!txts.length) {
    console.log(C.red + '\n  ✘ No .txt files in: ' + absIn + C.reset + '\n');
    process.exit(1);
  }

  section('Processing  →  ' + absIn);

  const results = [];
  for (let i = 0; i < txts.length; i++) {
    const fname   = txts[i];
    const inPath  = path.join(absIn,  fname);
    const outPath = path.join(absOut, fname + '_results.txt');

    process.stdout.write(C.dim + '  ' + fname + C.reset + ' … ');
    let stats = null, ok = true;
    try   { stats = processFile(inPath, outPath); console.log(C.green + '✔' + C.reset); }
    catch (e) { ok = false; console.log(C.red + '✘  ' + e.message + C.reset); }

    results[results.length] = { name: fname, runtime: stats?.runtime ?? 0, memory: stats?.memory ?? 0, ok, outPath };
  }

  section('Results Summary');
  printTable(results);



  console.log();
  console.log(C.cyan + rep('═', W) + C.reset);
  console.log(center(C.green + C.bold + '✔  All done!  Results saved to sample_results/' + C.reset, W));
  console.log(C.cyan + rep('═', W) + C.reset);
  console.log();
}

// ─── Entry point ──────────────────────────────────────────────────────────────
banner();

const iface = rl.createInterface({ input: process.stdin, output: process.stdout });
const defaultPath = path.join(__dirname, 'sample_inputs');

iface.question(
  C.bold + C.yellow + '  Enter input folder path' + C.reset +
  C.dim  + ' [default: ./sample_inputs]: '        + C.reset,
  (answer) => { iface.close(); run(answer?.trim() || defaultPath); }
);
