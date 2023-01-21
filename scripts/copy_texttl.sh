#!/usr/bin/env zsh

SCRIPTS_DIR=$(dirname $0)
DEST="${SCRIPTS_DIR}/../TextTL"

# rm $DEST/*
cp -r ~/GoogleDriveMirror/DriveText/TextTL/ $DEST/
