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
}

/**
 * Describes Valve's own steamcmd distribution for a given platform. Paths
 * were confirmed on GitHub-hosted ubuntu-24.04, ubuntu-26.04, macos and
 * windows runners.
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
      };
    case 'darwin':
      return {
        url: `${INSTALLER_BASE_URL}/steamcmd_osx.tar.gz`,
        executable: path.join(installDir, 'steamcmd.sh'),
        steamHome: path.join(homeDir, 'Library', 'Application Support', 'Steam'),
      };
    default:
      return {
        url: `${INSTALLER_BASE_URL}/steamcmd_linux.tar.gz`,
        executable: path.join(installDir, 'steamcmd.sh'),
        steamHome: path.join(homeDir, 'Steam'),
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
 */
export async function installSteamCmd(): Promise<SteamCmdLayout> {
  const installDir = path.join(process.env.RUNNER_TEMP || os.tmpdir(), 'steamcmd');
  const layout = steamCmdLayoutFor(process.platform, installDir, os.homedir());

  await fs.mkdir(installDir, { recursive: true });

  core.info(`Downloading steamcmd from ${layout.url}`);
  const response = await fetch(layout.url);
  if (!response.ok) {
    throw new Error(`Failed to download steamcmd: ${layout.url} returned ${response.status}.`);
  }

  const archive = path.join(installDir, path.basename(layout.url));
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
    const exitCode = await exec.exec(layout.executable, ['+quit'], { ignoreReturnCode: true });
    if (exitCode === 0) break;
    if (attempt === 2) {
      throw new Error(`steamcmd failed to update to the latest version (exit code ${exitCode}).`);
    }
  }

  return layout;
}
