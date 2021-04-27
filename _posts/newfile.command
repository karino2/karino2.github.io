#!/usr/bin/env guash

DEST=$(dirname $0)
guash_readtext "ファイルのbasename"
guash_readtext "タイトル"
RES=($(guash_doquery))

FILENAME="$DEST/"`date +%F`"-${RES[0]}.md"
echo $FILENAME
echo "---" > $FILENAME
echo "title: ${RES[1]}" >> $FILENAME
echo "layout: page" >> $FILENAME
echo "---" >> $FILENAME
