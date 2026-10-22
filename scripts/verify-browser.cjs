'use strict';
// Requires an installed Playwright, or ARCTIC_PLAYWRIGHT_PATH pointing to one.
// Uses the guarded local demo only. Does not submit operational forms or persist auth.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.ARCTIC_PLAYWRIGHT_PATH || 'playwright');
const root = path.resolve(__dirname, '..');
const origin = 'http://127.0.0.1:5000';
const baseline = process.argv.includes('--baseline');
const mode = baseline ? 'before' : 'after';
const output = path.join(root, 'artifacts', 'sauron-browser', mode);
fs.mkdirSync(output, { recursive: true });

async function main() {
    const health = await fetch(origin + '/health', { signal: AbortSignal.timeout(3000) });
    assert.equal(health.status, 200, 'Local application must be healthy');
    assert.equal((await health.json()).instance, 'local', 'Browser checks require the isolated local launcher');
    const browser = await chromium.launch({ headless: true, executablePath: process.env.ARCTIC_CHROMIUM_PATH });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    const failedRequests = [];
    const checks = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => {
        if (response.status() >= 400 && response.url().startsWith(origin + '/api/')) {
            failedRequests.push({ url: new URL(response.url()).pathname, status: response.status() });
        }
    });
    async function visit(route) {
        await page.goto(origin + route, { waitUntil: 'networkidle' });
        await page.locator('.app-main h1').waitFor();
        assert.equal(await page.getByText('We couldn’t load this view', { exact: true }).count(), 0, route);
    }
    async function checkTabs(route, count) {
        await visit(route);
        const tabs = page.getByRole('tab');
        assert.equal(await tabs.count(), count);
        const assertActive = async (index) => {
            await page.waitForFunction((i) => {
                const tabs = [...document.querySelectorAll('[role="tab"]')];
                return tabs[i]?.getAttribute('aria-selected') === 'true';
            }, index);
            assert.equal(await tabs.nth(index).evaluate((el) => document.activeElement === el), true);
            assert.deepEqual(await tabs.evaluateAll((els) => els.map((el) => el.tabIndex)),
                Array.from({ length: count }, (_, i) => i === index ? 0 : -1));
            const control = await tabs.nth(index).getAttribute('aria-controls');
            const panel = page.locator(`#${control}`);
            assert.equal(await panel.getAttribute('aria-labelledby'), await tabs.nth(index).getAttribute('id'));
            assert.equal(await panel.isVisible(), true);
        };
        await tabs.first().focus();
        await page.keyboard.press('ArrowRight'); await assertActive(1);
        await page.keyboard.press('End'); await assertActive(count - 1);
        await page.keyboard.press('ArrowRight'); await assertActive(0);
        await page.keyboard.press('ArrowLeft'); await assertActive(count - 1);
        await page.keyboard.press('Home'); await assertActive(0);
        await page.keyboard.press('Tab');
        assert.equal(await page.locator('[role="tablist"]').evaluate((el) => el.contains(document.activeElement)), false);
        checks.push(`Keyboard arrows/wrap/Home/End/Tab and panel relationships: ${route}`);
    }
    try {
        await page.goto(origin + '/login', { waitUntil: 'networkidle' });
        await page.getByRole('button', { name: 'Explore demo workspace' }).click();
        await page.waitForURL(origin + '/');
        await page.locator('.app-main h1').waitFor();
        checks.push('Real local demo login and persisted session revalidation');

        // Capture the unchanged visual baseline and repeat at the same dimensions.
        for (const theme of ['dark', 'light']) {
            await page.evaluate((value) => localStorage.setItem('arctic-theme', value), theme);
            for (const width of [1440, 320]) {
                await page.setViewportSize({ width, height: 1000 });
                for (const route of ['/reports', '/service-desk']) {
                    await visit(route);
                    assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
                    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true,
                        `${route} ${theme} ${width}: viewport overflow`);
                    await page.screenshot({ path: path.join(output, `${route.slice(1)}-${theme}-${width}.png`), fullPage: true, animations: 'disabled' });
                }
            }
        }
        checks.push('Reports/Service desk screenshots: dark/light, 1440px/320px, no viewport overflow');
        if (!baseline) {
            await page.setViewportSize({ width: 1440, height: 1000 });
            await checkTabs('/reports', 3);
            await checkTabs('/service-desk', 2);

            // Opening and dismissing a form tests existing dialog behavior without a write.
            await visit('/service-desk');
            const opener = page.getByRole('button', { name: 'New request', exact: true });
            await opener.click();
            const dialog = page.getByRole('dialog', { name: 'New service request', exact: true });
            await dialog.waitFor();
            const describedInput = dialog.getByLabel('Service address', { exact: true });
            const ids = (await describedInput.getAttribute('aria-describedby')).split(/\s+/);
            for (const id of ids) assert.equal(await page.locator(`[id="${id}"]`).count(), 1);
            await page.keyboard.press('Escape');
            await dialog.waitFor({ state: 'detached' });
            assert.equal(await opener.evaluate((el) => document.activeElement === el), true);
            checks.push('Service request dialog labels/hint IDs, Escape and focus restoration; no submission');

            for (const theme of ['dark', 'light']) {
                await page.evaluate((value) => localStorage.setItem('arctic-theme', value), theme);
                for (const width of [1440, 320]) {
                    await page.setViewportSize({ width, height: 1000 });
                    for (const route of ['/', '/service-desk', '/inspection-templates', '/bookings', '/calendar', '/customers', '/technicians', '/units', '/inventory', '/invoices', '/reports', '/settings', '/jobs', '/financials']) {
                        await visit(route);
                        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true,
                            `${route} ${theme} ${width}: viewport overflow`);
                    }
                }
            }
            checks.push('All 12 operational routes plus /jobs and /financials aliases: both themes at 1440px and 320px');

            await page.setViewportSize({ width: 390, height: 844 });
            await visit('/service-desk');
            const menu = page.getByRole('button', { name: /open navigation/i });
            await menu.click();
            await page.locator('dialog[open]').waitFor();
            await page.keyboard.press('Escape');
            assert.equal(await menu.evaluate((el) => document.activeElement === el), true);
            assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
            checks.push('390px native navigation drawer Escape/focus with reduced motion');
        }
        assert.deepEqual(failedRequests, [], 'Unexpected failed API responses');
        assert.deepEqual(errors, [], 'Browser runtime errors');
        fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ mode, checks, errors, failedRequests }, null, 2) + '\n');
        console.log(JSON.stringify({ mode, checks, errors, failedRequests }, null, 2));
    } finally {
        await browser.close();
    }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
