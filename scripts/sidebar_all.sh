#!/usr/bin/env zsh

pushd gen_sidebar; npm run conv ~/work/syncthing_dirs/TextTL/; popd
git pull; git add ../_includes/mysidebar.html; git commit -m "update hitokoto"; git push
