# Steam Deploy

[![Actions status](https://github.com/game-ci/steam-deploy/workflows/🚀/badge.svg?branch=main)](https://github.com/game-ci/steam-deploy/actions/workflows/main.yml)

Github Action to deploy a game to Steam

## Setup

#### Prerequisites

This action assumes you are registered as a [partner](https://partner.steamgames.com/) with Steam.

#### 1. Create a Steam Build Account

Create a specialised builder account that only has access to `Edit App Metadata` and `Publish App Changes To Steam`,
and permissions to edit your specific app.

https://partner.steamgames.com/doc/sdk/uploading#Build_Account

#### 2. Export your build

In order to upload a build, this action is assuming that you have created that build in a previous `step` or `job`.

For an example of how to do this in Unity, see [Unity Actions](https://github.com/game-ci/unity-actions).

The exported artifact will be used in the next step.

#### 3. Configure for deployment

In order to configure this action, configure a step that looks like the following:

_(The parameters are explained below)_

Option A. Using MFA files

```yaml
jobs:
  deployToSteam:
    runs-on: ubuntu-latest
    steps:
      - uses: game-ci/steam-deploy@v3
        with:
          username: ${{ secrets.STEAM_USERNAME }}          
          configVdf: ${{ secrets.STEAM_CONFIG_VDF}}          
          appId: 1234560
          buildDescription: v1.2.3
          rootPath: build
          depot1Path: StandaloneWindows64
          depot1InstallScriptPath: StandaloneWindows64/install_script.vdf
          depot2Path: StandaloneLinux64
          releaseBranch: prerelease
```

Option B. Using TOTP

```yaml
jobs:
  deployToSteam:
    runs-on: ubuntu-latest
    steps:
      - uses: CyberAndrii/steam-totp@v1
        name: Generate TOTP
        id: steam-totp
        with:
          shared_secret: ${{ secrets.STEAM_SHARED_SECRET }}
      - uses: game-ci/steam-deploy@v3
        with:
          username: ${{ secrets.STEAM_USERNAME }}          
          totp: ${{ steps.steam-totp.outputs.code }}
          appId: 1234560
          buildDescription: v1.2.3
          rootPath: build
          depot1Path: StandaloneWindows64
          depot2Path: StandaloneLinux64
          releaseBranch: prerelease
```

## Configuration

#### username

The username of the Steam Build Account that you created in setup step 1.

#### totp

Deploying to Steam using TOTP. If this is not passed, `configVdf` is required.

#### configVdf

Steam Deploy supports two authentication methods:

1. **Time-based One-Time Password (TOTP)** - Recommended if you have access to the shared secret.
2. **Steam Guard MFA with `config.vdf`** - An alternative method requiring a one-time setup.

If you are using the `config.vdf` method, follow these steps to set up the required GitHub Secret:

1. **Install steamcmd**  
   Install [Valve's official steamcmd](https://partner.steamgames.com/doc/sdk/uploading#1) on your local machine. All subsequent steps will also be performed on your local machine.

2. **Log in to Steam using steamcmd**  
   Run the following command to log in:
   ```bash
   steamcmd +login <username> <password> +quit
   ```
   If prompted, check your email for the MFA code and provide it when requested.

3. **Validate MFA completion**  
   To ensure MFA is complete, run:
   ```bash
   steamcmd +login <username> +quit
   ```
   If no MFA prompt appears, proceed to the next step.

4. **Locate and encode the `config.vdf` file**  
   The location of the `config.vdf` file depends on your operating system:
   - **Windows/Linux**: The file is in the `config/config.vdf` relative to where you ran `steamcmd`.
   - **macOS**: The file is located at `~/Library/Application Support/Steam/config/config.vdf`.

    Encode the file and store it as a GitHub Secret:
    ```bash
    # Windows/Linux
    cat config/config.vdf | base64 > config_base64.txt
    
    # macOS
    cat ~/Library/Application\ Support/Steam/config/config.vdf | base64 > config_base64.txt
    ```
    ⚠️ **IMPORTANT**: The encoded `config.vdf` contains sensitive authentication data. Ensure you:
   - Store it securely as a GitHub Secret named `STEAM_CONFIG_VDF`.
   - Never commit the raw or encoded `config.vdf` to your repository.
   - Rotate it periodically or if it is compromised.

5. **Handling new MFA code requests**  
   If the GitHub Action requests a new MFA code, run:
   ```bash
   steamcmd +set_steam_guard_code <code>
   ```
   Generate a new encoded `config.vdf` file (see step 4) and update the `STEAM_CONFIG_VDF` GitHub Secret with its contents.

6. **Resolving 'License expired' error**  
   If the action fails with the error `Logging in user ... to Steam Public...FAILED (License expired)`, follow these steps:
  - On your local machine, run:
    ```bash
    steamcmd +login <username>
    ```
  - Enter the new Steam Guard code sent to your email.
  - Generate a new encoded `config.vdf` file (see step 4).
  - Update your `STEAM_CONFIG_VDF` GitHub Secret with the new encoded value.

#### appId

The identifier of your app on steam. You can find it on your [dashboard](https://partner.steamgames.com/dashboard).

#### buildDescription

The identifier for this specific build, which helps you identify it in steam. 

It is recommended to use the semantic version of the build for this.

#### rootPath

The root path to your builds. This is the base of which depots will search your files.

#### depot[X]Path

Where X is any number between 1 and 9 (inclusive both).

The relative path following your root path for the files to be included in this depot.

If your appId is 125000 then the depots 125001 ... 125009 will be assumed.

#### firstDepotIdOverride

You can use this to override the ID of the first depot in case the IDs do not start as described in depot[X]Path (e.g. for DLCs).

If your firstDepotId is 125000 then, regardless of the used appId, the depots 125000 ... 125008 will be assumed.

_(feel free to contribute if you have a more complex use case!)_

#### releaseBranch

The branch within steam that this build will be automatically put live on.

Note that the `default` branch [has been observed to not work](https://github.com/game-ci/steam-deploy/issues/19) as a release branch, presumably because it is potentially dangerous.

#### debugBranch

If set to true, do not exclude debug files from the upload.

## Other Notes

#### Excluded Files / Folders

Certain file or folder patterns are excluded from the upload to Steam as they're unsafe to ship to players, unless debugBranch is set to true:

- `*.pdb` - symbols files
- Folders that Unity includes in builds with debugging or other information that isn't intended to be sent to players:
    - `*_BurstDebugInformation_DoNotShip`
    - `*_BackUpThisFolder_ButDontShipItWithYourGame`
