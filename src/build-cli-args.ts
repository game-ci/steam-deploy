const MAX_DEPOTS = 9;

export interface SteamDeployInputs {
  appId: string;
  firstDepotIdOverride?: string;
  buildDescription?: string;
  rootPath: string;
  releaseBranch?: string;
  debugBranch?: string;
  extraExclusions?: string;
  /** depot1Path..depot9Path, indexed 1..9 (sparse - a given index may be unset). */
  depotPaths: Record<number, string | undefined>;
  /** depot1Id..depot9Id, indexed 1..9 (sparse - a given index may be unset). */
  depotIds?: Record<number, string | undefined>;
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
 * one onto the CLI's extra depot1Path..depot8Path slots. Those extras
 * keep the CLI's default numbering (--depotId + 1, + 2, ...), which matches
 * the old action's depot2 = firstDepotIdOverride + 1, so the override is
 * not forwarded as the CLI's own --firstDepotIdOverride.
 */
export function buildCliArgs(inputs: SteamDeployInputs): string[] {
  const primaryDepotId =
    inputs.depotIds?.[1] ??
    inputs.firstDepotIdOverride ??
    String(Number.parseInt(inputs.appId, 10) + 1);

  for (let oldIndex = 1; oldIndex <= MAX_DEPOTS; oldIndex++) {
    if (!inputs.depotPaths[oldIndex] && inputs.depotIds?.[oldIndex]) {
      throw new Error(`depot${oldIndex}Id requires depot${oldIndex}Path.`);
    }
    if (!inputs.depotPaths[oldIndex] && inputs.depotInstallScriptPaths[oldIndex]) {
      throw new Error(`depot${oldIndex}InstallScriptPath requires depot${oldIndex}Path.`);
    }
  }

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

  const hasAdditionalDepot = Object.keys(inputs.depotPaths).some(
    (key) => Number(key) > 1 && Boolean(inputs.depotPaths[Number(key)]),
  );
  if (!inputs.depotPaths[1] && hasAdditionalDepot && inputs.extraExclusions) {
    throw new Error('extraExclusions requires depot1Path because it applies to the primary depot.');
  }
  if (!inputs.depotPaths[1] && hasAdditionalDepot) args.push('--skipPrimaryDepot');

  for (let oldIndex = 2; oldIndex <= MAX_DEPOTS; oldIndex++) {
    const depotPath = inputs.depotPaths[oldIndex];
    if (!depotPath) continue;

    const extraSlot = oldIndex - 1;
    args.push(`--depot${extraSlot}Path`, depotPath);
    const depotId = inputs.depotIds?.[oldIndex];
    if (depotId) args.push(`--depot${extraSlot}Id`, depotId);
    const installScript = inputs.depotInstallScriptPaths[oldIndex];
    if (installScript) args.push(`--depot${extraSlot}InstallScriptPath`, installScript);
  }

  // The CLI's --branch defaults to "default", which Steam won't set live, so an
  // unset releaseBranch passes an empty one to upload without setting it live.
  args.push('--branch', inputs.releaseBranch ?? '');
  if (inputs.buildDescription) args.push('--description', inputs.buildDescription);
  if (inputs.debugBranch === 'true') args.push('--debugBranch');
  if (inputs.extraExclusions) args.push('--extraExclusions', inputs.extraExclusions);

  return args;
}
