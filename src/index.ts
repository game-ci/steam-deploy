// Thin wrapper: this action installs and shells out to the game-ci CLI
// (game-ci/cli's `deploy steam` command) as a subprocess, so the exact
// same code path this runs in CI also runs when a developer invokes the
// CLI directly on their own machine. See game-ci/roadmap#11.
//
// Steam credentials (username/password/totp/configVdf) are read by the
// CLI itself from its own process environment (STEAM_USERNAME,
// STEAM_PASSWORD, STEAM_TOTP, STEAM_CONFIG_VDF_BASE64) - see
// game-ci/cli's steam-deploy-command.ts. They are intentionally not
// passed as CLI arguments, since argv can leak through process listings
// and command-logging.
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { downloadCli } from './download-cli';
import { buildCliArgs, type SteamDeployInputs } from './build-cli-args';

const MAX_DEPOTS = 9;

async function run() {
  try {
    const cliVersion = core.getInput('cliVersion') || 'latest';

    const username = core.getInput('username', { required: true });
    // Required unless totp or configVdf is set - the CLI itself validates
    // this combination and throws a clear error if none apply.
    const password = core.getInput('password');
    const totp = core.getInput('totp');
    // The old action's configVdf input is documented (see README's setup
    // steps) as the ALREADY base64-encoded config.vdf contents - real
    // users' GitHub secrets are already base64, produced by `base64
    // config.vdf` / certutil -encode. Passed straight through as
    // STEAM_CONFIG_VDF_BASE64 - re-encoding it here would double-encode
    // an already-base64 value, which the CLI can't decode back to a
    // valid config.vdf.
    const configVdf = core.getInput('configVdf');

    const depotPaths: Record<number, string | undefined> = {};
    const depotInstallScriptPaths: Record<number, string | undefined> = {};
    for (let index = 1; index <= MAX_DEPOTS; index++) {
      depotPaths[index] = core.getInput(`depot${index}Path`) || undefined;
      depotInstallScriptPaths[index] = core.getInput(`depot${index}InstallScriptPath`) || undefined;
    }

    const inputs: SteamDeployInputs = {
      appId: core.getInput('appId', { required: true }),
      firstDepotIdOverride: core.getInput('firstDepotIdOverride') || undefined,
      buildDescription: core.getInput('buildDescription') || undefined,
      rootPath: core.getInput('rootPath') || '.',
      releaseBranch: core.getInput('releaseBranch') || undefined,
      debugBranch: core.getInput('debugBranch') || undefined,
      extraExclusions: core.getInput('extraExclusions') || undefined,
      depotPaths,
      depotInstallScriptPaths,
    };

    const cliPath = await downloadCli(cliVersion);
    const args = buildCliArgs(inputs);

    // CodeQL flags this as js/command-line-injection since some argv
    // entries derive from action inputs. Verified false positive: args is
    // an array of discrete argv entries, and @actions/exec's
    // toolrunner.js passes it straight to child_process.spawn(fileName,
    // args, options) - never a shell string, never shell-parsed. This
    // comment does not suppress the alert (no inline-suppression
    // mechanism exists in GitHub Code Scanning's default setup); dismiss
    // via the Security tab/API instead.
    let stdout = '';
    await exec.exec(cliPath, args, {
      env: {
        ...process.env,
        STEAM_USERNAME: username,
        ...(password ? { STEAM_PASSWORD: password } : {}),
        ...(totp ? { STEAM_TOTP: totp } : {}),
        ...(configVdf ? { STEAM_CONFIG_VDF_BASE64: configVdf } : {}),
      },
      listeners: {
        stdout: (data: Buffer) => {
          stdout += data.toString();
        },
      },
    });

    // The CLI prints "Steam deployment succeeded. BuildID: <id>" on
    // success (steam-deploy-command.ts) - the only place a new BuildID is
    // ever surfaced, so it has to be scraped from stdout rather than
    // returned structurally. Matches the old action's own `buildId`
    // output.
    const buildIdMatch = /BuildID:\s*(\d+)/.exec(stdout);
    if (buildIdMatch) {
      core.setOutput('buildId', buildIdMatch[1]);
    }
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
