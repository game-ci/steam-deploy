#!/bin/sh

echo ""
echo "#################################"
echo "#   Generating Depot Manifests  #"
echo "#################################"
echo ""

mkdir BuildOutput
mkdir ContentRoot

i=1;
export DEPOTS="\n"
until [ $i -gt 9 ]; do
  eval "currentDepotPath=\$depot${i}Path"
  echo "current: $currentDepotPath"
  if [ -n "$currentDepotPath" ]; then
    currentDepot=$((appId+i))
    echo ""
    echo "Adding depot${currentDepot}.vdf ..."
    echo ""
    export DEPOTS="$DEPOTS  \"$currentDepot\" \"depot${currentDepot}.vdf\"\n"
    cat << EOF > "depot${currentDepot}.vdf"
"DepotBuildConfig"
{
  "DepotID" "$currentDepot"
  "ContentRoot" "$(pwd)/$rootPath"
  "FileMapping"
  {
    "LocalPath" "$currentDepotPath"
    "DepotPath" "."
    "recursive" "1"
  }
  "FileExclusion" "*.pdb"
}
EOF
  fi;

  cat depot${currentDepot}.vdf
  echo ""

  i=$((i+1))
done
