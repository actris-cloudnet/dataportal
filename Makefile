.PHONY: purge clean install

current_dir = $(shell pwd)

createdb:
	createdb dataportal

install:
	npm install
	$(current_dir)/node_modules/typeorm/cli.js schema:sync
	tsc --build tsconfig.json

purge: 
	-dropdb dataportal
	-rm -r build
	-rm -r node_modules

clean:
	$(current_dir)/node_modules/typeorm/cli.js schema:drop
	$(current_dir)/node_modules/typeorm/cli.js schema:sync

start:
	( \
		scripts/listen-inbox.sh & \
		echo $! > .listen-inbox.pid \
	)
	npm start
