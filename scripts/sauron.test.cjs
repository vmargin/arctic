'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { safePath, lock, doctor, route, digest, graph, main } = require('./sauron.cjs');

function fixture(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'arctic-sauron-test-'));
    t.after(() => {
        const resolved = path.resolve(root);
        const temporary = path.resolve(os.tmpdir());
        assert.equal(path.dirname(resolved), temporary, 'Cleanup target must be directly inside the temporary directory');
        assert.ok(path.basename(resolved).startsWith('arctic-sauron-test-'), 'Cleanup target must use the fixture prefix');
        fs.rmSync(resolved, { recursive: true, force: true });
    });
    const write = (relative, content) => {
        const destination = path.join(root, relative);
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        fs.writeFileSync(destination, typeof content === 'string' ? content : JSON.stringify(content));
    };
    const skill = '.agents/skills/example/SKILL.md';
    const config = {
        version: 1, context: 'projects/arctic/context/engineering-loop',
        skills: [{ path: skill, reason: 'Fixture capability' }], requiredFiles: ['AGENTS.md'],
        architecture: { sourceRoots: ['backend/src', 'frontend/src', 'api'], frontendRoot: 'frontend/src' },
        routes: [
            { id: 'frontend', match: ['frontend/'], skills: [skill], agents: ['aragorn'], checks: ['npm run typecheck'], context: ['DESIGN.md'] },
            { id: 'backend', match: ['backend/'], skills: [skill], agents: ['aragorn', 'boromir'], checks: ['npm run typecheck', 'npm test'], context: ['DESIGN.md'] },
        ],
    };
    write('package.json', { devDependencies: { 'sauron-ai': '3.0.0' } });
    write('node_modules/sauron-ai/package.json', { version: '3.0.0' });
    write('.sauron/workflow.json', config);
    write('AGENTS.md', '# Fixture');
    write(`${config.context}/DESIGN.md`, '# Design');
    write(skill, '# Example\n');
    write('.agents/skills/example/references/rules.md', '# Rules\n');
    for (const directory of config.architecture.sourceRoots) fs.mkdirSync(path.join(root, directory), { recursive: true });
    return { root, write, skill, config };
}

test('explicit lock verifies both skill and reference content; CRLF is portable', (t) => {
    const f = fixture(t);
    assert.match(lock(f.root), /1 skills and 2 catalog files/);
    const before = fs.readFileSync(path.join(f.root, 'sauron-skills.lock.json'), 'utf8');
    f.write(f.skill, '# Example\r\n');
    assert.match(doctor(f.root), /doctor passed/);
    assert.equal(fs.readFileSync(path.join(f.root, 'sauron-skills.lock.json'), 'utf8'), before);
    f.write('.agents/skills/example/references/rules.md', '# Altered\n');
    assert.throws(() => doctor(f.root), /changed catalog file: .*references\/rules.md/);
    assert.equal(fs.readFileSync(path.join(f.root, 'sauron-skills.lock.json'), 'utf8'), before);
});

test('doctor rejects missing and untracked files and tampered skill locks', (t) => {
    const f = fixture(t);
    lock(f.root);
    f.write('.agents/skills/example/extra.md', 'new');
    assert.throws(() => doctor(f.root), /untracked catalog file/);
    fs.unlinkSync(path.join(f.root, '.agents/skills/example/extra.md'));
    fs.unlinkSync(path.join(f.root, '.agents/skills/example/references/rules.md'));
    assert.throws(() => doctor(f.root), /missing catalog file/);
    f.write('.agents/skills/example/references/rules.md', '# Rules\n');
    const pinned = JSON.parse(fs.readFileSync(path.join(f.root, 'sauron-skills.lock.json'), 'utf8'));
    pinned.skills[f.skill].integrity = 'sha512:fake';
    f.write('sauron-skills.lock.json', pinned);
    assert.throws(() => doctor(f.root), /missing or changed skill lock/);
});

test('doctor fails exact package drift, malformed config and missing paths', (t) => {
    const f = fixture(t);
    lock(f.root);
    f.write('node_modules/sauron-ai/package.json', { version: '3.1.0' });
    assert.throws(() => doctor(f.root), /exact pin/);
    f.write('node_modules/sauron-ai/package.json', { version: '3.0.0' });
    f.write('.sauron/workflow.json', { ...f.config, routes: null });
    assert.throws(() => doctor(f.root), /malformed configuration/);
    f.write('.sauron/workflow.json', f.config);
    fs.unlinkSync(path.join(f.root, 'AGENTS.md'));
    assert.throws(() => doctor(f.root), /Required path missing/);
});

