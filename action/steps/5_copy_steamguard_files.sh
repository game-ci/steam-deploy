#!/bin/sh

echo ""
echo "#################################"
echo "#    Copying SteamGuard Files    #"
echo "#################################"
echo ""

if [ -n "$INPUT_CONFIGVDF" && -n "$INPUT_SSFNFILEPATH" && -n "$INPUT_SSFNFILECONTENTS" ]; then
  mkdir -p /home/runner/Steam/config
  echo "$INPUT_CONFIGVDF" | base64 -d - > /home/runner/Steam/config/config.vdf
  echo "$INPUT_SSFNFILECONTENTS" | base64 -d - > "$INPUT_SSFNFILEPATH"
  echo "Copied SteamGuard Files!"
else
  echo "Not Copying SteamGuard Files!"
fi;

echo ""
