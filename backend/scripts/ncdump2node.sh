#!/bin/bash

if [ -z "$1" ]; then
    echo "Need filename as argument"
    exit 1
fi

FILE=$1
ERROUT=${2-/dev/stderr}
STDOUT=${2-/dev/stdout}

FILEBASE=`basename $FILE`
FILEREAL=`realpath $FILE`
IMGPATH="public/quicklook"
if [[ $NODE_ENV == 'test' ]]; then
    IMGPATH="tests/data/public/quicklook"
elif [ -f quicklook-path ]; then
    read -r IMGPATH < quicklook-path
fi

FILEPATH=$IMGPATH/$FILEBASE

if [[ `file --mime-type -b $FILE` == image/*g ]]; then
    rm -f $FILEPATH
    ln -s $FILEREAL $FILEPATH
    exit 0
fi
