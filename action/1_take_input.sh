#!/bin/sh

export steamUsername=$INPUT_USERNAME
export steamPassword=$INPUT_PASSWORD

export configVdf=$INPUT_CONFIGVDF
export ssfnFileName=$INPUT_SSFNFILENAME
export ssfnFileContents=$INPUT_SSFNFILECONTENTS

export appId=$INPUT_APPID
export buildDescription=$INPUT_BUILDDESCRIPTION
export rootPath=$INPUT_ROOTPATH
export releaseBranch=$INPUT_RELEASEBRANCH

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
