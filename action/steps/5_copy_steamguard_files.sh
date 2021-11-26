#!/bin/sh

echo ""
echo "#################################"
echo "#    Copying SteamGuard Files   #"
echo "#################################"
echo ""

mkdir -p /home/runner/Steam/config
echo "$INPUT_CONFIGVDF" > /home/runner/Steam/config/config.vdf
echo "$INPUT_SSFNFILECONTENTS" | base64 -d - > "$INPUT_SSFNFILEPATH"

chmod 777 /home/runner/Steam/config/config.vdf
chmod 777 "$INPUT_SSFNFILEPATH"

cat /home/runner/Steam/config/config.vdf
echo ""
ls -al /home/runner/Steam
echo ""
cat "$INPUT_SSFNFILEPATH"
echo ""

echo "Copied SteamGuard Files!"
echo ""
