.PHONY: purge clean install

current_dir = $(shell pwd)

createdb:
	createdb dataportal
	createdb dataportal-test

install:
	npm install
	npx typeorm schema:sync
	tsc --build tsconfig.json

purge: 
	-dropdb dataportal
	-dropdb dataportal-test
	-rm -r build
	-rm -r node_modules

clean:
	npx typeorm schema:drop
	npx typeorm schema:sync

start:
	( \
		scripts/listen-inbox.sh & \
		echo $! > .listen-inbox.pid \
	)
	npm start
