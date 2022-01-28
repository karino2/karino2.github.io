---
title: Re：Google DriveとVS Codeでノートをとる話
layout: page
---
[Google DriveとVS Codeでノートをとる話 - odiak.net](https://odiak.net/note-taking-with-vscode) の話は私の環境にかなり似ていますね。

## TeFWikiとサブWikiの公開

自分は[TeFWiki](https://karino2.github.io/RandomThoughts/TeFWiki)というElectron製自作のローカルWikiアプリを使っていて、そこに[サブWiki](https://karino2.github.io/RandomThoughts/サブWiki)というちょっとした独自拡張（サブフォルダ対応）を入れていて、TeFWikiのデータ自体はプレインなmd+WikiLinkというテキストファイルをGoogle Driveに置いています。
また[いつなに](https://karino2.github.io/RandomThoughts/いつなに)などもこのマークダウンファイルの一つに直接結果を追記していっている。

Electronはだいたい満足しているのだけれど、複数ウィンドウとかが無いのでたまに複数のサブWikiを同時にみたい時にちょっと不便だなぁ、とは思っています。

VS Codeの拡張は、なかなか良いかもしれないけれど、バグが出た時とか機能追加したい時とかにちょっといじるのが面倒そうだなぁ、という気はするけれど、
その辺のメンテナンスの楽さはどうですかね？

VS Codeの拡張の方が他人が試すには楽な気もするし、編集環境もVS Codeに紐付いている方が良い気もする。

## ブログの草稿と公開のスクリプト

サブWikiをそのまま公開するのとは別に、このブログは通常のjekyllで書いてきたが、その草稿はTeFWikiに置くことが多くなった。

自分はブログの草稿も普通にTeFWikiの[RandomThoughts](https://karino2.github.io/RandomThoughts/Home)に置いて公開していて、
書き上がったら公開用スクリプトでヘッダを足しつつjekyllのフォルダに移動しています。
この時ついでにWikiLinkもRandomThoughtsの外部URLに置き換えている（からブログの草稿でWikiLinkが使える）。

この手の公開するファイルを選んでスクリプト処理をするには[guash](https://karino2.github.io/RandomThoughts/guash)を使っていて、以下みたいなスクリプトになっている

```
#!/usr/bin/env guash

ls -t /PATH/TO/GOOGLEDRIVE/TeFWiki/RandomThoughts/*.md | guash_filter "Src file"
guash_readtext "Dest base name"
RES=($(guash_doquery))
test $? -ne 0 && exit 1

FILENAME="/PATH/TO/JEKYLL/karino2.github.io/_posts/$(date +%F)-${RES[1]}.md"
TITLE=`basename -s .md ${RES[0]}`

echo "---" > $FILENAME
echo "title: $TITLE" >> $FILENAME
echo "layout: page" >> $FILENAME
echo "---" >> $FILENAME
echo "" >> $FILENAME
cat ${RES[0]} >> $FILENAME

~/bin/extract_wikilink.sh $FILENAME

rm ${RES[0]}
```

これでspotlightでぱんとコマンドを実行してリストからファイルを選んでSubmitって押すだけです。なかなか便利。

TeFWiki側ではファイルが消えるのでデッドリンクになるけれど。

guashはhomebrewで公開したいなぁ。

## 独自拡張のちょっとした差異

たとえば自分はwikilinkで書いた名前は、最後に自動で`.md`を付加して扱っている。
この辺は人によって微妙に扱いが違いますよねぇ。

サブWikiもローカルのWikiを作るならこの仕様の方が自然と思うが、自分独自の仕様になっているし。

こうしたちょっとした差異ごとに別のツールを作るのもなんか無駄だなぁ、と思うのだけど、
なんかこうした差異を自分で好きにいじれる感じの、ばらしたパーツとしてローカルWikiのシステムを作れないものかなぁ。