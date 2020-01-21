#!/bin/bash

find data/ -maxdepth 5 -mindepth 5 -name "*.nc"|xargs -tn1 scripts/ncdump2node.sh
