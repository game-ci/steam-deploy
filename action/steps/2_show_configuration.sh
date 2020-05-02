#!/bin/sh

echo ""
echo "#################################"
echo "#          Configuration        #"
echo "#################################"
echo ""
echo "App identifier: $appId"
echo "Build description: $buildDescription"
echo ""

if [ -n "$releaseBranch" ]; then
  echo "Releasing to $releaseBranch"
  echo ""
fi

echo "Looking for files in:"
i=1;
until [ $i -gt 9 ]; do
  eval "currentDepotPath=\$depot${i}Path"
  if [ -n "$currentDepotPath" ]; then
    echo "$rootPath/$currentDepotPath"
  fi;

  i=$((i+1))
done
