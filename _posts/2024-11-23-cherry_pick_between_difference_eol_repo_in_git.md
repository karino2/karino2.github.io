---
title: gitで改行コードが異なるレポジトリ間でチェリーピック的な事をしたい
layout: page
---
ほとんど同じ内容のレポジトリだが大人の事情で両者が分かれていて、共通の祖先も持っていない。
そしてなぜか知らないがレポジトリ内部のコードが片方はlf、もう片方はcrlfになってしまっている（sucks!）

こういうときにcherry pickすると全行がconflictになってしまって面倒な事になる。
autocrlfや.gitattributesは基本的にはレポジトリ内部をlfで統一する前提になっているので、こういうケースはうまくハンドル出来ない、という理解でいる（間違っていたら誰か教えて）。

こういう時に、cherry pick的な事をやるシェルスクリプトを作りたい。

とりあえず、lfのレポジトリで作業して、それをcrlfのレポジトリに持っていく事を考える。両者をそれぞれrepo-lf、repo-crlfと呼ぶ事にする。

### 基本方針

パッチファイルを生成し、それをunix2dosでcrlfにしてamする。

1. git format-patchでrepo-lfからパッチファイルを作る
2. パッチファイルをunix2dosでcrlfにする
3. `git am < ファイル名` でapplyする

これでなんとなく動いた。format-patchはどうも出力ファイル名が指定出来ないらしい（Copilotさんが言ってた）ので、
適当にmvしたりするシェルスクリプトを作る。

### cherry picked from commitメッセージを追加する

subjectのsuffixになにか追加する方法は無いようなので、awkで適当に追加する。

```
#!/bin/sh

git format-patch -1 $1
mv 0001*.patch mytemp.patch
awk -v hash=$1 '/^---$/ && !found {print "\n(cherry picked from commit " hash ")"; fount=1} 1' mytemp.patch > mytemp2.patch
mv mytemp2.patch mytemp.patch
unix2dos mytemp.patch
git am < mytemp.patch
rm mytemp.patch
```