#!/bin/sh

if [ -n "$INPUT_STEAM_CONFIG_VDF" && -n "$INPUT_STEAM_SSFN_FILE_NAME" && -n "$INPUT_STEAM_SSFN_FILE_CONTENTS" ]; then
  echo ""
  echo "#################################"
  echo "#    Copying SteamGuard Files    #"
  echo "#################################"
  echo ""
  
  mkdir -p /home/runner/Steam/config
  echo "$INPUT_STEAM_CONFIG_VDF" | base64 -d - > /home/runner/Steam/config/config.vdf
  echo "$INPUT_STEAM_SSFN_FILE_CONTENTS" | base64 -d - > "/home/runner/Steam/$INPUT_STEAM_SSFN_FILE_NAME"
  
  echo "Copied SteamGuard Files!"
  echo ""
fi;
