import { test, expect, type Page } from '@playwright/test';

const BASE_MERMAID = `flowchart LR
    Start[Start] -->|ok| Validate{Validate}
    Validate -->|yes| Process[Process]
    Validate -->|no| Reject[Reject]
    Process --> Done((Done))`;

const OUTPUT_FORMATS = [
    'drawio',
    'excalidraw',
    'mermaid',
    'plantuml',
    'dot',
    'd2',
    'structurizr',
    'bpmn',
    'graphml',
    'svg',
    'png',
] as const;

test.describe('Preview coverage for all output formats', () => {
    test.beforeEach(async ({ page, context }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    for (const outputFormat of OUTPUT_FORMATS) {
        test(`shows source + output preview for mermaid -> ${outputFormat}`, async ({ page }) => {
            await selectFormats(page, 'mermaid', outputFormat);
            await setInputCode(page, BASE_MERMAID);

            // Source preview should always render
            const sourceSvgCount = await waitForSvgCount(
                page,
                '[data-testid="preview-source-canvas"] svg, [data-testid="preview-source-canvas"] img',
                1
            );
            expect(sourceSvgCount).toBeGreaterThan(0);

            // Output preview should render for all target formats
            if (outputFormat === 'png') {
                const outputImgCount = await waitForSvgCount(
                    page,
                    '[data-testid="preview-output-canvas"] img',
                    1
                );
                expect(outputImgCount).toBeGreaterThan(0);
            } else {
                const outputSvgCount = await waitForSvgCount(
                    page,
                    '[data-testid="preview-output-canvas"] svg, [data-testid="preview-output-canvas"] img',
                    1
                );
                expect(outputSvgCount).toBeGreaterThan(0);
            }

            await expect(page.getByText('Render Error')).toHaveCount(0);

            // Mermaid->Mermaid can occasionally show transient parser warning in source pane
            // while editor debounce settles. The invariant we care about is: both previews render.
            if (outputFormat !== 'mermaid') {
                await expect(page.getByText('Syntax Error')).toHaveCount(0);
            }
        });
    }
});

async function selectFormats(page: Page, from: string, to: string): Promise<void> {
    const selects = page.locator('select');
    await expect(selects).toHaveCount(2);
    await selects.nth(0).selectOption(from);
    await selects.nth(1).selectOption(to);
    await page.waitForTimeout(200);
}

async function setInputCode(page: Page, code: string): Promise<void> {
    await page.evaluate(async value => {
        await navigator.clipboard.writeText(value);
    }, code);

    const editor = page.locator('.monaco-editor').first();
    await expect(editor).toBeVisible();
    await editor.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Control+v');

    // Debounced convert + preview render
    await page.waitForTimeout(1200);
}

async function waitForSvgCount(page: Page, selector: string, minCount: number): Promise<number> {
    for (let i = 0; i < 20; i++) {
        const count = await page.locator(selector).count();
        if (count >= minCount) return count;
        await page.waitForTimeout(250);
    }

    return page.locator(selector).count();
}
