#!/usr/bin/env bash

DEST=$(dirname $0)
export GUASH_DIR=$(mktemp -d)
guash_readtext "ファイルのbasename"
guash_readtext "タイトル"
RES=($(guash_doquery -d))

FILENAME="$DEST/"`date +%F`"-${RES[0]}.md"
echo $FILENAME
echo "---" > $FILENAME
echo "title: ${RES[1]}" >> $FILENAME
echo "layout: page" >> $FILENAME
echo "---" >> $FILENAME
