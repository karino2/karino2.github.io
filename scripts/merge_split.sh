#!/bin/sh

#usage:
#  ./merge_split.sh ../work_result/ ../work/2019-01-31-115955 

TARGET=`basename $2`.ipynb

cat $2/*.txt > $1/$TARGET