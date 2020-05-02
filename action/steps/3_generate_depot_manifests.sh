#!/bin/sh

echo ""
echo "#################################"
echo "#   Generating Depot Manifests  #"
echo "#################################"
echo ""

mkdir BuildOutput
mkdir ContentRoot

export DEPOTS="\n"
i=0;
until [ $i -gt 9 ]; do
  eval "currentDepotPath=\$depot${i}Path"
  if [ -z "${currentDepotPath}" ]; then
    currentDepot=$((appId+i))
    echo "adding depot$currentDepot.vdf"
    export DEPOTS="$DEPOTS		\"$currentDepot\" \"depot$currentDepot.vdf\"\n"
    cat << EOF > "depot$currentDepot.vdf"
"DepotBuildConfig"
{
	"DepotID" "$currentDepot"
	"ContentRoot"	"$(pwd)"
  "FileMapping"
  {
    "LocalPath" "$rootPath/$currentDepotPath"
    "DepotPath" "."
    "recursive" "1"
  }
  "FileExclusion" "*.pdb"
}
EOF
  fi;

  i=$((i+1))
done
