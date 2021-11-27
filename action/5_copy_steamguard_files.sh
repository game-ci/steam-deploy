#!/bin/sh

echo ""
echo "#################################"
echo "#    Copying SteamGuard Files   #"
echo "#################################"
echo ""

mkdir -p /home/runner/Steam/config
echo "$configVdf" > /home/runner/Steam/config/config.vdf
echo "$ssfnFileContents" | base64 -d - > "/home/runner/Steam/$ssfnFileName"

chmod 777 /home/runner/Steam/config/config.vdf
chmod 777 "/home/runner/Steam/$ssfnFileName"

echo "Copied SteamGuard Files!"
echo ""
