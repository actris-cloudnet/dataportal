#!/bin/zsh

inbox=$1
if [ -z $inbox ]; then
    echo "Inbox dir not specified"
    exit 1
fi

fswatch --event Created -e '.*' -i '\.nc$' --print0 $inbox | awk 'length($1) > 1 { print $1 }' | xargs -0tn1 scripts/ncdump2node.sh
