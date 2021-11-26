#!/bin/sh

echo ""
echo "#################################"
echo "#    Copying SteamGuard Files   #"
echo "#################################"
echo ""

mkdir -p /home/runner/Steam/config
echo "$INPUT_CONFIGVDF" | base64 -d - > /home/runner/Steam/config/config.vdf
echo "$INPUT_SSFNFILECONTENTS" | base64 -d - > "$INPUT_SSFNFILEPATH"

cat /home/runner/Steam/config/config.vdf
ls /home/runner/Steam
cat "$INPUT_SSFNFILEPATH"

echo "Copied SteamGuard Files!"
echo ""
