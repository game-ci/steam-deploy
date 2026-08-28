import { describe, it, expect } from 'vitest';
import { buildCliArgs, type SteamDeployInputs } from './build-cli-args';

function baseInputs(overrides: Partial<SteamDeployInputs> = {}): SteamDeployInputs {
  return {
    appId: '1000',
    rootPath: 'build',
    depotPaths: {},
    depotInstallScriptPaths: {},
    ...overrides,
  };
}

describe('buildCliArgs', () => {
  it('defaults the primary depot id to appId+1', () => {
    const args = buildCliArgs(baseInputs());
    expect(args).toEqual(['deploy', 'steam', 'build', '--appId', '1000', '--depotId', '1001']);
  });

  it('uses firstDepotIdOverride for the primary depot id when given', () => {
    const args = buildCliArgs(baseInputs({ firstDepotIdOverride: '2000' }));
    expect(args).toContain('--depotId');
    expect(args[args.indexOf('--depotId') + 1]).toBe('2000');
    expect(args).toContain('--firstDepotIdOverride');
  });

  it('maps depot1Path onto the primary --depotPath', () => {
    const args = buildCliArgs(baseInputs({ depotPaths: { 1: 'StandaloneWindows64' } }));
    expect(args).toContain('--depotPath');
    expect(args[args.indexOf('--depotPath') + 1]).toBe('StandaloneWindows64');
  });

  it('maps depot1InstallScriptPath onto the primary --depotInstallScriptPath', () => {
    const args = buildCliArgs(baseInputs({ depotInstallScriptPaths: { 1: 'install.vdf' } }));
    expect(args).toContain('--depotInstallScriptPath');
  });

  it('shifts depot2..depot9 down by one onto the CLI extra depot slots', () => {
    const args = buildCliArgs(
      baseInputs({
        depotPaths: { 1: 'win', 2: 'linux', 3: 'mac' },
      }),
    );
    expect(args).toContain('--depotPath');
    expect(args[args.indexOf('--depotPath') + 1]).toBe('win');
    expect(args).toContain('--depot1Path');
    expect(args[args.indexOf('--depot1Path') + 1]).toBe('linux');
    expect(args).toContain('--depot2Path');
    expect(args[args.indexOf('--depot2Path') + 1]).toBe('mac');
  });

  it('skips unset depot slots without leaving gaps in the extra-depot numbering', () => {
    const args = buildCliArgs(
      baseInputs({
        depotPaths: { 1: 'win', 3: 'mac' },
      }),
    );
    expect(args).toContain('--depot1Path');
    expect(args[args.indexOf('--depot1Path') + 1]).toBe('mac');
    expect(args).not.toContain('--depot2Path');
  });

  it('maps releaseBranch, buildDescription, and debugBranch', () => {
    const args = buildCliArgs(
      baseInputs({ releaseBranch: 'beta', buildDescription: 'v1.2.3', debugBranch: 'true' }),
    );
    expect(args).toContain('--branch');
    expect(args[args.indexOf('--branch') + 1]).toBe('beta');
    expect(args).toContain('--description');
    expect(args[args.indexOf('--description') + 1]).toBe('v1.2.3');
    expect(args).toContain('--debugBranch');
  });

  it('omits --debugBranch when not set to the literal string "true"', () => {
    const args = buildCliArgs(baseInputs({ debugBranch: 'false' }));
    expect(args).not.toContain('--debugBranch');
  });
});