test('routing combines matches once and does not escalate unrelated documentation', (t) => {
    const f = fixture(t);
    const output = route(f.root, ['--files', 'frontend/src/new.tsx', 'backend/src/new.ts', 'frontend/src/new.tsx']);
    assert.match(output, /Routes: frontend, backend/);
    assert.match(output, /aragorn, boromir/);
    assert.equal(output.split(f.skill).length - 1, 1);
    assert.equal(output.split('npm run typecheck').length - 1, 1);
    assert.match(route(f.root, ['--files', 'notes.md']), /no full engineering loop required/);
    assert.match(route(f.root, ['--files']), /No applicable/);
});

test('route reads staged, unstaged and untracked Git files without shell interpolation', (t) => {
    const f = fixture(t);
    const git = (args) => {
        const result = spawnSync('git', ['-c', `core.hooksPath=${path.join(f.root, '.disabled-hooks')}`, ...args], { cwd: f.root, encoding: 'utf8', shell: false });
        assert.equal(result.status, 0, result.stderr);
    };
    git(['init', '-q']);
    f.write('frontend/src/initial.ts', 'initial');
    git(['add', '.']);
    git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'fixture']);
    f.write('frontend/src/initial.ts', 'changed');
    f.write('backend/src/untracked $(literal).ts', 'new');
    assert.match(route(f.root), /Routes: frontend, backend/);
    assert.match(route(f.root, ['--files', 'notes.md']), /No applicable/);
});

test('repository traversal and symlink paths fail closed', (t) => {
    const f = fixture(t);
    for (const relative of ['../outside', '..\\outside', '/absolute', 'C:\\outside', 'C:outside', '.', '\\\\server\\share']) {
        assert.throws(() => safePath(f.root, relative), /path|Path/);
    }
    assert.throws(() => route(f.root, ['--files', '../outside']), /escapes repository/);
    const link = path.join(f.root, '.agents/skills/link');
    // Directory junctions work without Windows developer-mode privileges.
    fs.symlinkSync(path.join(f.root, 'frontend'), link, process.platform === 'win32' ? 'junction' : 'dir');
    assert.throws(() => lock(f.root), /Symlink is not allowed/);
    assert.throws(() => digest(f.root, '.agents/skills/link/file'), /Symlink is not allowed/);
});

test('CLI propagates real failure status and reports actionable diagnostics', (t) => {
    const f = fixture(t);
    const errors = [];
    assert.equal(main(['doctor'], { root: f.root, output: () => {}, errorOutput: (message) => errors.push(message) }), 1);
    assert.match(errors[0], /sauron-skills.lock.json/);
    lock(f.root);
    assert.equal(main(['doctor'], { root: f.root, output: () => {}, errorOutput: () => {} }), 0);
    assert.equal(main(['unknown'], { root: f.root, output: () => {}, errorOutput: () => {} }), 1);
});

test('scoped AST graph detects cycles and unresolved imports without treating comments as imports', (t) => {
    let compiler;
    try { compiler = require.resolve('../backend/node_modules/typescript'); }
    catch { t.skip('Install backend dependencies to exercise the TypeScript graph'); return; }
    const f = fixture(t);
    f.write('backend/node_modules/typescript/index.js', `module.exports = require(${JSON.stringify(compiler)});`);
    f.write('backend/src/a.ts', "import { b } from './b';\n// import './comment-only';\nexport const a = b;\n");
    f.write('backend/src/b.ts', "export { a } from './a.js'; export const b = 1;\n");
    f.write('api/index.ts', "export { a } from '../backend/src/a';\n");
    f.write('frontend/src/main.tsx', "import './missing'; import './theme.css'; const screen = import('./widget');\n");
    f.write('frontend/src/widget.tsx', "import React from 'react'; export default <div />;\n");
    // These files are deliberately outside the declared source roots.
    f.write('.env', 'Do not scan');
    f.write('scripts/outside.ts', "import '../frontend/src/main';\n");
    assert.match(graph(f.root), /5 source files, 4 edges, 1 circular components/);
    const result = JSON.parse(fs.readFileSync(path.join(f.root, '.sauron/graph/graph.json'), 'utf8'));
    assert.deepEqual(result.cycles, [['backend/src/a.ts', 'backend/src/b.ts']]);
    assert.deepEqual(result.unresolved, [{ from: 'frontend/src/main.tsx', specifier: './missing' }]);
    assert.equal(result.implementation, 'repository fallback');
    assert.equal(result.files.includes('scripts/outside.ts'), false);
});

test('find forwards literal arguments to the installed find-skill command and preserves exit status', (t) => {
    const f = fixture(t);
    f.write('node_modules/sauron-ai/package.json', { version: '3.0.0', bin: { sauron: './bin/cli.cjs' } });
    f.write('node_modules/sauron-ai/bin/cli.cjs', "require('node:fs').writeFileSync('find-args.json', JSON.stringify(process.argv.slice(2))); process.exitCode = 7;\n");
    assert.equal(main(['find', 'query $(literal)', '--department', 'frontend'], { root: f.root }), 7);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(f.root, 'find-args.json'), 'utf8')),
        ['find-skill', 'query $(literal)', '--department', 'frontend']);
});
