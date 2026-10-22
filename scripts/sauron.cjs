#!/usr/bin/env node
'use strict';

// Repository integration only. Never installs runtimes or changes application data.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const WORKFLOW = '.sauron/workflow.json';
const LOCK = 'sauron-skills.lock.json';
const INTEGRITY = '.sauron/integrity.json';
const SKILLS = '.agents/skills';
const slash = (value) => value.replace(/\\/g, '/');

function safePath(root, relative) {
    if (typeof relative !== 'string' || !relative || /[\x00-\x1f]/.test(relative)
        || path.isAbsolute(relative) || /^[a-z]:/i.test(relative) || relative.startsWith('\\')) {
        throw new Error(`Invalid repository path: ${String(relative)}`);
    }
    const base = path.resolve(root);
    const resolved = path.resolve(base, slash(relative));
    const inside = path.relative(base, resolved);
    if (!inside || inside.startsWith(`..${path.sep}`) || inside === '..' || path.isAbsolute(inside)) {
        throw new Error(`Path escapes repository: ${relative}`);
    }
    let current = base;
    for (const part of inside.split(path.sep)) {
        current = path.join(current, part);
        if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) {
            throw new Error(`Symlink is not allowed: ${relative}`);
        }
    }
    return resolved;
}

function readJson(root, relative) {
    try { return JSON.parse(fs.readFileSync(safePath(root, relative), 'utf8')); }
    catch (error) { throw new Error(`${relative}: ${error.message}`); }
}

function strings(value, label) {
    if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string' || !entry.trim())) {
        throw new Error(`${label} must be an array of nonempty strings`);
    }
}

function workflow(root) {
    const config = readJson(root, WORKFLOW);
    if (!config || config.version !== 1 || typeof config.context !== 'string'
        || !Array.isArray(config.skills) || !Array.isArray(config.routes)
        || !config.architecture || typeof config.architecture.frontendRoot !== 'string') {
        throw new Error(`${WORKFLOW}: unsupported or malformed configuration`);
    }
    strings(config.requiredFiles, 'requiredFiles');
    strings(config.architecture.sourceRoots, 'architecture.sourceRoots');
    const skillPaths = new Set();
    const paths = [config.context, config.architecture.frontendRoot, ...config.requiredFiles, ...config.architecture.sourceRoots];
    for (const entry of config.skills) {
        if (!entry || typeof entry.path !== 'string' || typeof entry.reason !== 'string' || !entry.reason.trim()
            || !entry.path.startsWith(`${SKILLS}/`) || !entry.path.endsWith('/SKILL.md') || skillPaths.has(entry.path)) {
            throw new Error(`${WORKFLOW}: malformed or duplicate skill`);
        }
        skillPaths.add(entry.path);
        paths.push(entry.path);
    }
    const ids = new Set();
    for (const route of config.routes) {
        if (!route || typeof route.id !== 'string' || !route.id || ids.has(route.id)) {
            throw new Error(`${WORKFLOW}: malformed or duplicate route id`);
        }
        ids.add(route.id);
        for (const key of ['match', 'skills', 'agents', 'checks', 'context']) strings(route[key], `${route.id}.${key}`);
        if (!route.match.length) throw new Error(`${route.id}.match must not be empty`);
        for (const prefix of route.match) safePath(root, prefix);
        for (const skill of route.skills) {
            if (!skillPaths.has(skill)) throw new Error(`${route.id}: skill not registered: ${skill}`);
            paths.push(skill);
        }
        for (const record of route.context) paths.push(slash(path.posix.join(config.context, slash(record))));
    }
    for (const relative of paths) {
        const absolute = safePath(root, relative);
        if (!fs.existsSync(absolute)) throw new Error(`Required path missing: ${relative}`);
    }
    return config;
}

