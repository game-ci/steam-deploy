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
  +login "$INPUT_USERNAME" "$INPUT_PASSWORD" "$INPUT_MFACODE" \
  +run_app_build_http $(pwd)/manifest.vdf \
  +api_logging verbose \
  +log_ipc verbose \
  +quit || (
    echo "#################################"
    echo "#        Current status         #"
    echo "#################################"
    echo ""
    echo "Show the current state of the app on this client."
    sleep 1.0e-2
    "$STEAMCMDDIR/steamcmd.sh +app_status $appId"
    echo ""
    echo "Show the current Steamworks configuration for this game (depots, launch options, etc.). $appId"
    sleep 1.0e-2
    "$STEAMCMDDIR/steamcmd.sh +app_info_print manifest.vdf"
    echo ""
    echo "Show the current user configuration for this game (current language, install directory, etc.)"
    sleep 1.0e-2
    "$STEAMCMDDIR/steamcmd.sh +app_config_print $appId"
    echo ""
    echo "#################################"
    echo "#             Errors            #"
    echo "#################################"
    echo ""
    echo "Listing current folder and rootpath"
    echo ""
    ls -alh
    echo ""
    ls -alh $rootPath
    echo ""
    echo "Listing logs folder:"
    echo ""
    ls -Ralph /github/home/Steam/logs/
    echo ""
    echo "Displaying error log"
    echo ""
    cat /github/home/Steam/logs/stderr.txt
    echo ""
    echo "Displaying bootstrapper log"
    echo ""
    cat /github/home/Steam/logs/bootstrap_log.txt
    echo ""
    echo "#################################"
    echo "#             Output            #"
    echo "#################################"
    echo ""
    ls -Ralph BuildOutput
    exit 1
  )
