#!/bin/bash

fswatch --event Created -e '.*' -i '\.nc$' --print0 inbox | xargs -0tn1 scripts/ncdump2node.sh
