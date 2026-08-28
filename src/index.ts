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
    // The old action's configVdf input is the file's raw contents; the CLI
    // expects it base64-encoded (STEAM_CONFIG_VDF_BASE64), matching how
    // it's stored/passed everywhere else credentials cross this boundary.
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
    await exec.exec(cliPath, args, {
      env: {
        ...process.env,
        STEAM_USERNAME: username,
        ...(password ? { STEAM_PASSWORD: password } : {}),
        ...(totp ? { STEAM_TOTP: totp } : {}),
        ...(configVdf
          ? { STEAM_CONFIG_VDF_BASE64: Buffer.from(configVdf, 'utf8').toString('base64') }
          : {}),
      },
    });
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
