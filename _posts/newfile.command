#!/usr/bin/env guash

DEST=$(dirname $0)
guash_readtext "ファイルのbasename"
guash_readtext "タイトル"
IFS=$'\n'
RES=($(guash_doquery))
test $? -ne 0 && exit 1

FILENAME="$DEST/"`date +%F`"-${RES[0]}.md"
echo $FILENAME
echo "---" > $FILENAME
echo "title: ${RES[1]}" >> $FILENAME
echo "layout: page" >> $FILENAME
echo "---" >> $FILENAME
