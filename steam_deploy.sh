#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

steamdir=${STEAM_HOME:-$HOME/Steam}
# this is relative to the action
contentroot=$(pwd)/$rootPath

# these are temporary file we create, so in a tmpdir
mkdir BuildOutput
manifest_path=$(pwd)/manifest.vdf

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

  steam_totp="INVALID"

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
echo "#        Test login             #"
echo "#################################"
echo ""

steamcmd +set_steam_guard_code "$steam_totp" +login "$steam_username" "$steam_password" +quit;

ret=$?
if [ $ret -eq 0 ]; then
    echo ""
    echo "#################################"
    echo "#        Successful login       #"
    echo "#################################"
    echo ""
else
      echo ""
      echo "#################################"
      echo "#        FAILED login           #"
      echo "#################################"
      echo ""
      echo "Exit code: $ret"

      exit $ret
fi

echo ""
echo "#################################"
echo "#        Uploading build        #"
echo "#################################"
echo ""

steamcmd +login "$steam_username" "$steam_password" +run_app_build "$manifest_path" +quit || (
    echo ""
    echo "#################################"
    echo "#             Errors            #"
    echo "#################################"
    echo ""
    echo "Listing current folder and rootpath"
    echo ""
    ls -alh
    echo ""
    ls -alh "$rootPath" || true
    echo ""
    echo "Listing logs folder:"
    echo ""
    ls -Ralph "$steamdir/logs/"

    for f in "$steamdir"/logs/*; do
      if [ -e "$f" ]; then
        echo "######## $f"
        cat "$f"
        echo
      fi
    done

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

    for f in BuildOutput/*.log; do
      echo "######## $f"
      cat "$f"
      echo
    done

    exit 1
  )

echo "manifest=${manifest_path}" >> $GITHUB_OUTPUT
