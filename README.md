# Steam Deploy

[![Actions status](https://github.com/game-ci/steam-deploy/workflows/🚀/badge.svg?event=push&branch=main)](https://github.com/game-ci/steam-deploy/actions/workflows/main.yml)

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

Deploying to Steam requires using Multi-Factor Authentication (MFA) through Steam Guard unless `totp` is passed.
This means that simply using username and password isn't enough to authenticate with Steam. 
However, it is possible to go through the MFA process only once by setting up GitHub Secrets for `configVdf` with these steps:
1. Install [Valve's offical steamcmd](https://partner.steamgames.com/doc/sdk/uploading#1) on your local machine. All following steps will also be done on your local machine.
1. Try to login with `steamcmd +login <username> <password> +quit`, which may prompt for the MFA code. If so, type in the MFA code that was emailed to your builder account's email address.
1. Validate that the MFA process is complete by running `steamcmd +login <username> +quit` again. It should not ask for the MFA code again.
1. The folder from which you run `steamcmd` will now contain an updated `config/config.vdf` file. Use `cat config/config.vdf | base64 > config_base64.txt` to encode the file. Copy the contents of `config_base64.txt` to a GitHub Secret `STEAM_CONFIG_VDF`.
   - macOS: `cat ~/Library/Application\ Support/Steam/config/config.vdf | base64 > config_base64.txt`
1. `If:` when running the action you recieve another MFA code via email, run `steamcmd +set_steam_guard_code <code>` on your local machine and repeat the `config.vdf` encoding and replace secret `STEAM_CONFIG_VDF` with its contents.

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

## Other Notes

#### Excluded Files / Folders

Certain file or folder patterns are excluded from the upload to Steam as they're unsafe to ship to players:

- `*.pdb` - symbols files
- Folders that Unity includes in builds with debugging or other information that isn't intended to be sent to players:
    - `*_BurstDebugInformation_DoNotShip`
    - `*_BackUpThisFolder_ButDontShipItWithYourGame`
