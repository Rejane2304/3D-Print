/**
 * scripts/audit-i18n.ts
 *
 * Audits public client-facing pages for i18n issues:
 *   1. Files without i18n (useLanguage) that have visible JSX text
 *   2. Files with i18n but missing keys between ES and EN translation objects
 *   3. Calls to toLocaleDateString() / toLocaleString() without a locale argument
 *   4. Hardcoded English UI strings in JSX bypassing the `t` object
 *
 * Run: npx tsx scripts/audit-i18n.ts
 */

import fs from 'fs';
import path from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');

/** Public client-facing directories to scan (exclude admin/) */
const SCAN_DIRS = [
  'app/_components',
  'app/catalog/_components',
  'app/product',
  'app/cart/_components',
  'app/checkout/_components',
  'app/login/_components',
  'app/profile/_components',
  'app/orders/_components',
  'app/wishlist/_components',
  'components',
];

/** File extensions to process */
const EXTENSIONS = ['.tsx', '.ts'];

/** English words / phrases commonly found hardcoded in JSX */
const ENGLISH_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  { pattern: />\s*(Loading|Error|Submit|Cancel|Close|Save|Edit|Delete|Remove|Add|Search|Filter|Sort|Next|Previous|Back|Continue|Confirm|Yes|No|Home|Products|Cart|Checkout|Profile|Orders|Settings|Login|Register|Logout|Sign in|Sign up|Sign out|My account|My orders|My wishlist|View|Details|Buy now|Add to cart|Remove from cart|Out of stock|In stock|Free shipping|Price|Total|Quantity|Size|Color|Material)\s*</,
    description: 'Common English UI word as JSX text content',
  },
  {
    pattern: /placeholder="[A-Z][a-z]+ [a-z]/,
    description: 'English placeholder text (starts with capital word followed by lowercase)',
  },
  {
    pattern: /aria-label="[A-Z][a-z]+ [a-z]/,
    description: 'English aria-label',
  },
  {
    pattern: /title="[A-Z][a-z]+ [a-z]/,
    description: 'English title attribute',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function* walkDir(dir: string): Generator<string> {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkDir(full);
    } else if (EXTENSIONS.includes(path.extname(entry.name))) {
      yield full;
    }
  }
}

function collectFiles(scanDirs: string[]): string[] {
  const files: string[] = [];
  for (const d of scanDirs) {
    for (const f of walkDir(path.join(ROOT, d))) {
      files.push(f);
    }
  }
  return files;
}

