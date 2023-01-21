#!/usr/bin/env zsh

pushd gen_sidebar; npm run conv ~/GoogleDriveMirror/DriveText/TextTL/; popd
pushd ../_includes; git add --all; git commit -m "update hitokoto"; git push; popd