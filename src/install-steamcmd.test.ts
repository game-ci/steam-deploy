import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as path from 'node:path';
import * as exec from '@actions/exec';
import { installSteamCmd, steamCmdLayoutFor } from './install-steamcmd';

vi.mock('@actions/exec');
vi.mock('node:fs/promises');

describe('steamCmdLayoutFor', () => {
  it("uses Valve's Linux installer and ~/Steam on linux", () => {
    expect(steamCmdLayoutFor('linux', '/tmp/steamcmd', '/home/runner')).toEqual({
      url: 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz',
      executable: path.join('/tmp/steamcmd', 'steamcmd.sh'),
      steamHome: path.join('/home/runner', 'Steam'),
    });
  });

  it("uses Valve's macOS installer and Application Support on darwin", () => {
    expect(steamCmdLayoutFor('darwin', '/tmp/steamcmd', '/Users/runner')).toEqual({
      url: 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_osx.tar.gz',
      executable: path.join('/tmp/steamcmd', 'steamcmd.sh'),
      steamHome: path.join('/Users/runner', 'Library', 'Application Support', 'Steam'),
    });
  });

  it("uses Valve's Windows installer and the install dir on win32", () => {
    expect(steamCmdLayoutFor('win32', 'D:\\a\\_temp\\steamcmd', 'C:\\Users\\runner')).toEqual({
      url: 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip',
      executable: path.join('D:\\a\\_temp\\steamcmd', 'steamcmd.exe'),
      steamHome: 'D:\\a\\_temp\\steamcmd',
    });
  });
});

describe('installSteamCmd', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.mocked(exec.exec).mockReset();
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => new ArrayBuffer(0),
    })) as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('extracts the archive and updates steamcmd with +quit', async () => {
    vi.mocked(exec.exec).mockResolvedValue(0);

    const layout = await installSteamCmd();

    expect(exec.exec).toHaveBeenCalledWith(expect.stringMatching(/tar(\.exe)?$/), [
      '-xf',
      expect.any(String),
      '-C',
      expect.any(String),
    ]);
    expect(exec.exec).toHaveBeenLastCalledWith(layout.executable, ['+quit'], {
      ignoreReturnCode: true,
    });
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
