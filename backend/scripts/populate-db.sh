#!/bin/bash
INDIR=${1:-"data/"}
N_PROCS=${2:-1}
FILES=$(find $INDIR -maxdepth 5 -mindepth 5 -name "*.nc" | sort)
N_FILES=$(printf "%s\n" "${FILES[@]}" | wc -l)

printf "%s\n" "${FILES[@]}" \
    | xargs -I {} -tn1 -P$N_PROCS scripts/ncdump2node.sh {} /dev/null 2>&1 \
    | xargs -n1 -I% psql dataportal -tAc 'select count(*) from file' \
    | awk '{printf "%d/%d\t\t%d\r",NR,'$N_FILES',$1}'
echo
