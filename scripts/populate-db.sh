#!/bin/bash
N_PROCS=${1:-1}
FILES=$(find data/ -maxdepth 5 -mindepth 5 -name "*.nc")
N_FILES=$(printf "%s\n" "${FILES[@]}" | wc -l)

printf "%s\n" "${FILES[@]}" | xargs -I {} -tn1 -P$N_PROCS scripts/ncdump2node.sh {} /dev/null 2>&1 | awk '{printf "%d/%d\r",NR,'$N_FILES'}'
echo
