#!/bin/sh

export appId=$INPUT_APP_ID
export buildDescription=$INPUT_BUILD_DESCRIPTION
export rootPath=$INPUT_ROOT_PATH
export releaseBranch=$INPUT_RELEASE_BRANCH
export localContentServer=$INPUT_LOCAL_CONTENT_SERVER
export previewEnabled=$INPUT_PREVIEW_ENABLED

i=0;
until [ $i -gt 9 ]; do
  eval "currentInput=\$INPUT_DEPOT${i}_PATH"
  eval "currentDepotPath=depot${i}Path"
  if [ -z "$currentInput" ]; then
    export "$currentDepotPath"="$currentInput"
    echo "$rootPath/$currentDepotPath"
  fi;

  ((i=i+1))
done
