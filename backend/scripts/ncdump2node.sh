#!/bin/bash

if [ -z "$1" ]; then
    echo "Need filename as argument"
    exit 1
fi

FILE=$1
ERROUT=${2-/dev/stderr}
STDOUT=${2-/dev/stdout}

ncdump -xh $FILE | node build/metadata2db.js >> $STDOUT 2>> $ERROUT
