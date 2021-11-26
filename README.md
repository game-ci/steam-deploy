# Steam deploy
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
  deploy:
    name: Deploy to Steam ☁
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: game-ci/steam-deploy@v1
        with:
          username: ${{ secrets.STEAM_USERNAME }}
          password: ${{ secrets.STEAM_PASSWORD }}
          configVdf: ${{ secrets.STEAM_CONFIG_VDF}}
          ssfnFilePath: ${{ secrets.STEAM_SSFN_FILE_PATH }}
          ssfnFileContents: ${{ secrets.STEAM_SSFN_FILE_CONTENTS }}
          appId: 1234560
          buildDescription: v0.0.1
          rootPath: build
          depot1Path: StandaloneWindows64
          depot2Path: StandaloneLinux64
          releaseBranch: prerelease
```

## Configuration

#### username

The username of the Steam Builder Account that you created in setup step 1.

#### password

The password of the Steam Builder Account that you created in setup step 1.

#### configVdf, ssfnFilePath, and ssfnFileContents

Deploying to Steam requires using Multi-Factor Authentication (MFA) through Steam Guard. 
This means that simply using username and password isn't enough to authenticate with Steam. 
Fortunately, GitHub runners share the same machine ID, so it is possible to go through the MFA process only once by using secrets for configVdf, ssfnFilePath, and ssfnFileContents.

To go through the MFA process and get the values for configVdf, ssfnFilePath, and ssfnFileContents, we recommend following these steps:
1. Copy [this setup_steam_secrets.yml workflow](.github/workflows/setup_steam_secrets.yml) to your repo's workflows.
1. Create [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets) for `STEAM_USERNAME` and `STEAM_PASSWORD`.
1. [Manually run](https://docs.github.com/en/actions/managing-workflow-runs/manually-running-a-workflow) the "Setup Steam Secrets" workflow. 
Note that the workflow will fail at this time, but it should also cause an email to be sent with a code for the MFA process.
1. Create a Secret called `STEAM_MFA_CODE` with the value from the email from the previous step. 
1. Create a [Personal Access Token (PAT)](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) with full `repo` access and save it as a Secret called `PERSONAL_ACCESS_TOKEN`. 
You could instead edit the "Setup Steam Secrets" workflow to use an existing PAT if you already have one.
1. Re-run the "Setup Steam Secrets" workflow, which should now successfully run and create Secrets for `STEAM_CONFIG_VDF`, `STEAM_SSFN_FILE_PATH` and `STEAM_SSFN_FILE_CONTENTS`.
1. **IMPORTANT:** [Delete the logs](https://github.blog/changelog/2020-04-21-github-actions-logs-can-now-be-deleted/) for the succesful run, as the values of the secrets could potentially be stolen from the logs if they are not deleted. 
You could also delete the `STEAM_MFA_CODE` Secret at this time, though there are no serious security implications for keeping `STEAM_MFA_CODE` as a Secret.

Once the Secrets for `STEAM_CONFIG_VDF`, `STEAM_SSFN_FILE_PATH` and `STEAM_SSFN_FILE_CONTENTS` have been successfully created, the steam-deploy action can take them as inputs to be used with Steam Guard, as shown in the example above.

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
