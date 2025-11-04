#!/usr/bin/env zsh

pushd gen_sidebar; npm run conv $1/TextTL/; popd
git pull; git add ../_includes/mysidebar.html; git commit -m "update hitokoto"; git push
