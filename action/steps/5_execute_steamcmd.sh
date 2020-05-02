#!/bin/sh

# Debugging urls:
# https://partner.steamgames.com/doc/sdk/uploading#Troubleshooting_SteamPipe
# https://partner.steamgames.com/doc/sdk/uploading#Debugging_Build_Issues
#
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
  +quit || (
    echo ""
    echo "#################################"
    echo "#        Current status         #"
    echo "#################################"
    echo ""
    echo "Show the current state of the app on this client."
    "$STEAMCMDDIR/steamcmd.sh app_status $appId"
    echo ""
    echo "Show the current Steamworks configuration for this game (depots, launch options, etc.). $appId"
    "$STEAMCMDDIR/steamcmd.sh app_info_print $appId"
    echo ""
    echo "Show the current user configuration for this game (current language, install directory, etc.)"
    "$STEAMCMDDIR/steamcmd.sh app_config_print $appId"
    echo ""
    echo "#################################"
    echo "#             Errors            #"
    echo "#################################"
    echo ""
    echo "home = $HOME"
    echo ""
    echo "Listing logs folder:"
    echo ""
    ls -Ralph /github/home/Steam/logs/
    echo ""
    echo "Listing error log"
    echo ""
    cat /github/home/Steam/logs/stderr.txt
    echo ""
    echo "#################################"
    echo "#             Output            #"
    echo "#################################"
    echo ""
    ls -Ralph ContentRoot
    ls -Ralph BuildOutput
    exit 1
  )
