#!/bin/sh

echo ""
echo "#################################"
echo "#    Generating App Manifest    #"
echo "#################################"
echo ""

cat << EOF > "manifest.vdf"
"appbuild"
{
  "appid" "$appId"
  "desc" "$buildDescription"
  "buildoutput" "BuildOutput"
  "contentroot" "ContentRoot"
  "setlive" "$releaseBranch"
  "preview" "$previewEnabled"
  "local" "$localContentServer"

  "depots"
  {$DEPOTS}
}
EOF
