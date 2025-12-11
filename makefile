releasePath = ./release
distPath = $(releasePath)/dist

build:
	make clean && make win && make mac

build-test:
	make clean && make win-test && make mac-test

win:
	yarn build-win && make copyWin

mac:
	yarn build && make copyMac

win-test:
	yarn build-win-test && make copyWin

mac-test:
	yarn build-test && make copyMac

copyWin:
	make create_dist && cp -R $(releasePath)/SugarTalk*_*.exe $(distPath)

copyMac:
	make create_dist && cp -R $(releasePath)/SugarTalk*_*.dmg $(distPath)

clean:
	rm -rf $(releasePath)/*

create_dist:
	if [ ! -d "$(distPath)" ]; then mkdir $(distPath); fi