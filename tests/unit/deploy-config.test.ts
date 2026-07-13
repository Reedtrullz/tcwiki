import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');
const operationsWorkflow = readFileSync('.github/workflows/operations.yml', 'utf8');
const packageJson = readFileSync('package.json', 'utf8');
const playbook = readFileSync('ansible-playbook.yml', 'utf8');
const readme = readFileSync('README.md', 'utf8');
const contributing = readFileSync('CONTRIBUTING.md', 'utf8');
const maintenance = readFileSync('docs/maintenance.md', 'utf8');
const operations = readFileSync('docs/operations.md', 'utf8');
const playwrightConfig = readFileSync('playwright.config.ts', 'utf8');
const standaloneSmoke = readFileSync('scripts/smoke-standalone.mjs', 'utf8');
const dockerSmoke = readFileSync('scripts/smoke-docker-runtime.mjs', 'utf8');
const runtimeProbe = readFileSync('scripts/check-runtime-url.mjs', 'utf8');
const releaseTrackedCheck = readFileSync('scripts/check-release-tracked.mjs', 'utf8');
const releaseTrackedLib = readFileSync('scripts/lib/release-tracked.mjs', 'utf8');
const visualSafetySpec = readFileSync('tests/visual-safety.spec.ts', 'utf8');
const linkIntegritySpec = readFileSync('tests/link-integrity.spec.ts', 'utf8');
const runtimeSpec = readFileSync('tests/runtime.spec.ts', 'utf8');
const nodeVersionGuard = readFileSync('scripts/lib/node-version.mjs', 'utf8');
const nodeGuardEntrypoint = readFileSync('scripts/require-node22.mjs', 'utf8');
const platformArtifactCleaner = readFileSync('scripts/clean-platform-artifacts.mjs', 'utf8');
const standaloneAssetPreparer = readFileSync('scripts/prepare-standalone-assets.mjs', 'utf8');
const rootLayout = readFileSync('src/app/layout.tsx', 'utf8');
const globalStyles = readFileSync('src/app/globals.css', 'utf8');
const hostReadinessMonitor = readFileSync('scripts/check-production-readiness-host.sh', 'utf8');
const hostReadinessServicePath = 'deploy/systemd/tcwiki-readiness-monitor.service';
const hostReadinessTimerPath = 'deploy/systemd/tcwiki-readiness-monitor.timer';
const hostReadinessService = existsSync(hostReadinessServicePath) ? readFileSync(hostReadinessServicePath, 'utf8') : '';
const hostReadinessTimer = existsSync(hostReadinessTimerPath) ? readFileSync(hostReadinessTimerPath, 'utf8') : '';

interface PackageManifest {
  scripts: Record<string, string>;
}

function parsePackageManifest(raw: string): PackageManifest {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || !('scripts' in parsed)) {
    throw new Error('package.json is missing scripts');
  }

  const scripts = (parsed as { scripts: unknown }).scripts;
  if (!scripts || typeof scripts !== 'object') {
    throw new Error('package.json scripts is not an object');
  }

  return { scripts: scripts as Record<string, string> };
}

const packageManifest = parsePackageManifest(packageJson);

function scriptValue(name: string) {
  const value = packageManifest.scripts[name];
  if (typeof value !== 'string') {
    throw new Error(`Missing package script: ${name}`);
  }

  return value;
}