function localPackage(root) {
    const project = readJson(root, 'package.json');
    const installed = readJson(root, 'node_modules/sauron-ai/package.json');
    const pin = project.devDependencies?.['sauron-ai'];
    if (typeof pin !== 'string' || !/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(pin) || pin !== installed.version) {
        throw new Error(`sauron-ai exact pin (${pin ?? 'missing'}) differs from installed version (${installed.version ?? 'missing'})`);
    }
    return installed;
}

function walk(root, relative, accept = () => true) {
    const directory = safePath(root, relative);
    const files = [];
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
        const child = `${slash(relative).replace(/\/$/, '')}/${entry.name}`;
        if (entry.isSymbolicLink()) throw new Error(`Symlink is not allowed: ${child}`);
        if (entry.isDirectory()) files.push(...walk(root, child, accept));
        else if (entry.isFile() && accept(child)) files.push(child);
        else if (!entry.isFile()) throw new Error(`Unsupported file type: ${child}`);
    }
    return files;
}

// Normalize CRLF bytes without changing binary bytes or lone CR characters.
function digest(root, relative) {
    const source = fs.readFileSync(safePath(root, relative));
    const normalized = Buffer.allocUnsafe(source.length);
    let size = 0;
    for (let index = 0; index < source.length; index += 1) {
        if (source[index] === 13 && source[index + 1] === 10) continue;
        normalized[size++] = source[index];
    }
    return `sha512:${crypto.createHash('sha512').update(normalized.subarray(0, size)).digest('hex')}`;
}

