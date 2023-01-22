#!/usr/bin/env zsh

pushd gen_sidebar; npm run conv ~/GoogleDriveMirror/DriveText/TextTL/; popd
git add ../_includes/mysidebar.html; git commit -m "update hitokoto"; git push