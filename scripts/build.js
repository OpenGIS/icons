import fs from 'fs-extra';
import path from 'path';
import { promisify } from 'util';
import potrace from 'potrace';
import { optimize } from 'svgo';
import SVGSpriter from 'svg-sprite';
import { glob } from 'glob';
import SVGPathCommander from 'svg-path-commander';
import fantasticon from 'fantasticon';

const { generateFonts, FontAssetType, OtherAssetType } = fantasticon;
const trace = promisify(potrace.trace);

const PATHS = {
    png: 'src/png',
    svg: 'src/svg',
    dist: 'dist',
    codepoints: 'src/codepoints.json',
};

async function processPngs() {
    const files = await fs.readdir(PATHS.png).catch(() => []);
    const pngs = files.filter(f => f.endsWith('.png'));
    if (!pngs.length) return;

    console.log('Processing PNGs...');
    await fs.ensureDir(PATHS.svg);

    for (const file of pngs) {
        const name = path.basename(file, '.png');
        const inputPath = path.join(PATHS.png, file);
        const outputPath = path.join(PATHS.svg, `${name}.svg`);

        console.log(`  Tracing ${file}...`);
        try {
            const svgString = await trace(inputPath, {
                threshold: 128,
                optCurve: true,
                optTolerance: 0.2,
                turdSize: 2,
                turnPolicy: potrace.Potrace.TURNPOLICY_MINORITY,
            });

            const result = optimize(svgString, {
                path: outputPath,
                multipass: true,
                plugins: [
                    'preset-default',
                    'removeDimensions',
                    {
                        name: 'addAttributesToSVGElement',
                        params: {
                            attributes: [
                                { viewBox: '0 0 512 512' },
                                { 'fill-rule': 'evenodd' }
                            ]
                        }
                    }
                ]
            });

            await fs.writeFile(outputPath, result.data);
            console.log(`  Saved ${outputPath}`);
        } catch (err) {
            console.error(`  Error processing ${file}:`, err);
        }
    }
}

async function normalizeSvgs() {
    console.log('Normalizing SVGs to 16x16 grid...');
    const files = await glob(`${PATHS.svg}/*.svg`);

    for (const file of files) {
        try {
            const content = await fs.readFile(file, 'utf8');

            const viewBoxMatch = content.match(/viewBox="([^"]+)"/);
            let viewBox = [0, 0, 16, 16];

            if (viewBoxMatch) {
                viewBox = viewBoxMatch[1].split(/[\s,]+/).map(Number);
            } else {
                const widthMatch = content.match(/width="([^"]+)"/);
                const heightMatch = content.match(/height="([^"]+)"/);
                if (widthMatch && heightMatch) {
                    viewBox = [0, 0, parseFloat(widthMatch[1]), parseFloat(heightMatch[1])];
                }
            }

            const newContent = content.replace(/d="([^"]+)"/g, (match, d) => {
                const pathCmd = new SVGPathCommander(d);

                if (viewBox[2] !== 16 || viewBox[3] !== 16 || viewBox[0] !== 0 || viewBox[1] !== 0) {
                    const scaleX = 16 / viewBox[2];
                    const scaleY = 16 / viewBox[3];
                    const translateX = -viewBox[0];
                    const translateY = -viewBox[1];

                    pathCmd.transform({ translate: [translateX, translateY], scale: [scaleX, scaleY] });
                    return `d="${pathCmd.toString()}"`;
                }
                return match;
            });

            let finalContent = newContent.replace(/viewBox="[^"]+"/, 'viewBox="0 0 16 16"');
            if (!finalContent.includes('viewBox="0 0 16 16"')) {
                finalContent = finalContent.replace('<svg', '<svg viewBox="0 0 16 16"');
            }
            finalContent = finalContent.replace(/\s(width|height)="[^"]+"/g, '');

            const optimized = optimize(finalContent, {
                path: file,
                multipass: true,
                plugins: [
                    'preset-default',
                    'removeDimensions',
                    {
                        name: 'cleanupNumericValues',
                        params: { floatPrecision: 3 }
                    }
                ]
            });

            await fs.writeFile(file, optimized.data);
        } catch (err) {
            console.error(`  Error normalizing ${path.basename(file)}:`, err);
        }
    }
    console.log(`  Normalized ${files.length} SVGs`);
}

async function buildSprite() {
    console.log('Building SVG sprite...');
    await fs.ensureDir(PATHS.dist);

    const spriter = new SVGSpriter({
        mode: {
            symbol: {
                dest: '.',
                sprite: 'ogis-icons.svg',
            }
        }
    });

    const files = await glob(`${PATHS.svg}/*.svg`);
    for (const file of files) {
        spriter.add(
            path.resolve(file),
            path.basename(file),
            fs.readFileSync(file, { encoding: 'utf-8' })
        );
    }

    const { result } = await spriter.compileAsync();

    for (const mode in result) {
        for (const resource in result[mode]) {
            const fileName = path.basename(result[mode][resource].path);
            const outputPath = path.join(PATHS.dist, fileName);
            await fs.writeFile(outputPath, result[mode][resource].contents);
            console.log(`  Wrote ${outputPath}`);
        }
    }
}

async function updateCodepoints() {
    let codepoints = {};

    if (await fs.pathExists(PATHS.codepoints)) {
        codepoints = await fs.readJson(PATHS.codepoints);
    }

    const files = await glob(`${PATHS.svg}/*.svg`);
    const iconNames = files.map(f => path.basename(f, '.svg'));

    const maxCode = Object.values(codepoints).reduce((max, code) => Math.max(max, code), 0xf100);
    let next = maxCode;
    let changed = false;

    for (const name of iconNames.sort()) {
        if (!Object.prototype.hasOwnProperty.call(codepoints, name)) {
            next++;
            codepoints[name] = next;
            changed = true;
            console.log(`  Assigned codepoint U+${next.toString(16).toUpperCase()} to '${name}'`);
        }
    }

    if (changed) {
        await fs.writeJson(PATHS.codepoints, codepoints, { spaces: 2 });
        console.log('  Updated codepoints.json');
    }

    return codepoints;
}

async function buildFont(codepoints) {
    console.log('Building icon font...');
    await generateFonts({
        inputDir: PATHS.svg,
        outputDir: PATHS.dist,
        name: 'ogis-icons',
        fontTypes: [FontAssetType.WOFF2, FontAssetType.WOFF],
        assetTypes: [OtherAssetType.CSS, OtherAssetType.SCSS, OtherAssetType.JSON],
        prefix: 'oi',
        codepoints,
        normalize: true,
        fontHeight: 300,
    });
    console.log('  Font files written to dist/');
}

async function buildVariablesScss(codepoints) {
    const entries = Object.entries(codepoints)
        .map(([name, cp]) => `    "${name}": "\\${cp.toString(16)}"`)
        .join(',\n');

    const content = `// Variables-only file — no @font-face or CSS classes.
// Import this when you only need $ogis-icons-map (e.g. for SCSS map-get usage).
// @use '@ogis/icons/dist/ogis-icons-variables' as *;
$ogis-icons-map: (\n${entries}\n) !default;\n`;

    const outputPath = path.join(PATHS.dist, 'ogis-icons-variables.scss');
    await fs.writeFile(outputPath, content);
    console.log(`  Wrote ${outputPath}`);
}

async function run() {
    await fs.ensureDir(PATHS.dist);
    await processPngs();
    await normalizeSvgs();
    await buildSprite();
    const codepoints = await updateCodepoints();
    await buildFont(codepoints);
    await buildVariablesScss(codepoints);
    console.log('\nBuild complete ✓');
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
