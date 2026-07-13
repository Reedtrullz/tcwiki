#!/usr/bin/env node
import './require-node22.mjs';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';

const localDigest = '1'.repeat(64);
const repositoryImage = process.env.DOCKER_SMOKE_IMAGE_REPOSITORY ?? 'ghcr.io/reedtrullz/tcwiki';
const commitSha = process.env.DOCKER_SMOKE_COMMIT_SHA ?? await getGitCommitSha();
const shortCommit = commitSha.slice(0, 12);
const imageRef = process.env.DOCKER_SMOKE_IMAGE_REF ?? `${repositoryImage}@sha256:${localDigest}`;
const imageTag = process.env.DOCKER_SMOKE_TAG ?? `tcwiki-local-smoke:${shortCommit}`;
const port = process.env.DOCKER_SMOKE_PORT ?? await getFreePort();
const baseUrl = `http://127.0.0.1:${port}`;
const shouldPull = process.env.DOCKER_SMOKE_PULL === '1';
const shouldSkipBuild = process.env.DOCKER_SMOKE_SKIP_BUILD === '1';
const shouldKeepImage = process.env.DOCKER_SMOKE_KEEP_IMAGE === '1';
const shouldSkipBrowser = process.env.SKIP_DOCKER_BROWSER_SMOKE === '1';

let containerId = '';
let imageBuilt = false;
let cleanupStarted = false;

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    cleanup()
      .catch((error) => {
        console.error(error instanceof Error ? error.message : error);
      })
      .finally(() => {
        process.exit(signal === 'SIGINT' ? 130 : 143);
      });
  });
}

async function getFreePort() {
  return await new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('Could not allocate a Docker smoke-test port.')));
        return;
      }
      const allocatedPort = String(address.port);
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(allocatedPort);
      });
    });
  });
}

async function runCommand(command, args, options = {}) {
  const captureStdout = options.captureStdout === true;

  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? process.cwd(),
      env: {
        ...process.env,
        ...options.env,
      },
      stdio: captureStdout ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    });

    let stdout = '';
    if (captureStdout) {
      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });
    }

    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve({ stdout });
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} failed with ${signal ? `signal ${signal}` : `exit code ${code ?? 'unknown'}`}.`));
    });
  });
}

async function getGitCommitSha() {
  const { stdout } = await runCommand('git', ['rev-parse', 'HEAD'], { captureStdout: true });
  const sha = stdout.trim();
  if (!/^[0-9a-f]{40}$/i.test(sha)) {
    throw new Error(`Expected a full git SHA from git rev-parse HEAD; got ${sha || 'empty output'}.`);
  }
  return sha;
}

async function cleanup() {
  if (cleanupStarted) {
    return;
  }
  cleanupStarted = true;

  if (containerId) {
    try {
      await runCommand('docker', ['rm', '-f', containerId]);
    } catch (error) {
      console.warn(error instanceof Error ? error.message : error);
    }
    containerId = '';
  }

  if (imageBuilt && !shouldKeepImage) {
    try {
      await runCommand('docker', ['image', 'rm', imageTag]);
    } catch (error) {
      console.warn(error instanceof Error ? error.message : error);
    }
  }
}

try {
  await runCommand('docker', ['version']);

  if (shouldSkipBuild) {
    console.log(`Using prebuilt Docker smoke image ${imageTag} (${commitSha}).`);
    if (shouldSkipBuild && shouldPull) {
      await runCommand('docker', ['pull', imageTag]);
    }
    await runCommand('docker', ['image', 'inspect', '--format', '{{.Id}}', imageTag], { captureStdout: true });
  } else {
    console.log(`Building Docker smoke image ${imageTag} (${commitSha}).`);
    await runCommand('docker', [
      'build',
      ...(shouldPull ? ['--pull'] : []),
      '--build-arg',
      `VERSION=${commitSha}`,
      '--build-arg',
      `COMMIT_SHA=${commitSha}`,
      '--build-arg',
      `IMAGE_REF=${imageRef}`,
      '--tag',
      imageTag,
      '.',
    ]);
    imageBuilt = true;
  }

  console.log(`Starting Docker smoke container on ${baseUrl}.`);
  const runResult = await runCommand('docker', [
    'run',
    '--rm',
    '-d',
    '-p',
    `127.0.0.1:${port}:3000`,
    '-e',
    `APP_VERSION=${commitSha}`,
    '-e',
    `VERSION=${commitSha}`,
    '-e',
    `COMMIT_SHA=${commitSha}`,
    '-e',
    `IMAGE_REF=${imageRef}`,
    '-e',
    'RUNTIME_METADATA_REQUIRED=1',
    '-e',
    'CSP_ENFORCE=1',
    imageTag,
  ], { captureStdout: true });
  containerId = runResult.stdout.trim();
  if (!/^[a-f0-9]{12,64}$/i.test(containerId)) {
    throw new Error(`Docker run did not return a container id; got ${containerId || 'empty output'}.`);
  }

  await runCommand('npm', ['run', 'check:runtime-url'], {
    env: {
      CHECK_BASE_URL: baseUrl,
      EXPECTED_VERSION: commitSha,
      EXPECTED_COMMIT_SHA: commitSha,
      EXPECTED_IMAGE_REF: imageRef,
      REQUIRE_RUNTIME_METADATA: '1',
      CSP_ENFORCE: '1',
    },
  });

  if (!shouldSkipBrowser) {
    await runCommand('npm', ['run', 'test:e2e:docker-smoke'], {
      env: {
        PLAYWRIGHT_BASE_URL: baseUrl,
        CSP_ENFORCE: '1',
        CI: 'true',
      },
    });
  }

  console.log(`Docker runtime smoke passed for ${imageTag}.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await cleanup();
}
