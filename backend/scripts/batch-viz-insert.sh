#!/bin/zsh

for file in $(find $1 -name "*.png"); do
    real=$(realpath $file)
    base=$(basename $file)
    echo -n "$base "
    nc=$(echo $base | gawk -F_ '{ print $1"_"$2"_"$3 }').nc
    varid=${$(echo $base | gawk -F_ '{ s = ""; for (i = 3; i <= NF; i++) s = s $i "-"; print s }')%.png-}
    uuid=$(psql dataportal -Atc"select uuid from file where filename = '$nc'")
    if [ -z $uuid ]; then
        echo "Skip"
        continue
    fi
    curl -X PUT "http://localhost:3000/visualizations/$base" \
        -H "Content-Type: application/json" \
        -d '{"fullPath":"'$real'","sourceFileId":"'$uuid'","variableHumanReadableName":"test","variableId": "'$varid'"}'
    echo
done