function writeJson(root, relative, value) {
    const destination = safePath(root, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function lock(root) {
    workflow(root);
    const installed = localPackage(root);
    const files = walk(root, SKILLS);
    const installedAt = new Date().toISOString();
    const entries = {};
    const hashes = {};
    for (const relative of files) {
        hashes[relative] = digest(root, relative);
        if (relative.endsWith('/SKILL.md')) {
            entries[relative] = { name: relative, version: installed.version, resolved: relative, integrity: hashes[relative], installedAt };
        }
    }
    if (!Object.keys(entries).length) throw new Error('No local skills to lock');
    writeJson(root, LOCK, { version: '1.0.0', skills: entries });
    writeJson(root, INTEGRITY, { version: 1, packageVersion: installed.version, files: hashes });
    return `Locked ${Object.keys(entries).length} skills and ${files.length} catalog files. Review both lock files before committing.`;
}

function doctor(root) {
    workflow(root);
    const installed = localPackage(root);
    const pinned = readJson(root, LOCK);
    const manifest = readJson(root, INTEGRITY);
    if (pinned?.version !== '1.0.0' || !pinned.skills || Array.isArray(pinned.skills)
        || manifest?.version !== 1 || manifest.packageVersion !== installed.version || !manifest.files || Array.isArray(manifest.files)) {
        throw new Error('Malformed or outdated Sauron lock/integrity files; review changes before explicitly running lock');
    }
    const files = walk(root, SKILLS);
    const actual = new Set(files);
    const problems = [];
    for (const relative of Object.keys(manifest.files)) {
        safePath(root, relative);
        if (!relative.startsWith(`${SKILLS}/`)) throw new Error(`Integrity entry outside skill catalog: ${relative}`);
        if (!actual.has(relative)) problems.push(`missing catalog file: ${relative}`);
    }
    for (const relative of files) {
        if (!(relative in manifest.files)) problems.push(`untracked catalog file: ${relative}`);
        else if (manifest.files[relative] !== digest(root, relative)) problems.push(`changed catalog file: ${relative}`);
    }
    const skillFiles = new Set(files.filter((relative) => relative.endsWith('/SKILL.md')));
    for (const relative of Object.keys(pinned.skills)) {
        safePath(root, relative);
        if (!skillFiles.has(relative)) problems.push(`missing or unexpected locked skill: ${relative}`);
    }
    for (const relative of skillFiles) {
        const entry = pinned.skills[relative];
        if (!entry || entry.name !== relative || entry.resolved !== relative || entry.version !== installed.version
            || entry.integrity !== digest(root, relative) || typeof entry.installedAt !== 'string'
            || !Number.isFinite(Date.parse(entry.installedAt))) {
            problems.push(`missing or changed skill lock: ${relative}`);
        }
    }
    if (problems.length) throw new Error(`Sauron integrity failed:\n${problems.map((item) => `- ${item}`).join('\n')}`);
    return `Sauron doctor passed: local ${installed.version}, ${skillFiles.size} skills, ${files.length} verified catalog files. Registration and integrity do not establish agent execution.`;
}

function changedFiles(root, args) {
    if (args.length && args[0] !== '--files') throw new Error('Usage: route [--files path ...]');
    let files;
    if (args[0] === '--files') files = args.slice(1);
    else {
        files = [];
        for (const command of [['diff', '--name-only', '-z', 'HEAD', '--'], ['ls-files', '--others', '--exclude-standard', '-z']]) {
            const result = spawnSync('git', command, { cwd: root, encoding: 'utf8', shell: false });
            if (result.error || result.status !== 0) throw new Error(`Cannot discover Git changes: ${result.error?.message || result.stderr}`);
            files.push(...result.stdout.split('\0').filter(Boolean));
        }
    }
    return [...new Set(files.map((file) => slash(path.relative(root, safePath(root, file)))))].sort();
}

function route(root, args = []) {
    const config = workflow(root);
    const files = changedFiles(root, args);
    const selected = config.routes.filter((entry) => files.some((file) => entry.match.some((prefix) => {
        const normalized = slash(prefix);
        return normalized.endsWith('/') ? file.startsWith(normalized) : file === normalized;
    })));
    if (!selected.length) return 'No applicable Sauron route. Handle the scoped change directly; no full engineering loop required.';
    const union = (key) => [...new Set(selected.flatMap((entry) => entry[key]))];
    const context = union('context').map((record) => slash(path.posix.join(config.context, slash(record))));
    return [
        `Routes: ${selected.map((entry) => entry.id).join(', ')}`,
        `Agents (use when task warrants): ${union('agents').join(', ') || 'none'}`,
        'Skills (read only applicable entries):', ...union('skills').map((entry) => `- ${entry}`),
        'Context:', ...context.map((entry) => `- ${entry}`),
        'Suggested checks (not executed):', ...union('checks').map((entry) => `- ${entry}`),
    ].join('\n');
}

function find(root, args) {
    const installed = localPackage(root);
    const bin = typeof installed.bin === 'string' ? installed.bin : installed.bin?.sauron;
    if (typeof bin !== 'string') throw new Error('Installed sauron-ai has no sauron executable');
    const executable = safePath(root, `node_modules/sauron-ai/${bin}`);
    const result = spawnSync(process.execPath, [executable, 'find-skill', ...args], { cwd: root, stdio: 'inherit', shell: false });
    if (result.error) throw result.error;
    return result.status ?? 1;
}

function graph(root) {
    const config = workflow(root);
    const ts = require(safePath(root, 'backend/node_modules/typescript'));
    const extension = /\.(?:[cm]?[jt]sx?)$/i;
    const files = [...new Set(config.architecture.sourceRoots.flatMap((source) => walk(root, source, (file) => extension.test(file))))].sort();
    const known = new Set(files);
    const edges = [];
    const unresolved = [];
    const sourceText = (relative) => fs.readFileSync(safePath(root, relative), 'utf8');
    const suffixes = ['', '.ts', '.tsx', '.js', '.jsx', '.mts', '.cts', '.mjs', '.cjs', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
    for (const file of files) {
        const ast = ts.createSourceFile(file, sourceText(file), ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
        const imports = new Set();
        const visit = (node) => {
            if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)) {
                imports.add(node.moduleSpecifier.text);
            }
            if (ts.isCallExpression(node) && node.arguments.length === 1 && ts.isStringLiteralLike(node.arguments[0])
                && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) {
                imports.add(node.arguments[0].text);
            }
            ts.forEachChild(node, visit);
        };
        visit(ast);
        for (const specifier of imports) {
            if (!specifier.startsWith('.')) continue;
            const base = slash(path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier)));
            safePath(root, base);
            const bases = [base];
            if (/\.[cm]?js$/.test(base)) bases.push(base.replace(/\.[cm]?js$/, '.ts'), base.replace(/\.js$/, '.tsx'));
            const target = bases.flatMap((candidate) => suffixes.map((suffix) => candidate + suffix)).find((candidate) => known.has(candidate));
            if (target) edges.push({ from: file, to: target });
            else if (!/\.(?:css|svg|png|jpe?g|webp|json)$/.test(specifier)) unresolved.push({ from: file, specifier });
        }
    }
    const adjacency = new Map(files.map((file) => [file, []]));
    for (const edge of edges) adjacency.get(edge.from).push(edge.to);
    // Tarjan components report cycles once, including self-imports.
    let next = 0;
    const indexes = new Map(), lows = new Map(), active = new Set(), stack = [], cycles = [];
    function visit(file) {
        indexes.set(file, next); lows.set(file, next++); stack.push(file); active.add(file);
        for (const target of adjacency.get(file)) {
            if (!indexes.has(target)) { visit(target); lows.set(file, Math.min(lows.get(file), lows.get(target))); }
            else if (active.has(target)) lows.set(file, Math.min(lows.get(file), indexes.get(target)));
        }
        if (lows.get(file) !== indexes.get(file)) return;
        const group = [];
        let target;
        do { target = stack.pop(); active.delete(target); group.push(target); } while (target !== file);
        if (group.length > 1 || adjacency.get(file).includes(file)) cycles.push(group.sort());
    }
    for (const file of files) if (!indexes.has(file)) visit(file);
    const result = { implementation: 'repository fallback', scope: config.architecture.sourceRoots, limitations: ['Relative literal source imports only; external packages, aliases, runtime imports and type resolution are not a complete architecture proof.'], files, edges, cycles, unresolved };
    writeJson(root, '.sauron/graph/graph.json', result);
    const report = [
        '# Repository source dependency graph', '',
        'Implementation: repository fallback. The installed upstream graph command references an unavailable package script.', '',
        `${files.length} source files; ${edges.length} relative import edges; ${cycles.length} circular components; ${unresolved.length} unresolved relative imports.`, '',
        ...result.limitations, '', '## Circular components', '',
        ...(cycles.length ? cycles.map((group) => `- ${group.join(' -> ')}`) : ['None detected within this scope.']), '',
        '## Unresolved relative imports', '', ...(unresolved.length ? unresolved.map((item) => `- ${item.from}: ${item.specifier}`) : ['None.']), '',
    ].join('\n');
    fs.writeFileSync(safePath(root, '.sauron/graph/graph-report.md'), report);
    return `Repository fallback graph: ${files.length} source files, ${edges.length} edges, ${cycles.length} circular components. See .sauron/graph/graph-report.md. Relative literal imports only.`;
}

function main(args = process.argv.slice(2), options = {}) {
    const root = path.resolve(options.root || path.join(__dirname, '..'));
    const output = options.output || ((message) => process.stdout.write(`${message}\n`));
    const errorOutput = options.errorOutput || ((message) => process.stderr.write(`${message}\n`));
    try {
        const [command, ...rest] = args;
        if (command !== 'route' && command !== 'find' && rest.length) throw new Error(`Unexpected arguments for ${command}`);
        if (command === 'find') return find(root, rest);
        const commands = { doctor, lock, route, graph };
        if (!Object.hasOwn(commands, command)) throw new Error('Usage: node scripts/sauron.cjs <doctor|lock|route [--files path ...]|find query ...|graph>');
        output(commands[command](root, rest));
        return 0;
    } catch (error) {
        errorOutput(`Sauron: ${error.message}`);
        return 1;
    }
}

module.exports = { safePath, workflow, digest, lock, doctor, changedFiles, route, graph, main };
if (require.main === module) process.exitCode = main();
