import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import * as core from '@actions/core';
import * as exec from '@actions/exec';

const INSTALLER_BASE_URL = 'https://steamcdn-a.akamaihd.net/client/installer';

export interface SteamCmdLayout {
  /** Valve's official installer archive for this platform. */
  url: string;
  /** The executable to run once the archive is extracted into installDir. */
  executable: string;
  /**
   * Where this steamcmd reads config/config.vdf from. Passed to the CLI as
   * STEAM_HOME so a configVdf session lands where steamcmd actually looks
   * for it - this differs per platform and is not always ~/Steam.
   */
  steamHome: string;
  /**
   * Environment overrides for every steamcmd process. On Linux and macOS
   * steamcmd keeps its session under $HOME, so HOME points at the per-run
   * home directory. On Windows it keeps it in installDir instead.
   */
  env: Record<string, string>;
}

export interface SteamCmdInstall extends SteamCmdLayout {
  /** Per-run directory that holds steamcmd and its Steam session. */
  root: string;
}

/**
 * Describes Valve's own steamcmd distribution for a given platform. Paths
 * were confirmed on GitHub-hosted ubuntu-24.04, ubuntu-26.04, macos and
 * windows runners, including with HOME pointed at homeDir.
 */
export function steamCmdLayoutFor(
  platform: NodeJS.Platform,
  installDir: string,
  homeDir: string,
): SteamCmdLayout {
  switch (platform) {
    case 'win32':
      return {
        url: `${INSTALLER_BASE_URL}/steamcmd.zip`,
        executable: path.join(installDir, 'steamcmd.exe'),
        steamHome: installDir,
        env: {},
      };
    case 'darwin':
      return {
        url: `${INSTALLER_BASE_URL}/steamcmd_osx.tar.gz`,
        executable: path.join(installDir, 'steamcmd.sh'),
        steamHome: path.join(homeDir, 'Library', 'Application Support', 'Steam'),
        env: { HOME: homeDir },
      };
    default:
      return {
        url: `${INSTALLER_BASE_URL}/steamcmd_linux.tar.gz`,
        executable: path.join(installDir, 'steamcmd.sh'),
        steamHome: path.join(homeDir, 'Steam'),
        env: { HOME: homeDir },
      };
  }
}

/**
 * Installs Valve's official steamcmd natively on the runner and updates it
 * to the latest version, so the CLI can run it in local mode instead of
 * through Docker.
 *
 * Running steamcmd in a container breaks on Docker 29.4.2 (the version on
 * GitHub's ubuntu-26.04 runner image): its default seccomp profile blocks
 * AF_ALG sockets, and steamcmd then fails its self-update with "Steamcmd
 * needs to be online to update". Running it natively avoids the container
 * entirely and works on every GitHub-hosted runner OS.
 *
 * steamcmd and its Steam home live in a new per-run directory, so the login
 * session it stores in config/config.vdf never lands in the runner user's
 * real home. Call removeSteamCmd() when the deployment is done.
 */
export async function installSteamCmd(): Promise<SteamCmdInstall> {
  const root = await fs.mkdtemp(path.join(process.env.RUNNER_TEMP || os.tmpdir(), 'steamcmd-'));
  const installDir = path.join(root, 'install');
  const homeDir = path.join(root, 'home');
  const steamCmd = { root, ...steamCmdLayoutFor(process.platform, installDir, homeDir) };

  try {
    await fs.mkdir(installDir, { recursive: true });
    await fs.mkdir(homeDir, { recursive: true });

    core.info(`Downloading steamcmd from ${steamCmd.url}`);
    const response = await fetch(steamCmd.url);
    if (!response.ok) {
      throw new Error(`Failed to download steamcmd: ${steamCmd.url} returned ${response.status}.`);
    }

    const archive = path.join(root, path.basename(steamCmd.url));
    await fs.writeFile(archive, Buffer.from(await response.arrayBuffer()));

    // Windows' bundled bsdtar extracts zip archives; Git for Windows' GNU tar,
    // which can come first in PATH, cannot.
    const tar =
      process.platform === 'win32'
        ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe')
        : 'tar';
    await exec.exec(tar, ['-xf', archive, '-C', installDir]);
    await fs.rm(archive);

    // The first run downloads the latest steamcmd and replaces itself. On
    // Windows that run exits non-zero after the self-update, so a second run
    // confirms the updated steamcmd starts cleanly.
    for (let attempt = 1; ; attempt += 1) {
      const exitCode = await exec.exec(steamCmd.executable, ['+quit'], {
        env: { ...process.env, ...steamCmd.env } as Record<string, string>,
        ignoreReturnCode: true,
      });
      if (exitCode === 0) break;
      if (attempt === 2) {
        throw new Error(`steamcmd failed to update to the latest version (exit code ${exitCode}).`);
      }
    }
  } catch (error) {
    await removeSteamCmd(steamCmd);
    throw error;
  }

  return steamCmd;
}

/**
 * Removes steamcmd and its Steam home, including the login session in
 * config/config.vdf, so a later job on a persistent self-hosted runner
 * cannot reuse it.
 */
export async function removeSteamCmd(steamCmd: SteamCmdInstall): Promise<void> {
  // Retries cover EBUSY and EPERM while Windows still holds a lock on a file
  // that steamcmd just closed.
  await fs.rm(steamCmd.root, { recursive: true, force: true, maxRetries: 5 });
}
