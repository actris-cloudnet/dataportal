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

FILEPATH=$IMGPATH/$FILEBASE

if [[ `file --mime-type -b $FILE` == image/*g ]]; then
    rm -f $FILEPATH
    ln -s $FILEREAL $FILEPATH
    exit 0
fi

ncdump -xh $FILE | node build/metadata2db.js >> $STDOUT 2>> $ERROUT
