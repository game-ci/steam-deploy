#!/bin/sh

echo ""
echo "#################################"
echo "#    Generating App Manifest    #"
echo "#################################"
echo ""

mkdir BuildOutput

cat << EOF > "manifest.vdf"
"appbuild"
{
  "appid" "$appId"
  "desc" "$buildDescription"
  "buildoutput" "BuildOutput"
  "contentroot" "$(pwd)"
  "setlive" "$releaseBranch"

  "depots"
  {$(echo "$DEPOTS" | sed 's/\\n/\
/g')}
}
EOF

cat manifest.vdf
echo ""
