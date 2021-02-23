# Steam deploy
Github Action to deploy a game to steam

## Setup

#### Prerequisites

This action assumes you are registered as a [partner](https://partner.steamgames.com/) with Steam.

#### 1. Create a Steam Build Account

Create a specialised builder account that only has access to `Edit App Metadata` and `Publish App Changes To Steam`.

https://partner.steamgames.com/doc/sdk/uploading#Build_Account

#### 2. Export your build

In order to upload a build, this action is assuming that you have created that build in a previous `step` or `job`.

For an example of how to do this in unity, see [Unity Actions](https://github.com/webbertakken/unity-actions).

The exported artifact will be used in the next step.

#### 3. Configure for deployment

In order to configure this action, configure a step that looks like the following:

_(The parameters are explained below)_

```yaml
jobs:
  deploy:
    name: Deploy to Steam ☁
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
    steps:
      - uses: actions/checkout@v2
      - uses: webbertakken/steam-deploy@<version>
        with:
          username: ${{ secrets.STEAM_USERNAME }}
          password: ${{ secrets.STEAM_PASSWORD }}
          mfaCode:  ${{ secrets.STEAM_MFA_CODE }}
          appId: 1234560
          buildDescription: v0.0.1
          rootPath: builds
          depot1Path: StandaloneWindows64
          depot2Path: StandaloneLinux64
          releaseBranch: PreRelease
          localContentServer: LocalContentServer
```

## Configuration

#### username

The username of the Steam Builder Account that you created in setup step 1.

#### password

The password of the Steam Builder Account that you created in setup step 1.

#### mfaCode

The multi-factor authentication code from steam guard, that is emailed when attempting to sign in.

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

It is recommended to **not use** branch `default` for this as it is potentially dangerous.

#### localContentServer

The path to your local content server.
