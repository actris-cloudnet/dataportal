#!/bin/zsh

inbox=$1

if [ -z $inbox ]; then
    echo "Inbox dir not specified"
    exit 1
fi

echo "Listening on $inbox"

if [ -x $(which inotifywait) ]; then
    inotifywait -rqme close_write --format '%w%f' $inbox | xargs -tn1 -d '\n' scripts/ncdump2node.sh
elif [ -x $(which fswatch) ]; then
    fswatch --event Created -e '.*' -i '\.nc$' --print0 $inbox  | xargs -0tn1 scripts/ncdump2node.sh
else 
    echo "No suitable watchers found"
    exit 2
fi
