#!/usr/bin/env bash

RESULT="$(gnewblog)" || exit

BASESYM="${RESULT%%$'\n'*}"
REST="${RESULT#*$'\n'}"

TITLE="${REST%%$'\n'*}"
CONTENT="${REST#*$'\n'}"

DEST=$(dirname $0)

FILENAME="$DEST/"`date +%F`"-$BASESYM.md"
echo $FILENAME
echo "---" > $FILENAME
echo "title: $TITLE" >> $FILENAME
echo "layout: page" >> $FILENAME
echo "---" >> $FILENAME
echo "" >> $FILENAME
printf '%s\n' "$CONTENT" >> $FILENAME