/** Extract all top-level keys inside `es: { ... }` and `en: { ... }` inline t-objects */
function extractTranslationKeys(source: string): { es: string[]; en: string[] } | null {
  // Match the inline `t = { es: { ... }, en: { ... } }[language]` pattern
  const blockMatch = source.match(/const\s+t\s*=\s*\{([\s\S]*?)\}\s*\[language\]/);
  if (!blockMatch) return null;
  const block = blockMatch[1];

  function extractKeys(lang: 'es' | 'en'): string[] {
    // Find the content of `es: { ... }` or `en: { ... }` at the top level
    const langPattern = new RegExp(`\\b${lang}\\s*:\\s*\\{`);
    const start = block.search(langPattern);
    if (start === -1) return [];
    const braceStart = block.indexOf('{', start);
    if (braceStart === -1) return [];
    // Walk to find the matching closing brace
    let depth = 0;
    let i = braceStart;
    for (; i < block.length; i++) {
      if (block[i] === '{') depth++;
      else if (block[i] === '}') {
        depth--;
        if (depth === 0) break;
      }
    }
    const inner = block.slice(braceStart + 1, i);
    // Extract top-level keys (property names before `:` at depth 0)
    const keys: string[] = [];
    let d2 = 0;
    let currentKey = '';
    let collectingKey = true;
    for (const ch of inner) {
      if (ch === '{' || ch === '(') { d2++; collectingKey = false; }
      else if (ch === '}' || ch === ')') { d2--; if (d2 === 0) collectingKey = true; }
      else if (d2 === 0 && ch === ':' && collectingKey) {
        const k = currentKey.trim().replace(/['"]/g, '');
        if (k) keys.push(k);
        currentKey = '';
        collectingKey = false;
      } else if (d2 === 0 && ch === ',') {
        currentKey = '';
        collectingKey = true;
      } else if (d2 === 0 && collectingKey) {
        currentKey += ch;
      }
    }
    return keys.filter(Boolean);
  }

  return { es: extractKeys('es'), en: extractKeys('en') };
}

// ─────────────────────────────────────────────────────────────────────────────
// Checks
// ─────────────────────────────────────────────────────────────────────────────

interface Issue {
  file: string;
  line?: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

function checkFile(filePath: string): Issue[] {
  const issues: Issue[] = [];
  const source = fs.readFileSync(filePath, 'utf-8');
  const rel = path.relative(ROOT, filePath);
  const lines = source.split('\n');

  const usesI18n = source.includes('useLanguage');
  const isClientComponent = source.startsWith("'use client'") || source.startsWith('"use client"');

  // ── 1. Client component without useLanguage but with JSX content ──────────
  if (isClientComponent && !usesI18n) {
    // Skip pure layout/wrapper files and files with no JSX text
    const hasJsxText = />([A-Z][a-z]{3,}|[\u00C0-\u017E]{3,})/.test(source);
    if (hasJsxText) {
      issues.push({
        file: rel,
        severity: 'warning',
        message: 'Client component has JSX text but does NOT use useLanguage — check for hardcoded strings',
      });
    }
  }

  // ── 2. Missing translation keys between ES and EN ─────────────────────────
  if (usesI18n) {
    const keys = extractTranslationKeys(source);
    if (keys) {
      const missingInEn = keys.es.filter((k) => !keys.en.includes(k));
      const missingInEs = keys.en.filter((k) => !keys.es.includes(k));
      for (const k of missingInEn) {
        issues.push({ file: rel, severity: 'error', message: `Key '${k}' present in 'es' but MISSING in 'en'` });
      }
      for (const k of missingInEs) {
        issues.push({ file: rel, severity: 'error', message: `Key '${k}' present in 'en' but MISSING in 'es'` });
      }
    }
  }

  // ── 3. toLocaleDateString / toLocaleString without locale ─────────────────
  lines.forEach((line, idx) => {
    if (/\.toLocaleDateString\(\)/.test(line) || /\.toLocaleString\(\)/.test(line) || /\.toLocaleTimeString\(\)/.test(line)) {
      issues.push({
        file: rel,
        line: idx + 1,
        severity: 'warning',
        message: `toLocale*() called without locale argument — will use browser default. Use t.locale or hardcode 'es-ES'/'en-GB'`,
      });
    }
  });

  // ── 4. English UI strings in JSX (heuristic — may have false positives) ───
  lines.forEach((line, idx) => {
    // Skip comment lines and import lines
    if (/^\s*(\/\/|\/\*|\*|import )/.test(line)) return;
    for (const { pattern, description } of ENGLISH_PATTERNS) {
      if (pattern.test(line)) {
        issues.push({
          file: rel,
          line: idx + 1,
          severity: 'warning',
          message: `Possible hardcoded English string — ${description}`,
        });
        break; // one warning per line is enough
      }
    }
  });

  return issues;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

function main() {
  console.log('\n🔍  Auditing i18n for public client-facing pages…\n');
  const files = collectFiles(SCAN_DIRS);
  console.log(`   Files scanned: ${files.length}\n`);

  const allIssues: Issue[] = [];
  for (const f of files) {
    allIssues.push(...checkFile(f));
  }

  const errors   = allIssues.filter((i) => i.severity === 'error');
  const warnings = allIssues.filter((i) => i.severity === 'warning');
  const infos    = allIssues.filter((i) => i.severity === 'info');

  if (allIssues.length === 0) {
    console.log('✅  No i18n issues found.\n');
    return;
  }

  // Group by file
  const byFile = new Map<string, Issue[]>();
  for (const issue of allIssues) {
    const list = byFile.get(issue.file) ?? [];
    list.push(issue);
    byFile.set(issue.file, list);
  }

  for (const [file, issues] of byFile.entries()) {
    console.log(`\n  📄  ${file}`);
    for (const issue of issues) {
      const lineStr = issue.line ? `:${issue.line}` : '';
      const prefix = issue.severity === 'error' ? '  ❌ ' : issue.severity === 'warning' ? '  ⚠️  ' : '  ℹ️  ';
      console.log(`${prefix}${lineStr ? `(line ${issue.line}) ` : ''}${issue.message}`);
    }
  }

  console.log('\n──────────────────────────────────────────────────────');
  console.log(`  Summary: ${errors.length} error(s)   ${warnings.length} warning(s)   ${infos.length} info(s)`);
  console.log('──────────────────────────────────────────────────────\n');

  if (errors.length > 0) {
    console.log('  Errors must be fixed — translation keys are out of sync between ES and EN.\n');
    process.exit(1);
  }
}

main();
