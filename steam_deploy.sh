#!/bin/sh

echo ""
echo "#################################"
echo "#   Generating Depot Manifests  #"
echo "#################################"
echo ""

if [ -n "$firstDepotIdOverride" ]; then
  firstDepotId=$firstDepotIdOverride
else
  # The first depot ID of a standard Steam app is the app's ID plus one
  firstDepotId=$((appId + 1))
fi

i=1;
export DEPOTS="\n  "
until [ $i -gt 9 ]; do
  eval "currentDepotPath=\$depot${i}Path"
  if [ -n "$currentDepotPath" ]; then
    # depot1Path uses firstDepotId, depot2Path uses firstDepotId + 1, depot3Path uses firstDepotId + 2...
    currentDepot=$((firstDepotId + i - 1))

    echo ""
    echo "Adding depot${currentDepot}.vdf ..."
    echo ""
    export DEPOTS="$DEPOTS  \"$currentDepot\" \"depot${currentDepot}.vdf\"\n  "
    cat << EOF > "depot${currentDepot}.vdf"
"DepotBuildConfig"
{
  "DepotID" "$currentDepot"
  "FileMapping"
  {
    "LocalPath" "./$currentDepotPath/*"
    "DepotPath" "."
    "recursive" "1"
  }
  "FileExclusion" "*.pdb"
  "FileExclusion" "**/*_BurstDebugInformation_DoNotShip*"
  "FileExclusion" "**/*_BackUpThisFolder_ButDontShipItWithYourGame*"
}
EOF

  cat depot${currentDepot}.vdf
  echo ""
  fi;

  i=$((i+1))
done

echo ""
echo "#################################"
echo "#    Generating App Manifest    #"
echo "#################################"
echo ""

mkdir -p BuildOutput

steamdir=$STEAM_HOME
manifest_path=$(pwd)/manifest.vdf
contentroot=$(pwd)/$rootPath
if [[ "$OSTYPE" = "darwin"* ]]; then
  steamdir="$HOME/Library/Application Support/Steam"
elif [[ "$OSTYPE" = "msys"* ]]; then
  manifest_path=$(cygpath -w "$manifest_path")
  contentroot=$(cygpath -w "$contentroot")
elif [ "$RUNNER_OS" = "Linux" ]; then
  steamdir="/home/runner/Steam"
fi

cat << EOF > "manifest.vdf"
"appbuild"
{
  "appid" "$appId"
  "desc" "$buildDescription"
  "buildoutput" "BuildOutput"
  "contentroot" "$contentroot"
  "setlive" "$releaseBranch"

  "depots"
  {$(echo "$DEPOTS" | sed 's/\\n/\
/g')}
}
EOF

cat manifest.vdf
echo ""

if [ -n "$steam_totp" ]; then
  echo ""
  echo "#################################"
  echo "#     Using SteamGuard TOTP     #"
  echo "#################################"
  echo ""
else
  if [ ! -n "$configVdf" ] || [ ! -n "$ssfnFileName" ] || [ ! -n "$ssfnFileContents" ]; then
    echo "MFA inputs are missing or incomplete! Cannot proceed."
    exit 1
  fi

  echo ""
  echo "#################################"
  echo "#    Copying SteamGuard Files   #"
  echo "#################################"
  echo ""

  echo "Steam is installed in: $steamdir"

  mkdir -p "$steamdir/config"

  echo "Copying $steamdir/config/config.vdf..."
  echo "$configVdf" | base64 -d > "$steamdir/config/config.vdf"
  chmod 777 "$steamdir/config/config.vdf"

  echo "Copying $steamdir/ssfn..."
  echo "$ssfnFileContents" | base64 -d > "$steamdir/$ssfnFileName"
  chmod 777 "$steamdir/$ssfnFileName"

  echo "Finished Copying SteamGuard Files!"
  echo ""
fi

echo ""
echo "#################################"
echo "#        Uploading build        #"
echo "#################################"
echo ""

$STEAM_CMD +login "$steam_username" "$steam_password" "$steam_totp" +run_app_build $manifest_path +quit || (
    echo ""
    echo "#################################"
    echo "#             Errors            #"
    echo "#################################"
    echo ""
    echo "Listing current folder and rootpath"
    echo ""
    ls -alh
    echo ""
    ls -alh $rootPath
    echo ""
    echo "Listing logs folder:"
    echo ""
    ls -Ralph "$steamdir/logs/"
    echo ""
    echo "Displaying error log"
    echo ""
    cat "$steamdir/logs/stderr.txt"
    echo ""
    echo "Displaying bootstrapper log"
    echo ""
    cat "$steamdir/logs/bootstrap_log.txt"
    echo ""
    echo "#################################"
    echo "#             Output            #"
    echo "#################################"
    echo ""
    ls -Ralph BuildOutput
    exit 1
  )
