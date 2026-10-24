import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import * as exec from '@actions/exec';
import { installSteamCmd, removeSteamCmd, steamCmdLayoutFor } from './install-steamcmd';

vi.mock('@actions/exec');
vi.mock('node:fs/promises');

describe('steamCmdLayoutFor', () => {
  it("uses Valve's Linux installer and HOME/Steam on linux", () => {
    expect(steamCmdLayoutFor('linux', '/tmp/steamcmd', '/tmp/home')).toEqual({
      url: 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz',
      executable: path.join('/tmp/steamcmd', 'steamcmd.sh'),
      steamHome: path.join('/tmp/home', 'Steam'),
      env: { HOME: '/tmp/home' },
    });
  });

  it("uses Valve's macOS installer and Application Support on darwin", () => {
    expect(steamCmdLayoutFor('darwin', '/tmp/steamcmd', '/tmp/home')).toEqual({
      url: 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_osx.tar.gz',
      executable: path.join('/tmp/steamcmd', 'steamcmd.sh'),
      steamHome: path.join('/tmp/home', 'Library', 'Application Support', 'Steam'),
      env: { HOME: '/tmp/home' },
    });
  });

  it("uses Valve's Windows installer and the install dir on win32", () => {
    expect(steamCmdLayoutFor('win32', 'D:\\a\\_temp\\steamcmd', 'D:\\a\\_temp\\home')).toEqual({
      url: 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip',
      executable: path.join('D:\\a\\_temp\\steamcmd', 'steamcmd.exe'),
      steamHome: 'D:\\a\\_temp\\steamcmd',
      env: {},
    });
  });
});

describe('installSteamCmd', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.mocked(exec.exec).mockReset();
    vi.mocked(fs.rm).mockReset();
    vi.mocked(fs.mkdtemp).mockResolvedValue('/tmp/steamcmd-abc');
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => new ArrayBuffer(0),
    })) as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('extracts the archive into a per-run directory and updates steamcmd with +quit', async () => {
    vi.mocked(exec.exec).mockResolvedValue(0);

    const steamCmd = await installSteamCmd();

    expect(steamCmd.root).toBe('/tmp/steamcmd-abc');
    expect(steamCmd.executable.startsWith(path.join('/tmp/steamcmd-abc', 'install'))).toBe(true);
    expect(steamCmd.steamHome.startsWith('/tmp/steamcmd-abc')).toBe(true);
    expect(exec.exec).toHaveBeenCalledWith(expect.stringMatching(/tar(\.exe)?$/), [
      '-xf',
      expect.any(String),
      '-C',
      path.join('/tmp/steamcmd-abc', 'install'),
    ]);
    expect(exec.exec).toHaveBeenLastCalledWith(steamCmd.executable, ['+quit'], {
      env: expect.objectContaining(steamCmd.env),
      ignoreReturnCode: true,
    });
  });

  it('removes the per-run directory when the install fails', async () => {
    vi.mocked(exec.exec).mockResolvedValueOnce(0).mockResolvedValue(8);

    await expect(installSteamCmd()).rejects.toThrow();
    expect(fs.rm).toHaveBeenLastCalledWith('/tmp/steamcmd-abc', { recursive: true, force: true });
  });

  it('retries once when the self-update run exits non-zero', async () => {
    vi.mocked(exec.exec).mockResolvedValueOnce(0).mockResolvedValueOnce(7).mockResolvedValueOnce(0);

    await expect(installSteamCmd()).resolves.toBeDefined();
    expect(exec.exec).toHaveBeenCalledTimes(3);
  });

  it('fails when steamcmd still exits non-zero after the retry', async () => {
    vi.mocked(exec.exec).mockResolvedValueOnce(0).mockResolvedValue(8);

    await expect(installSteamCmd()).rejects.toThrow(/exit code 8/);
  });

  it('fails when the download fails', async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: false, status: 503 })) as unknown as typeof fetch;

    await expect(installSteamCmd()).rejects.toThrow(/returned 503/);
  });
});

describe('removeSteamCmd', () => {
  it('removes the per-run directory with the Steam session', async () => {
    vi.mocked(fs.rm).mockReset();
    vi.mocked(exec.exec).mockResolvedValue(0);
    vi.mocked(fs.mkdtemp).mockResolvedValue('/tmp/steamcmd-abc');
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => new ArrayBuffer(0),
    })) as unknown as typeof fetch;

    await removeSteamCmd(await installSteamCmd());

    expect(fs.rm).toHaveBeenLastCalledWith('/tmp/steamcmd-abc', { recursive: true, force: true });
  });
});
