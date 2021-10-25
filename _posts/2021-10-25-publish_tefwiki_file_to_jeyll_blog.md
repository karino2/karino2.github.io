---
title: TeFWikiのファイルをjekyllのブログとして公開するguashスクリプト
layout: page
---
出先ではTeFWikiでちょこちょこ書いて、家に帰ってきてからgithub pagesで公開したい、という事がちょっとある。
こういう場合、一度公開されたらもうTeFWikiから書ける必要は感じないので、
適当にヘッダを追加して、日付をつけたファイルを作ってTeFWiki側のファイルは削除してしまって良い。
こういう一時的なファイルを作るのにもTeFWikiは手頃で良い。

最近はGoogle Driveが変わってハードリンクを貼っておいたファイルをスマホ側から更新するとハードリンクを切った新しいファイルにしてしまうようにもなったので、
今後はブログの記事をTeFWikiで書きたい時は、ブログのタイトルをWikiNameにしたページとして作っておいて、
スクリプトでこのファイルを元にブログのファイルを作って公開する運用にしてみよう。

必要な事は以下か。

1. TeFWikiのファイル一覧から目的のファイルを選ぶ
2. jekyllのファイルのベースネームを入力
3. 1のパスのbasenameをタイトルにヘッダと1の中身をつなげたものを、2のベースネーム+日付のファイル名のパスに生成
4. 1のファイルを削除

という事で入力は1と2の２つだから[RandomThoughts/guash](https://karino2.github.io/RandomThoughts/guash)のスクリプトで良さそう。

という事で書いてみたらこんな感じになった。

```
#!/usr/bin/env guash

ls -t ~/GoogleDriveMirror/DriveText/TeFWiki/*.md | guash_filter "Src file"
guash_readtext "Dest base name"
RES=($(guash_doquery))

FILENAME="$HOME/work/GitHub/karino2.github.io/_posts/$(date +%F)-${RES[1]}.md"
TITLE=`basename -s .md ${RES[0]}`

echo "---" > $FILENAME
echo "title: $TITLE" >> $FILENAME
echo "layout: page" >> $FILENAME
echo "---" >> $FILENAME
echo "" >> $FILENAME
cat ${RES[0]} >> $FILENAME

rm ${RES[0]}
```

うむうむ、やはりguashはこういうの手軽に書けていいな。

guash、githubにコードはあるので自分でビルドすれば使えるのだけれど、
一般向けにちゃんとバイナリをリリースしたい気もするなぁ。
細々とした仕上げをさぼっているので自分だけ使えればいいや状態なのだが。