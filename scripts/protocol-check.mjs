#!/usr/bin/env node
/**
 * Protocol Check
 *
 * Statically validates that the real-time WebSocket protocol is internally
 * consistent across the full stack:
 *
 *   1. Every event listed in src/protocol.ts MUST be emitted by the backend
 *      gateway (backend/src/modules/jobs/jobs-gateway.ts).
 *   2. Every client→server event in src/protocol.ts MUST have a corresponding
 *      @SubscribeMessage handler in the gateway.
 *   3. No duplicate @SubscribeMessage declarations (would cause silent handler
 *      shadowing at runtime).
 *   4. The frontend shared types file (web-dashboard/src/types/index.ts) MUST
 *      export the canonical job-status enum so frontend consumers are not
 *      operating on raw strings.
 *
 * Exit 0 → protocol is consistent.
 * Exit 1 → one or more violations found (errors printed to stderr).
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function read(relPath) {
  return readFileSync(resolve(root, relPath), 'utf-8');
}

function extractAll(content, regex) {
  const results = [];
  let match;
  const re = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`);
  while ((match = re.exec(content)) !== null) {
    results.push(match[1]);
  }
  return results;
}

// ---------------------------------------------------------------------------
// Load protocol manifest from src/protocol.ts (plain-text parse – no ts-node)
// ---------------------------------------------------------------------------

const protocolSrc = read('src/protocol.ts');

// Extract string literals from WS_EVENTS const object
const serverEventLiterals = extractAll(protocolSrc, /:\s*'([^']+)'/);
// Extract string literals from WS_CLIENT_EVENTS const object
// We need both sets; split on the section headings to separate them
const wsEventsSectionMatch = protocolSrc.match(
  /export const WS_EVENTS\s*=\s*\{([\s\S]*?)\}\s*as const/,
);
const wsClientEventsSectionMatch = protocolSrc.match(
  /export const WS_CLIENT_EVENTS\s*=\s*\{([\s\S]*?)\}\s*as const/,
);

if (!wsEventsSectionMatch || !wsClientEventsSectionMatch) {
  console.error(
    'ERROR: Could not parse WS_EVENTS or WS_CLIENT_EVENTS from src/protocol.ts',
  );
  process.exit(1);
}

const requiredServerEmits = extractAll(
  wsEventsSectionMatch[1],
  /:\s*'([^']+)'/,
);
const requiredClientSubscriptions = extractAll(
  wsClientEventsSectionMatch[1],
  /:\s*'([^']+)'/,
);

// ---------------------------------------------------------------------------
// Load backend gateway
// ---------------------------------------------------------------------------

const gatewaySrc = read('backend/src/modules/jobs/jobs-gateway.ts');

const gatewayEmits = new Set(extractAll(gatewaySrc, /\.emit\(\s*'([^']+)'/));
const gatewaySubscribes = extractAll(
  gatewaySrc,
  /@SubscribeMessage\(\s*'([^']+)'/,
);
const gatewaySubscribeSet = new Set(gatewaySubscribes);

// ---------------------------------------------------------------------------
// Load frontend types
// ---------------------------------------------------------------------------

const frontendTypesSrc = read('web-dashboard/src/types/index.ts');

// ---------------------------------------------------------------------------
// Run checks
// ---------------------------------------------------------------------------

let errors = 0;

function fail(msg) {
  console.error(`  ✗ ${msg}`);
  errors++;
}

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}

// ---
console.log('\n[1/4] Checking backend emits all protocol server events …');
for (const event of requiredServerEmits) {
  if (gatewayEmits.has(event)) {
    ok(`backend emits '${event}'`);
  } else {
    fail(`backend gateway does NOT emit '${event}' (required by src/protocol.ts)`);
  }
}

// ---
console.log('\n[2/4] Checking backend subscribes to all protocol client events …');
for (const event of requiredClientSubscriptions) {
  if (gatewaySubscribeSet.has(event)) {
    ok(`backend @SubscribeMessage('${event}') found`);
  } else {
    fail(
      `backend gateway has NO @SubscribeMessage('${event}') handler ` +
        `(required by src/protocol.ts)`,
    );
  }
}

// ---
console.log('\n[3/4] Checking for duplicate @SubscribeMessage handlers …');
const seen = new Map();
for (const event of gatewaySubscribes) {
  if (seen.has(event)) {
    fail(
      `Duplicate @SubscribeMessage('${event}') – only the last handler will ` +
        `be registered at runtime (silent bug)`,
    );
  } else {
    seen.set(event, true);
    ok(`'${event}' handler is unique`);
  }
}

// ---
console.log('\n[4/4] Checking frontend exports required enums …');
const requiredEnums = ['JobStatus', 'JobPriority', 'InvoiceStatus', 'QuoteStatus'];
for (const enumName of requiredEnums) {
  if (frontendTypesSrc.includes(`export enum ${enumName}`)) {
    ok(`frontend exports enum ${enumName}`);
  } else {
    fail(`frontend types/index.ts does NOT export enum '${enumName}'`);
  }
}

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

console.log('');
if (errors > 0) {
  console.error(`Protocol check FAILED – ${errors} violation(s) found.\n`);
  process.exit(1);
} else {
  console.log('Protocol check PASSED – all invariants satisfied.\n');
}
