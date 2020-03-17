#!/bin/sh

if [ $# = 0 ]; then
   echo "Usage: ./newfile.sh FILE_BASE_NAME";
   exit 1;
fi

FILENAME=`date +%F`"-$1.md"
echo "---" > $FILENAME
echo "title: New Title" >> $FILENAME
echo "layout: page" >> $FILENAME
echo "---" >> $FILENAME
