#!/bin/sh

export appId=$INPUT_APPID
export buildDescription=$INPUT_BUILDDESCRIPTION
export rootPath=$INPUT_ROOTPATH
export releaseBranch=$INPUT_RELEASEBRANCH
export localContentServer=$INPUT_LOCALCONTENTSERVER
export previewEnabled=$INPUT_PREVIEWENABLED

i=1;
until [ $i -gt 9 ]; do
  eval "currentInput=\$INPUT_DEPOT${i}PATH"
  eval "currentDepotPath=depot${i}Path"
  if [ -n "$currentInput" ]; then
    export "$currentDepotPath"="$currentInput"
    echo "$rootPath/$currentDepotPath"
  fi;

  i=$((i+1))
done
