import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');
const playbook = readFileSync('ansible-playbook.yml', 'utf8');
const readme = readFileSync('README.md', 'utf8');
const contributing = readFileSync('CONTRIBUTING.md', 'utf8');
const maintenance = readFileSync('docs/maintenance.md', 'utf8');
const operations = readFileSync('docs/operations.md', 'utf8');
const standaloneSmoke = readFileSync('scripts/smoke-standalone.mjs', 'utf8');
const runtimeProbe = readFileSync('scripts/check-runtime-url.mjs', 'utf8');

describe('release CSP enforcement wiring', () => {
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
    expect(workflow).toContain('-e CSP_ENFORCE=1');
    expect(workflow).toContain('CSP_ENFORCE=1 \\\n            npm run check:runtime-url');
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

  it('documents enforced production CSP without stale report-only rollout language', () => {
    const docs = [readme, contributing, maintenance, operations].join('\n');

    expect(docs).toContain('Content-Security-Policy');
    expect(docs).toContain('CSP_ENFORCE=0');
    expect(contributing).toContain('CSP_ENFORCE=1 npm run smoke:standalone');
    expect(contributing).toContain('npm run test:e2e:csp');
    expect(contributing).toContain('CSP_ENFORCE=1 npm run check:runtime-url');
    expect(docs).not.toContain('Production currently emits nonce-based `Content-Security-Policy-Report-Only`');
    expect(docs).not.toContain('Keep production in report-only mode until');
    expect(docs).not.toContain('before considering production enforcement');
  });
});
