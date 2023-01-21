#!/usr/bin/env zsh

./copy_texttl.sh
pushd gen_sidebar; npm run conv; popd
pushd ../_includes; git add --all; git commit -m "update hitokoto"; git push; popd