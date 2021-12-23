# Steam Deploy
Github Action to deploy a game to Steam

## Setup

#### Prerequisites

This action assumes you are registered as a [partner](https://partner.steamgames.com/) with Steam.

#### 1. Create a Steam Build Account

Create a specialised builder account that only has access to `Edit App Metadata` and `Publish App Changes To Steam`.

https://partner.steamgames.com/doc/sdk/uploading#Build_Account

#### 2. Export your build

In order to upload a build, this action is assuming that you have created that build in a previous `step` or `job`.

For an example of how to do this in Unity, see [Unity Actions](https://github.com/game-ci/unity-actions).

The exported artifact will be used in the next step.

#### 3. Configure for deployment

In order to configure this action, configure a step that looks like the following:

_(The parameters are explained below)_

```yaml
jobs:
  deployToSteam:
    runs-on: ubuntu-latest
    steps:
      - uses: game-ci/steam-deploy@v1
        with:
          username: ${{ secrets.STEAM_USERNAME }}
          password: ${{ secrets.STEAM_PASSWORD }}
          configVdf: ${{ secrets.STEAM_CONFIG_VDF}}
          ssfnFileName: ${{ secrets.STEAM_SSFN_FILE_NAME }}
          ssfnFileContents: ${{ secrets.STEAM_SSFN_FILE_CONTENTS }}
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

#### password

The password of the Steam Build Account that you created in setup step 1.

#### configVdf, ssfnFileName, and ssfnFileContents

Deploying to Steam requires using Multi-Factor Authentication (MFA) through Steam Guard. 
This means that simply using username and password isn't enough to authenticate with Steam. 
However, it is possible to go through the MFA process only once by setting up GitHub Secrets for configVdf, ssfnFileName, and ssfnFileContents with these steps:
1. Install [Valve's offical steamcmd](https://partner.steamgames.com/doc/sdk/uploading#1) on your local machine. All following steps will also be done on your local machine.
1. Try to login with `steamcmd +login <username> <password> +quit`, which may prompt for the MFA code. If so, type in the MFA code that was emailed to your builder account's email address.
1. Validate that the MFA process is complete by running `steamcmd +login <username> <password> +quit` again. It should not ask for the MFA code again.
1. The folder from which you run `steamcmd` will now contain an updated `config/config.vdf` file. Use `cat config/config.vdf | base64 > config_base64.txt` to encode the file. Copy the contents of `config_base64.txt` to a GitHub Secret `STEAM_CONFIG_VDF`.
1. That folder will also contain two files whose names look like `ssfn<numbers>`, **but one of them is a hidden file**. [Find the hidden one](https://support.microsoft.com/en-us/windows/view-hidden-files-and-folders-in-windows-97fbc472-c603-9d90-91d0-1166d1d9f4b5), then copy the name of that file to a GitHub Secret `STEAM_SSFN_FILE_NAME`.
1. Use `cat <ssfnFileName> | base64 > ssfn_base64.txt` to encode the contents of the hidden ssfn file. Copy the contents of `ssfn_base64.txt` to a GitHub Secret `STEAM_SSFN_FILE_CONTENTS`.

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

_(feel free to contribute if you have a more complex use case!)_

#### releaseBranch

The branch within steam that this build will be automatically put live on.

Note that the `default` branch [has been observed to not work](https://github.com/game-ci/steam-deploy/issues/19) as a release branch, presumably because it is potentially dangerous.
