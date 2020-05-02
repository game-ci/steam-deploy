#!/bin/sh

echo ""
echo "#################################"
echo "#        Uploading build        #"
echo "#################################"
echo ""

"$STEAMCMDDIR/steamcmd.sh" \
  +login "$INPUT_USERNAME" "$INPUT_PASSWORD" \
  +run_app_build_http \
  +api_logging verbose \
  +log_ipc verbose \
  +quit ||
  cat /github/home/Steam/logs/stderr.txt &&
  ls -Ralph ContentRoot &&
  ls -Ralph BuildOutput
