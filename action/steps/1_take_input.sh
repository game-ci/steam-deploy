#!/bin/sh

export appId=$INPUT_APPID
export buildDescription=$INPUT_BUILDDESCRIPTION
export rootPath=$INPUT_ROOTPATH
export releaseBranch=$INPUT_RELEASEBRANCH
export localContentServer=$INPUT_LOCALCONTENTSERVER
export previewEnabled=$INPUT_PREVIEWENABLED

i=0;
until [ $i -gt 9 ]; do
  eval "currentInput=\$INPUT_DEPOT${i}PATH"
  eval "currentDepotPath=depot${i}Path"
  if [ -z "$currentInput" ]; then
    export "$currentDepotPath"="$currentInput"
    echo "$rootPath/$currentDepotPath"
  fi;

  i=$((i+1))
done
