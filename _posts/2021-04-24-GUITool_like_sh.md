---
title: GUIツールをシェルスクリプトのように書けないものか？
layout: page
---
jekyllの草稿のディレクトリのファイルの一覧から対処となるファイルを選んで、それに適当な別名としてTeFWikiのフォルダにハードリンクを貼る、
というGUIツールが欲しい。
Spotlightからぱんと起動して動くようなの。

でも書こうとすると結構かったるい。

これがシェルスクリプトなら、

```
#!/bin/sh

SRC=$(ls -t ~/work/GitHub/karino2.github.io/_posts | percol)
echo "Dest name"
read DEST

ln ~/work/GitHub/karino2.github.io/_posts/${SRC} ~/Google\ ドライブ/DriveText/TeFWiki/${DEST}.md
```

と書ける。

GUIのツールも4行で書けないものか。

```
filter 変数名 それを生み出すコマンド
text 変数名
クエリを実行

結果のスクリプト
```

と書ければいい訳だよな。
普通のGUIアプリ開発だと、フィルタ用のコントロールをどこにおいて、とかいろいろ指定が必要なのと、
シェルスクリプトで書けないのが面倒な訳だ。

シェルスクリプトの所は結構いろいろやりたい、というのが既存のアプリ開発の手法ではだるい所だよな。
ワンライナーで頑張れる範囲くらいでいいのだ。

シェルスクリプトとしてvalidな形で書いて、一方でプログラムが解析してGUIを出す、みたいに出来ないものか？

```
ls -t ~/work/GitHub/karino2.github.io/_posts | filter "Src file" SRC
readtext "Dest name" DEST
doquery

ln ~/work/GitHub/karino2.github.io/_posts/${SRC} ~/Google\ ドライブ/DriveText/TeFWiki/${DEST}.md
```

こういう感じに書けないものか。
前半は、適当なファイルにjsonを出力していくような何かで、doqueryがそれを読んで表示すれば良い気がする。
問題はdoqueryの結果は環境変数に反映されて欲しいので、これは普通のコマンドでは実現出来ない。

どうせ独自のシェルを書くと割り切るなら、doquery以外をもっと普通のコマンドに似せる方が良いか？

```
ls -t ~/work/GitHub/karino2.github.io/_posts | filter "Src file"
readtext "Dest name"
doquery SRC DEST

ln ~/work/GitHub/karino2.github.io/_posts/${SRC} ~/Google\ ドライブ/DriveText/TeFWiki/${DEST}.md
```

環境変数にまつわる所はdoqueryに集約する。filterとかreadtextはpidかなんかで作ったファイルのjsonに書き出していく。

うーん、bashをforkしていじるのはかったるいな。もっとローテクで実現出来ないか？

このファイルを解析して、doqueryの手前と後の２つのシェルスクリプトの実行にするのはどうだろう？

**1. doqueryの手前までを、出力先のファイル名を環境変数として実行する。**

```
SCRIPT_DEST="/tmp/somepidlikefile.json"

ls -t ~/work/GitHub/karino2.github.io/_posts | filter "Src file"
readtext "Dest name"
```

**2. jsonからGUIを読んで実行する**

**3. GUIの結果を環境変数として、残りを実行する**

```
SRC=XXXXX
DEST=XXXXX
ln ~/work/GitHub/karino2.github.io/_posts/${SRC} ~/Google\ ドライブ/DriveText/TeFWiki/${DEST}.md
```

なんかこの位なら作れそうな気がするな。
開発するなら、３つの場所に分けられるか。

1. jsonを吐くシェルのコマンドたち
2. jsonを読んでGUIを実行して結果を返す何か
3. 元のスクリプトを読んで目的のシェルスクリプトを生成したり実行したりするプログラム

1と3は実はGUIに依存しないので好きな言語で作れば良い気がする。
2はElectronで書くのが良い気がするので、そうすると全部nodejsで書くのが楽かもしれない。

名前を暫定的にgshappとつけておき、コマンド名にgsaのプレフィクスをつけると、以下みたいな感じか。

```
#!/usr/bin/gshapp

ls -t ~/work/GitHub/karino2.github.io/_posts | gsa_filter "Src file"
gsa_readtext "Dest name"
gsa_doquery SRC DEST

ln ~/work/GitHub/karino2.github.io/_posts/${SRC} ~/Google\ ドライブ/DriveText/TeFWiki/${DEST}.md
```

これが必要なものな気がするが、作るのはややかったるいなぁ。