function specPathsFromScript(name: string) {
  return scriptValue(name)
    .split(/\s+/)
    .map((token) => token.replace(/^['"]|['"]$/g, ''))
    .filter((token) => /^tests\/.*\.spec\.ts$/.test(token));
}

describe('release and browser test wiring', () => {
  it('fails app and release-proof scripts fast when Node 22 is not active', () => {
    const guardedScripts = [
      'dev',
      'build',
      'start',
      'start:next',
      'start:standalone',
      'lint',
      'typecheck',
      'pretest:unit',
      'test:unit',
      'test:unit:watch',
      'test:e2e',
      'test:e2e:docker-smoke',
      'test:e2e:visual',
      'test:e2e:links',
      'test:e2e:csp',
      'check:release-tracked',
      'generate:search',
      'check:content',
      'check:live-snapshot',
      'check:production-readiness',
      'report:content-reviews',
      'smoke:standalone',
      'smoke:docker',
      'audit:prod',
      'audit:all',
      'check:runtime-url',
    ];

    for (const scriptName of guardedScripts) {
      expect(scriptValue(scriptName), `${scriptName} should start with the Node 22 guard`).toMatch(/^node scripts\/require-node22\.mjs && /);
    }

    for (const script of [
      runtimeProbe,
      dockerSmoke,
      standaloneSmoke,
      platformArtifactCleaner,
      standaloneAssetPreparer,
      releaseTrackedCheck,
      readFileSync('scripts/check-curated-data.mjs', 'utf8'),
      readFileSync('scripts/check-live-chain-snapshot.mjs', 'utf8'),
      readFileSync('scripts/check-production-readiness.mjs', 'utf8'),
      readFileSync('scripts/report-content-reviews.mjs', 'utf8'),
      readFileSync('scripts/generate-mdx-search.mjs', 'utf8'),
      readFileSync('scripts/start-playwright-server.mjs', 'utf8'),
      readFileSync('scripts/start-standalone.mjs', 'utf8'),
    ]) {
      expect(script).toContain("import './require-node22.mjs';");
    }

    expect(nodeVersionGuard).toContain('REQUIRED_NODE_MAJOR = 22');
    expect(nodeVersionGuard).toContain('Run `nvm use`');
    expect(nodeGuardEntrypoint).toContain('assertSupportedNodeVersion');
    expect(readme).toContain('scripts/require-node22.mjs');
    expect(contributing).toContain('THORChain Wiki requires Node.js 22.x');
    expect(maintenance).toContain('scripts/require-node22.mjs');
    expect(operations).toContain('scripts/require-node22.mjs');
  });

  it('samples persistent production readiness separately from weekly content review reporting', () => {
    expect(operationsWorkflow).toContain("cron: '23 * * * *'");
    expect(operationsWorkflow).toContain("cron: '53 * * * *'");
    expect(operationsWorkflow).toContain("cron: '41 6 * * 1'");
    expect(operationsWorkflow).toContain("github.event.schedule == '23 * * * *' || github.event.schedule == '53 * * * *'");
    expect(operationsWorkflow).toContain('npm run check:production-readiness');
    expect(operationsWorkflow).toContain('--samples 3');
    expect(operationsWorkflow).toContain('--interval-ms 60000');
    expect(operationsWorkflow).toContain('Open persistent readiness alert');
    expect(operationsWorkflow).toContain('Close recovered readiness alert');
    expect(operationsWorkflow).toContain('npm run report:content-reviews');
    expect(operationsWorkflow).toContain('--horizon-days 30');
    expect(releaseTrackedLib).toContain("'.github/workflows/operations.yml'");
  });

  it('installs a credential-free hardened readiness timer before container mutation', () => {
    const dependencyIndex = playbook.indexOf('name: Verify readiness monitor host dependencies');
    const installIndex = playbook.indexOf('name: Install tcwiki readiness monitor executable');
    const enableIndex = playbook.indexOf('name: Enable tcwiki readiness monitor timer');
    const pullIndex = playbook.indexOf('name: Pull immutable image from GHCR');
    const assets = [hostReadinessMonitor, hostReadinessService, hostReadinessTimer].join('\n');

    expect(dependencyIndex).toBeGreaterThan(-1);
    expect(installIndex).toBeGreaterThan(dependencyIndex);
    expect(enableIndex).toBeGreaterThan(installIndex);
    expect(enableIndex).toBeLessThan(pullIndex);
    expect(playbook.match(/become: true/g)?.length).toBeGreaterThanOrEqual(7);
    for (const text of [
      'name: tcwiki-readiness',
      'system: true',
      'shell: /usr/sbin/nologin',
      'groups: ""',
      'append: false',
      'dest: /usr/local/libexec/tcwiki-readiness-monitor',
      'owner: root',
      'mode: "0755"',
    ]) {
      expect(playbook).toContain(text);
    }
    for (const text of [
      'User=tcwiki-readiness',
      'Group=tcwiki-readiness',
      'NoNewPrivileges=true',
      'PrivateTmp=true',
      'ProtectHome=true',
      'ProtectSystem=strict',
      'StateDirectory=tcwiki-readiness-monitor',
      'RuntimeDirectory=tcwiki-readiness-monitor',
      'CapabilityBoundingSet=',
      'LockPersonality=true',
      'MemoryDenyWriteExecute=true',
      'ProtectControlGroups=true',
      'ProtectKernelModules=true',
      'ProtectKernelTunables=true',
      'RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6',
      'RestrictSUIDSGID=true',
      'InaccessiblePaths=-/run/docker.sock',
      'TimeoutStartSec=4min',
    ]) {
      expect(hostReadinessService).toContain(text);
    }
    expect(hostReadinessTimer).toContain('OnCalendar=*-*-* *:08,38:00');
    expect(hostReadinessTimer).toContain('RandomizedDelaySec=2min');
    expect(hostReadinessTimer).toContain('Persistent=true');
    expect(assets).not.toMatch(/GITHUB_TOKEN|github_pat_|SupplementaryGroups=docker/);
  });

  it('documents host readiness evidence, manual checks, and removal', () => {
    expect(operations).toContain('tcwiki-readiness-monitor.timer');
    expect(operations).toContain('/var/lib/tcwiki-readiness-monitor/latest.json');
    expect(operations).toContain('journalctl -u tcwiki-readiness-monitor.service');
    expect(operations).toContain('at least one valid sample is ready');
    expect(operations).toContain('does not open or close GitHub issues');
    expect(maintenance).toContain('systemctl start tcwiki-readiness-monitor.service');
    expect(maintenance).toContain('systemctl disable --now tcwiki-readiness-monitor.timer');
    expect(maintenance).toContain('systemctl stop tcwiki-readiness-monitor.service');
    expect(maintenance).toContain('systemctl is-active tcwiki-readiness-monitor.service');
    expect(maintenance).toContain('rm -f /etc/systemd/system/tcwiki-readiness-monitor.service');
    expect(maintenance).toContain('rm -f /usr/local/libexec/tcwiki-readiness-monitor');
    expect(maintenance).toContain('systemctl daemon-reload');
  });

  it('defaults the Ansible production containers to enforced CSP with an explicit override', () => {
    expect(playbook).toContain("csp_enforce: \"{{ lookup('env', 'CSP_ENFORCE') | default('1', true) }}\"");
    expect(playbook).toContain("csp_enforce in ['0', '1']");
    expect(playbook).toContain('CSP_ENFORCE: "{{ csp_enforce }}"');
    expect(playbook).toContain('CSP_ENFORCE: "{{ previous_csp_enforce }}"');
    expect(playbook).toContain('Verify candidate CSP header');
    expect(playbook).toContain('Verify deployed CSP header');
    expect(playbook).toContain('candidate_csp_check.content_security_policy');
    expect(playbook).toContain('deployed_csp_check.content_security_policy');
    expect(playbook).toContain('content_security_policy_report_only');
    expect(playbook).toContain("('CSP_ENFORCE=' ~ csp_enforce) in container_info.container.Config.Env");
  });

  it('asserts enforced CSP in Docker, public runtime, and scheduled runtime probes', () => {
    expect(dockerSmoke).toContain("'CSP_ENFORCE=1'");
    expect(dockerSmoke).toContain("CSP_ENFORCE: '1'");
    expect(dockerSmoke).toContain("npm', ['run', 'check:runtime-url']");
    expect(dockerSmoke).toContain("npm', ['run', 'test:e2e:docker-smoke']");
    expect(runtimeSpec).toContain('readiness API endpoint responds with readiness metadata @docker-smoke');
    expect(workflow).toMatch(/CHECK_BASE_URL: https:\/\/wiki\.thorchain\.no[\s\S]*?CSP_ENFORCE: '1'/);
    expect(workflow).toMatch(/Run Ansible deploy[\s\S]*?CSP_ENFORCE: '1'/);
    expect(workflow).toMatch(/Verify public production readback[\s\S]*?CSP_ENFORCE: '1'/);
  });

  it('probes CSP report ingestion in standalone and runtime readbacks', () => {
    for (const script of [standaloneSmoke, runtimeProbe]) {
      expect(script).toContain("'/api/csp-report'");
      expect(script).toContain("'content-type': 'application/csp-report'");
      expect(script).toContain("body: '{}'");
      expect(script).toContain("expectHeader(response.headers, 'cache-control', 'no-store')");
    }
  });

  it('keeps visual browser safety separate from page-owned smoke specs', () => {
    const docs = [readme, contributing, maintenance].join('\n');

    expect(existsSync('tests/visual-safety.spec.ts')).toBe(true);
    expect(existsSync('tests/smoke.spec.ts')).toBe(false);
    expect(packageJson).toContain('playwright test tests/visual-safety.spec.ts tests/deep-dives.spec.ts -g \\"visually safe\\"');
    expect(packageJson).not.toContain('tests/smoke.spec.ts');
    expect(visualSafetySpec).toContain('THORChain Wiki Visual Safety Smoke Tests');
    expect(visualSafetySpec).toContain('top-level routes stay visually safe');
    expect(docs).toContain('tests/visual-safety.spec.ts');
    expect(docs).toContain('Page-specific browser journeys');
    expect(docs).not.toContain('tests/smoke.spec.ts');
  });

  it('keeps rendered link integrity available as a focused browser lane', () => {
    const docs = [readme, contributing, maintenance].join('\n');

    expect(existsSync('tests/link-integrity.spec.ts')).toBe(true);
    expect(scriptValue('test:e2e:links')).toBe('node scripts/require-node22.mjs && playwright test tests/link-integrity.spec.ts --project=chromium');
    expect(linkIntegritySpec).toContain('THORChain Wiki rendered link integrity');
    expect(linkIntegritySpec).toContain('publicSitemapRoutes');
    expect(linkIntegritySpec).toContain('RENDERED_CONSOLE_PROBLEM_PATTERN');
    expect(linkIntegritySpec).toContain('resolves to missing anchor');
    expect(docs).toContain('npm run test:e2e:links');
    expect(docs).toContain('tests/link-integrity.spec.ts');
    expect(docs).toContain('hydration/framework console');
  });

  it('keeps Docker browser smoke focused on runtime and loaded dashboard surfaces', () => {
    const dockerSmoke = scriptValue('test:e2e:docker-smoke');
    const docs = [readme, contributing].join('\n');

    expect(dockerSmoke).toContain('tests/runtime.spec.ts');
    expect(dockerSmoke).toContain('tests/home.spec.ts');
    expect(dockerSmoke).toContain('tests/network.spec.ts');
    expect(dockerSmoke).toContain('tests/dynamic-fees.spec.ts');
    expect(dockerSmoke).toContain('tests/economics.spec.ts');
    expect(dockerSmoke).toContain('tests/stats.spec.ts');
    expect(dockerSmoke).toContain('-g "@docker-smoke"');
    expect(docs).toContain('one mocked loaded-state smoke each for Network, Dynamic Fees, Economics RUNEPool/POL, and Stats');
    expect(docs).not.toContain('one browser-rendered home-page smoke, not the full Playwright suite');
    expect(docs).not.toContain('one home-page render; it is intentionally small');
  });

  it('documents RUNEPool/POL as part of the readiness source contract', () => {
    const docs = [readme, contributing, maintenance, operations].join('\n');

    expect(docs).toContain('RUNEPool/POL source posture');
    expect(docs).toContain('RUNEPool/POL status');
    expect(docs).toContain('sources.thornode.runePoolPol');
  });

  it('checks the strict readiness contract before and after production cutover', () => {
    const candidateContractIndex = playbook.indexOf('name: Verify candidate readiness contract');
    const candidateStrictUrlIndex = playbook.indexOf('http://localhost:3004/api/ready?contract=strict');
    const stopLiveIndex = playbook.indexOf('name: Stop and remove existing container');
    const deployedContractIndex = playbook.indexOf('name: Verify deployed readiness contract');
    const deployedStrictUrlIndex = playbook.indexOf('http://localhost:3003/api/ready?contract=strict');
    const deployedReportIndex = playbook.indexOf('name: Report degraded readiness without rolling back');
    const docs = [readme, contributing, maintenance, operations].join('\n');

    expect(candidateContractIndex).toBeGreaterThan(-1);
    expect(candidateStrictUrlIndex).toBeGreaterThan(candidateContractIndex);
    expect(candidateStrictUrlIndex).toBeLessThan(stopLiveIndex);
    expect(deployedContractIndex).toBeGreaterThan(stopLiveIndex);
    expect(deployedStrictUrlIndex).toBeGreaterThan(deployedContractIndex);
    expect(deployedStrictUrlIndex).toBeLessThan(deployedReportIndex);
    expect(playbook).toContain('candidate_ready_check.json.sources.thornode is defined');
    expect(playbook).toContain('ready_check.json.sources.thornode is defined');
    expect(playbook).not.toContain('name: Verify candidate readiness shape');
    expect(docs).toContain('strict readiness contract');
    expect(docs).toContain('/api/ready?contract=strict');
  });

  it('makes degraded-readiness deploy policy explicit and rollback-capable', () => {
    const docs = [readme, contributing, maintenance, operations].join('\n');

    expect(playbook).toContain("require_ready: \"{{ lookup('env', 'REQUIRE_READY') | default('0', true) }}\"");
    expect(playbook).toContain("require_ready in ['0', '1']");
    expect(playbook).toContain('Block degraded candidate readiness when required');
    expect(playbook).toContain('Block degraded readiness after deploy when required');
    expect(playbook).toContain("when: require_ready == '1'");
    expect(workflow).toMatch(/CSP_ENFORCE: '1'[\s\S]*REQUIRE_READY: '0'/);
    expect(docs).toContain('REQUIRE_READY=1');
    expect(docs).toContain('accepts degraded source confidence by default');
  });

  it('provides a local Docker candidate smoke that mirrors PR runtime proof', () => {
    const docs = [readme, contributing, maintenance].join('\n');

    expect(scriptValue('smoke:docker')).toBe('node scripts/require-node22.mjs && node scripts/smoke-docker-runtime.mjs');
    expect(dockerSmoke).toContain("'build'");
    expect(dockerSmoke).toContain('DOCKER_SMOKE_SKIP_BUILD');
    expect(dockerSmoke).toContain('shouldSkipBuild');
    expect(dockerSmoke).toContain("runCommand('docker', ['image', 'inspect', '--format', '{{.Id}}', imageTag], { captureStdout: true })");
    expect(dockerSmoke).toContain("'docker', [\n    'run'");
    expect(dockerSmoke).toContain("'RUNTIME_METADATA_REQUIRED=1'");
    expect(dockerSmoke).toContain("'CSP_ENFORCE=1'");
    expect(dockerSmoke).toContain("EXPECTED_IMAGE_REF: imageRef");
    expect(dockerSmoke).toContain("REQUIRE_RUNTIME_METADATA: '1'");
    expect(dockerSmoke).toContain("npm', ['run', 'check:runtime-url']");
    expect(dockerSmoke).toContain("npm', ['run', 'test:e2e:docker-smoke']");
    expect(dockerSmoke).toContain('SKIP_DOCKER_BROWSER_SMOKE');
    expect(docs).toContain('npm run smoke:docker');
    expect(docs).toContain('strict runtime metadata');
    expect(docs).toContain('enforced CSP');
  });

  it('runs PR Docker runtime proof through the shared Docker smoke helper', () => {
    const buildIndex = workflow.indexOf('name: Build Docker image for PR runtime check');
    const scanIndex = workflow.indexOf('name: Scan PR Docker image for runtime OS vulnerabilities');
    const smokeIndex = workflow.indexOf('name: Run Docker image for PR runtime check');

    expect(buildIndex).toBeGreaterThan(-1);
    expect(scanIndex).toBeGreaterThan(buildIndex);
    expect(smokeIndex).toBeGreaterThan(scanIndex);
    expect(workflow).toContain("DOCKER_SMOKE_SKIP_BUILD: '1'");
    expect(workflow).toContain('DOCKER_SMOKE_TAG: tcwiki-pr:${{ github.sha }}');
    expect(workflow).toContain('DOCKER_SMOKE_COMMIT_SHA: ${{ github.sha }}');
    expect(workflow).toContain('DOCKER_SMOKE_IMAGE_REF: ghcr.io/${{ github.repository }}@sha256:1111111111111111111111111111111111111111111111111111111111111111');
    expect(workflow).toContain("DOCKER_SMOKE_PORT: '3011'");
    expect(workflow).toContain('run: npm run smoke:docker');
    expect(workflow).not.toContain('container_id="$(docker run --rm -d');
  });

  it('smokes the published digest image before production deploy', () => {
    const publishIndex = workflow.indexOf('publish:');
    const smokeIndex = workflow.indexOf('release-image-smoke:');
    const deployIndex = workflow.indexOf('deploy:');

    expect(publishIndex).toBeGreaterThan(-1);
    expect(smokeIndex).toBeGreaterThan(publishIndex);
    expect(deployIndex).toBeGreaterThan(smokeIndex);
    expect(workflow).toContain('name: Smoke published image');
    expect(workflow).toContain('needs: [publish]');
    expect(workflow).toContain('packages: read');
    expect(workflow).toContain("DOCKER_SMOKE_SKIP_BUILD: '1'");
    expect(workflow).toContain("DOCKER_SMOKE_PULL: '1'");
    expect(workflow).toContain('DOCKER_SMOKE_TAG: ${{ needs.publish.outputs.image_ref }}');
    expect(workflow).toContain('DOCKER_SMOKE_IMAGE_REF: ${{ needs.publish.outputs.image_ref }}');
    expect(workflow).toContain('DOCKER_SMOKE_COMMIT_SHA: ${{ needs.publish.outputs.app_version }}');
    expect(workflow).toMatch(/release-image-smoke:[\s\S]*?run: npm run smoke:docker/);
    expect(workflow).toContain('needs: [publish, release-image-smoke]');
    expect(dockerSmoke).toContain("if (shouldSkipBuild && shouldPull)");
    expect(dockerSmoke).toContain("runCommand('docker', ['pull', imageTag])");
  });

  it('keeps a release trackedness audit available before ship decisions', () => {
    const docs = [readme, contributing, maintenance, operations].join('\n');
    const installIndex = workflow.indexOf('run: npm ci --include=optional');
    const trackednessIndex = workflow.indexOf('run: npm run check:release-tracked');
    const auditIndex = workflow.indexOf('run: npm run audit:prod');

    expect(scriptValue('check:release-tracked')).toBe('node scripts/require-node22.mjs && node scripts/check-release-tracked.mjs');
    expect(releaseTrackedCheck).toContain('auditReleaseTrackedFiles');
    expect(releaseTrackedLib).toContain('git');
    expect(releaseTrackedLib).toContain('ls-files');
    expect(releaseTrackedLib).toContain('Package scripts, CI, release docs, and their local proof dependencies should not point at local-only proof files.');
    expect(trackednessIndex).toBeGreaterThan(installIndex);
    expect(trackednessIndex).toBeLessThan(auditIndex);
    expect(docs).toContain('npm run check:release-tracked');
    expect(docs).toContain('local-only proof files');
    expect(docs).toContain('CI runs the same trackedness audit');
  });

  it('cleans local platform metadata before unit tests without scanning generated folders', () => {
    expect(scriptValue('pretest:unit')).toBe('node scripts/require-node22.mjs && node scripts/clean-platform-artifacts.mjs');
    expect(platformArtifactCleaner).toContain("const cleanupRoots = ['content', 'docs', 'scripts', 'src', 'tests']");
    expect(platformArtifactCleaner).toContain("name === '.DS_Store'");
    expect(platformArtifactCleaner).toContain('finderDuplicateFilePattern');
    expect(platformArtifactCleaner).toContain('isPlatformArtifactFile');
    expect(platformArtifactCleaner).toContain("'node_modules'");
    expect(platformArtifactCleaner).toContain("'.git'");
    expect(platformArtifactCleaner).toContain("'.next'");
  });

  it('does not require remote Google font fetches during production builds', () => {
    expect(rootLayout).not.toContain('next/font/google');
    expect(rootLayout).not.toContain('Inter(');
    expect(rootLayout).not.toContain('JetBrains_Mono(');
    expect(globalStyles).toContain('--font-sans:');
    expect(globalStyles).toContain('--font-mono:');
  });

  it('prepares standalone static assets without shared recursive overwrite races', () => {
    expect(standaloneAssetPreparer).not.toContain('cpSync(');
    expect(standaloneAssetPreparer).toContain('copyFileSync(');
    expect(standaloneAssetPreparer).toContain('renameSync(');
    expect(standaloneAssetPreparer).toContain('process.pid');
  });

  it('fails local standalone Playwright runs when the browser target is stale', () => {
    expect(existsSync('scripts/start-playwright-server.mjs')).toBe(true);
    expect(existsSync('scripts/lib/standalone-freshness.mjs')).toBe(true);
    expect(playwrightConfig).toContain("command: process.env.PLAYWRIGHT_WEB_SERVER_COMMAND || 'node scripts/start-playwright-server.mjs'");
    expect(readme).toContain('fails closed when source files are newer than `.next/standalone/server.js`');
    expect(contributing).toContain("PLAYWRIGHT_WEB_SERVER_COMMAND='npm run dev'");
  });

  it('points scripted browser lanes at checked-in spec files', () => {
    const scriptedLanes = ['test:e2e:docker-smoke', 'test:e2e:visual', 'test:e2e:links', 'test:e2e:csp'];

    for (const lane of scriptedLanes) {
      const specPaths = specPathsFromScript(lane);
      expect(specPaths.length, `${lane} should name explicit spec files`).toBeGreaterThan(0);
      expect(specPaths, `${lane} should not reference the deleted broad smoke spec`).not.toContain('tests/smoke.spec.ts');

      for (const specPath of specPaths) {
        expect(existsSync(specPath), `${lane} references missing ${specPath}`).toBe(true);
      }
    }

    expect(existsSync('tests/.DS_Store')).toBe(false);
  });

  it('documents enforced production CSP without stale report-only rollout language', () => {
    const docs = [readme, contributing, maintenance, operations].join('\n');

    expect(docs).toContain('Content-Security-Policy');
    expect(docs).toContain('CSP_ENFORCE=0');
    expect(contributing).toContain('CSP_ENFORCE=1 npm run smoke:standalone');
    expect(contributing).toContain('npm run test:e2e:csp');
    expect(maintenance).toContain('npm run test:e2e:csp');
    expect(contributing).toContain('CSP_ENFORCE=1 npm run check:runtime-url');
    expect(contributing).toContain('npm run smoke:docker');
    expect(docs).not.toContain('Production currently emits nonce-based `Content-Security-Policy-Report-Only`');
    expect(docs).not.toContain('Keep production in report-only mode until');
    expect(docs).not.toContain('before considering production enforcement');
  });
});
