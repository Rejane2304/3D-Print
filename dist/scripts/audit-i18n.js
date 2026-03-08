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
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(__dirname, '..');
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
const EXTENSIONS = new Set(['.tsx', '.ts']);
const ENGLISH_UI_WORDS = new Set([
    'Loading', 'Error', 'Submit', 'Cancel', 'Close', 'Save', 'Edit', 'Delete',
    'Remove', 'Add', 'Search', 'Filter', 'Sort', 'Next', 'Previous', 'Back',
    'Continue', 'Confirm', 'Yes', 'No', 'Home', 'Products', 'Cart', 'Checkout',
    'Profile', 'Orders', 'Settings', 'Login', 'Register', 'Logout',
    'View', 'Details', 'Total', 'Quantity', 'Size', 'Color', 'Material', 'Price',
]);
const JSX_WORD_RE = />\s*([A-Z][a-z]+)\s*</;
const LOCALE_METHODS_RE = /\.toLocaleDateString\(\)|\.toLocaleString\(\)|\.toLocaleTimeString\(\)/;
const ENGLISH_ATTR_PATTERNS = [
    { pattern: /placeholder="[A-Z][a-z]+ [a-z]/, description: 'English placeholder text' },
    { pattern: /aria-label="[A-Z][a-z]+ [a-z]/, description: 'English aria-label' },
    { pattern: /title="[A-Z][a-z]+ [a-z]/, description: 'English title attribute' },
];
// ── Filesystem helpers ────────────────────────────────────────────────────────
function* walkDir(dir) {
    if (!fs.existsSync(dir))
        return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            yield* walkDir(full);
        }
        else if (EXTENSIONS.has(path.extname(entry.name))) {
            yield full;
        }
    }
}
function collectFiles(scanDirs) {
    const files = [];
    for (const d of scanDirs) {
        for (const f of walkDir(path.join(ROOT, d))) {
            files.push(f);
        }
    }
    return files;
}
// ── Translation block parsing ─────────────────────────────────────────────────
function findClosingBrace(text, start) {
    let depth = 0;
    for (let i = start; i < text.length; i++) {
        if (text[i] === '{')
            depth++;
        else if (text[i] === '}') {
            depth--;
            if (depth === 0)
                return i;
        }
    }
    return -1;
}
function pushKeyIfValid(keys, raw) {
    const k = raw.trim().replaceAll(/['"]/g, '');
    if (k)
        keys.push(k);
}
function extractTopLevelKeys(inner) {
    const keys = [];
    let depth = 0;
    let currentKey = '';
    let collectingKey = true;
    for (const ch of inner) {
        if (ch === '{' || ch === '(') {
            depth++;
            collectingKey = false;
        }
        else if (ch === '}' || ch === ')') {
            depth--;
            if (depth === 0)
                collectingKey = true;
        }
        else if (depth === 0 && ch === ':' && collectingKey) {
            pushKeyIfValid(keys, currentKey);
            currentKey = '';
            collectingKey = false;
        }
        else if (depth === 0 && ch === ',') {
            currentKey = '';
            collectingKey = true;
        }
        else if (depth === 0 && collectingKey) {
            currentKey += ch;
        }
    }
    return keys.filter(Boolean);
}
function extractLangKeys(block, lang) {
    const langPattern = new RegExp(String.raw `\b${lang}\s*:\s*\{`);
    const start = block.search(langPattern);
    if (start === -1)
        return [];
    const braceStart = block.indexOf('{', start);
    if (braceStart === -1)
        return [];
    const closingIdx = findClosingBrace(block, braceStart);
    if (closingIdx === -1)
        return [];
    return extractTopLevelKeys(block.slice(braceStart + 1, closingIdx));
}
function extractTranslationKeys(source) {
    const blockMatch = /const\s+t\w*\s*=\s*\{([\s\S]*?)\}\s*\[language\]/.exec(source);
    if (!blockMatch)
        return null;
    const block = blockMatch[1];
    return { es: extractLangKeys(block, 'es'), en: extractLangKeys(block, 'en') };
}
function computeTranslationRanges(source) {
    const ranges = [];
    const blockRegex = /const\s+t\w*\s*=\s*\{/g;
    let bm;
    while ((bm = blockRegex.exec(source)) !== null) {
        const startLine = source.slice(0, bm.index).split('\n').length - 1;
        const closeIdx = source.indexOf('}[language]', bm.index);
        if (closeIdx !== -1) {
            const endLine = source.slice(0, closeIdx).split('\n').length;
            ranges.push([startLine, endLine]);
        }
    }
    return ranges;
}
// ── Individual checks ─────────────────────────────────────────────────────────
function checkMissingKeys(source, rel, usesI18n) {
    if (!usesI18n)
        return [];
    const keys = extractTranslationKeys(source);
    if (!keys)
        return [];
    const issues = [];
    for (const k of keys.es.filter((key) => !keys.en.includes(key))) {
        issues.push({ file: rel, severity: 'error', message: `Key '${k}' present in 'es' but MISSING in 'en'` });
    }
    for (const k of keys.en.filter((key) => !keys.es.includes(key))) {
        issues.push({ file: rel, severity: 'error', message: `Key '${k}' present in 'en' but MISSING in 'es'` });
    }
    return issues;
}
function checkLocaleMethods(lines, rel) {
    const issues = [];
    lines.forEach((line, idx) => {
        if (LOCALE_METHODS_RE.test(line)) {
            issues.push({
                file: rel,
                line: idx + 1,
                severity: 'warning',
                message: "toLocale*() called without locale argument — use t.locale or hardcode 'es-ES'/'en-GB'",
            });
        }
    });
    return issues;
}
function checkEnglishStrings(lines, rel, ranges) {
    const issues = [];
    const inBlock = (idx) => ranges.some(([s, e]) => idx >= s && idx <= e);
    lines.forEach((line, idx) => {
        if (/^\s*(\/\/|\/\*|\*|import )/.test(line) || inBlock(idx))
            return;
        const wordMatch = JSX_WORD_RE.exec(line);
        if (wordMatch && ENGLISH_UI_WORDS.has(wordMatch[1])) {
            issues.push({
                file: rel, line: idx + 1, severity: 'warning',
                message: `Possible hardcoded English word '${wordMatch[1]}' in JSX`,
            });
            return;
        }
        for (const { pattern, description } of ENGLISH_ATTR_PATTERNS) {
            if (pattern.test(line)) {
                issues.push({ file: rel, line: idx + 1, severity: 'warning', message: `Possible hardcoded English string — ${description}` });
                return;
            }
        }
    });
    return issues;
}
function checkFile(filePath) {
    const source = fs.readFileSync(filePath, 'utf-8');
    const rel = path.relative(ROOT, filePath);
    const lines = source.split('\n');
    const usesI18n = source.includes('useLanguage');
    const isClient = source.startsWith("'use client'") || source.startsWith('"use client"');
    const issues = [];
    if (isClient && !usesI18n && />([A-Z][a-z]{3,}|[\u00C0-\u017E]{3,})/.test(source)) {
        issues.push({
            file: rel, severity: 'warning',
            message: 'Client component has JSX text but does NOT use useLanguage — check for hardcoded strings',
        });
    }
    issues.push(...checkMissingKeys(source, rel, usesI18n), ...checkLocaleMethods(lines, rel), ...checkEnglishStrings(lines, rel, computeTranslationRanges(source)));
    return issues;
}
// ── Reporting helpers ─────────────────────────────────────────────────────────
function severityPrefix(severity) {
    if (severity === 'error')
        return '  ❌ ';
    if (severity === 'warning')
        return '  ⚠️  ';
    return '  ℹ️  ';
}
function groupByFile(allIssues) {
    const byFile = new Map();
    for (const issue of allIssues) {
        const list = byFile.get(issue.file) ?? [];
        list.push(issue);
        byFile.set(issue.file, list);
    }
    return byFile;
}
function printReport(allIssues) {
    const byFile = groupByFile(allIssues);
    for (const [file, issues] of byFile.entries()) {
        console.log(`\n  📄  ${file}`);
        for (const issue of issues) {
            const location = issue.line ? `(line ${issue.line}) ` : '';
            console.log(`${severityPrefix(issue.severity)}${location}${issue.message}`);
        }
    }
    const errors = allIssues.filter((i) => i.severity === 'error').length;
    const warnings = allIssues.filter((i) => i.severity === 'warning').length;
    const infos = allIssues.filter((i) => i.severity === 'info').length;
    console.log('\n──────────────────────────────────────────────────────');
    console.log(`  Summary: ${errors} error(s)   ${warnings} warning(s)   ${infos} info(s)`);
    console.log('──────────────────────────────────────────────────────\n');
}
// ── Main ──────────────────────────────────────────────────────────────────────
function main() {
    console.log('\n🔍  Auditing i18n for public client-facing pages…\n');
    const files = collectFiles(SCAN_DIRS);
    console.log(`   Files scanned: ${files.length}\n`);
    const allIssues = [];
    for (const f of files) {
        allIssues.push(...checkFile(f));
    }
    if (allIssues.length === 0) {
        console.log('✅  No i18n issues found.\n');
        return;
    }
    printReport(allIssues);
    if (allIssues.some((i) => i.severity === 'error')) {
        console.log('  Errors must be fixed — translation keys are out of sync between ES and EN.\n');
        process.exit(1);
    }
}
main();
