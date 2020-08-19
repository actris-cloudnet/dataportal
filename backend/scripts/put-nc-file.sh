#!/bin/bash

dump=$(ncdump -xh $1)
uuid=$(echo "$dump"|grep file_uuid|cut -f4 -d'"')
echo -n "$(basename $1) "
curl -X PUT http://localhost:3000/files/$uuid \
    -H "Content-Type: application/xml" \
    --data "$dump"
echo
