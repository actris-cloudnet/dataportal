#!/bin/bash
INDIR=${1:-"data/"}
N_PROCS=${2:-1}
FILES=$(find $INDIR -name "*.nc" | sort)
N_FILES=$(printf "%s\n" "${FILES[@]}" | wc -l)

echo "PUTting $N_FILES files..."
printf "%s\n" "${FILES[@]}" \
    | xargs -n1 -P$N_PROCS scripts/put-nc-file.sh
