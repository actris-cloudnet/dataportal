#!/bin/bash

echo $NODE_ENV
if [ "$NODE_ENV" '==' 'production' ]; then
  node build/server.js
else
  npx nodemon --watch 'src/**/*.ts' --ignore 'src/**/*.spec.ts' --exec "npx ts-node -T" src/server.ts
fi
