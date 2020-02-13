#!/bin/zsh

inbox=$1

if [ -z $inbox ]; then
    echo "Inbox dir not specified"
    exit 1
fi

echo "Listening on $inbox"
fswatch --event Created -e '.*' -i '\.nc$' --print0 $inbox  | xargs -0tn1 scripts/ncdump2node.sh
