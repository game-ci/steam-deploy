const MAX_DEPOTS = 9;

export interface SteamDeployInputs {
  appId: string;
  firstDepotIdOverride?: string;
  buildDescription?: string;
  rootPath: string;
  releaseBranch?: string;
  debugBranch?: string;
  /** depot1Path..depot9Path, indexed 1..9 (sparse - a given index may be unset). */
  depotPaths: Record<number, string | undefined>;
  /** depot1InstallScriptPath..depot9InstallScriptPath, indexed 1..9. */
  depotInstallScriptPaths: Record<number, string | undefined>;
}

/**
 * Maps this action's inputs (the old standalone game-ci/steam-deploy
 * action's own input names, kept for backward compatibility with existing
 * workflows) onto game-ci CLI's `deploy steam` argv.
 *
 * The old action numbers ALL depots depot1..depot9 with no separate
 * "primary" depot - the CLI's `deploy steam` instead has one required
 * --depotId (its own "primary" depot) plus up to 9 *extra* depots
 * (depot1Path..depot9Path). depot1 here maps onto that primary depot
 * (its ID is --firstDepotIdOverride, defaulting to appId+1 - the same
 * default the old action itself used), and depot2..depot9 shift down by
 * one onto the CLI's extra depot1Path..depot8Path slots.
 */
export function buildCliArgs(inputs: SteamDeployInputs): string[] {
  const primaryDepotId =
    inputs.firstDepotIdOverride ?? String(Number.parseInt(inputs.appId, 10) + 1);

  const args = [
    'deploy',
    'steam',
    inputs.rootPath,
    '--appId',
    inputs.appId,
    '--depotId',
    primaryDepotId,
  ];

  if (inputs.depotPaths[1]) args.push('--depotPath', inputs.depotPaths[1]!);
  if (inputs.depotInstallScriptPaths[1])
    args.push('--depotInstallScriptPath', inputs.depotInstallScriptPaths[1]!);

  let extraSlot = 1;
  for (let oldIndex = 2; oldIndex <= MAX_DEPOTS; oldIndex++) {
    const depotPath = inputs.depotPaths[oldIndex];
    if (!depotPath) continue;

    args.push(`--depot${extraSlot}Path`, depotPath);
    const installScript = inputs.depotInstallScriptPaths[oldIndex];
    if (installScript) args.push(`--depot${extraSlot}InstallScriptPath`, installScript);
    extraSlot += 1;
  }

  if (inputs.firstDepotIdOverride) args.push('--firstDepotIdOverride', inputs.firstDepotIdOverride);
  if (inputs.releaseBranch) args.push('--branch', inputs.releaseBranch);
  if (inputs.buildDescription) args.push('--description', inputs.buildDescription);
  if (inputs.debugBranch === 'true') args.push('--debugBranch');

  return args;
}
