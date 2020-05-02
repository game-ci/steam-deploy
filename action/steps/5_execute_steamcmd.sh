#!/bin/sh

"$STEAMCMDDIR/steamcmd.sh" \
  +login "$INPUT_USERNAME" "$INPUT_PASSWORD" \
  +run_app_build_http \
  +api_logging verbose \
  +log_ipc verbose \
  +quit ||
  ls -Ralph ./
