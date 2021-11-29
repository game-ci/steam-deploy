#!/bin/sh

echo ""
echo "#################################"
echo "#    Copying SteamGuard Files   #"
echo "#################################"
echo ""

mkdir -p /home/runner/Steam/config

if [ -n "$configVdf" ]; then
  echo "Copying /home/runner/Steam/config/config.vdf..."
  echo "$configVdf" > /home/runner/Steam/config/config.vdf
  chmod 777 /home/runner/Steam/config/config.vdf
fi;

if [ -n "$ssfnFileName" ]; then
  echo "Copying /home/runner/Steam/ssfn..."
  echo "$ssfnFileContents" | base64 -d - > "/home/runner/Steam/$ssfnFileName"
  chmod 777 "/home/runner/Steam/$ssfnFileName"
fi;

echo "Finished Copying SteamGuard Files!"
echo ""

echo ""
echo "#################################"
echo "#        Uploading build        #"
echo "#################################"
echo ""

echo "$steamExecutable"
"$steamExecutable" +login "$username" "$password" "$mfaCode" +run_app_build $(pwd)/manifest.vdf +quit
echo ""
