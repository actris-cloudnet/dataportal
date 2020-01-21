#!/bin/bash

file=$1

ncdump -xh $file | node build/metadata2db.js
