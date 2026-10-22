'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const frontend = path.resolve(__dirname, '../frontend');
const esbuild = require(path.join(frontend, 'node_modules/esbuild'));

// Compile the real controls/formatter with the existing Vite build dependency.
// Render with React's server renderer; no second frontend test framework needed.
const result = esbuild.buildSync({
    absWorkingDir: frontend,
    stdin: { contents: `
        import React from 'react';
        import { renderToStaticMarkup } from 'react-dom/server';
        import { Field } from './src/components/ui';
        export { formatCurrency } from './src/api/api';
        export function renderField(hint) {
            return renderToStaticMarkup(
                <Field label="Amount" hint={hint}>
                    <input id="amount" aria-describedby="amount-error" />
                </Field>
            );
        }
    `, loader: 'tsx', resolveDir: frontend },
    bundle: true, write: false, platform: 'node', format: 'cjs',
    external: ['react', 'react-dom/server', 'lucide-react', 'axios'],
    define: { 'import.meta.env.VITE_API_URL': 'undefined' },
});
const filename = path.join(frontend, '__contract-verification.cjs');
const compiled = new Module(filename, module);
compiled.filename = filename;
compiled.paths = Module._nodeModulePaths(frontend);
compiled._compile(result.outputFiles[0].text, filename);
const { renderField, formatCurrency } = compiled.exports;

test('Field preserves existing error descriptions when adding its visible hint', () => {
    const html = renderField('Use the exact receipt amount.');
    assert.match(html, /<label for="amount">Amount<\/label>/);
    assert.match(html, /aria-describedby="amount-error amount-hint"/);
    assert.match(html, /id="amount-hint"[^>]*>Use the exact receipt amount\.<\/p>/);
});

test('Field keeps the existing description when no hint is supplied', () => {
    const html = renderField(undefined);
    assert.match(html, /aria-describedby="amount-error"/);
    assert.doesNotMatch(html, /amount-hint/);
});

test('cached peso formatter preserves existing locale, rounding and invalid-value behavior', () => {
    const original = (value) => {
        const number = Number(value ?? 0);
        return new Intl.NumberFormat('en-PH', {
            style: 'currency', currency: 'PHP', minimumFractionDigits: 2,
        }).format(Number.isFinite(number) ? number : 0);
    };
    for (const value of ['1234.50', '0.005', -12.5, 0, null, undefined, NaN, Infinity, 'invalid']) {
        assert.equal(formatCurrency(value), original(value), String(value));
    }
    const count = 10_000;
    const start = performance.now();
    for (let i = 0; i < count; i++) original(i / 100);
    const beforeMs = performance.now() - start;
    const cachedStart = performance.now();
    for (let i = 0; i < count; i++) formatCurrency(i / 100);
    const afterMs = performance.now() - cachedStart;
    // Timing is evidence, not a flaky pass/fail threshold.
    console.log(JSON.stringify({ currencyBenchmark: { calls: count, beforeMs, afterMs } }));
});
