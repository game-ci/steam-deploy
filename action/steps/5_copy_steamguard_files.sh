#!/bin/sh

echo ""
echo "#################################"
echo "#    Copying SteamGuard Files   #"
echo "#################################"
echo ""

mkdir -p /github/home/Steam/config
echo "$INPUT_CONFIGVDF" > /github/home/Steam/config/config.vdf
echo "$INPUT_SSFNFILECONTENTS" | base64 -d - > "/github/home/Steam/$INPUT_SSFNFILENAME"

chmod 777 /github/home/Steam/config/config.vdf
chmod 777 "/github/home/Steam/$INPUT_SSFNFILENAME"

cat /github/home/Steam/config/config.vdf
echo ""
ls -al /github/home/Steam
echo ""
cat "/github/home/Steam/$INPUT_SSFNFILENAME"
echo ""

echo "Copied SteamGuard Files!"
echo ""
