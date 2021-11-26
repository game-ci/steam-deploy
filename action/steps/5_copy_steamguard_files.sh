#!/bin/sh

echo ""
echo "#################################"
echo "#    Copying SteamGuard Files    #"
echo "#################################"
echo ""

if [ -n "$INPUT_STEAMCONFIGVDF" && -n "$INPUT_STEAMSSFNFILENAME" && -n "$INPUT_STEAMSSFNFILECONTENTS" ]; then
  mkdir -p /home/runner/Steam/config
  echo "$INPUT_STEAMCONFIGVDF" | base64 -d - > /home/runner/Steam/config/config.vdf
  echo "$INPUT_STEAMSSFNFILECONTENTS" | base64 -d - > "/home/runner/Steam/$INPUT_STEAMSSFNFILENAME"
  echo "Copied SteamGuard Files!"
  echo ""
else
  echo "Not Copying SteamGuard Files!"
fi;
