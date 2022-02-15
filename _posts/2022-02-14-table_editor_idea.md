---
title: マークダウンのテーブルを編集するツールを考える
layout: page
---

[TeFWiki](https://karino2.github.io/RandomThoughts/TeFWiki)ではテーブルを書くのがかったるい。
単なるtextareaなので。

でも検索を実装せずにgrepと[mdvcat](https://karino2.github.io/RandomThoughts/mdvcat)を組み合わせて解決しているように、あまりアプリにそうした機能を組み込みたくはない。
それよりもUnix的に、単体のコマンドで解決したい気はする。
どういう感じのツールがあれば良いだろうか？

コマンドラインツールとしては、標準入力からマークダウンを取り、
それをGUIで編集して、終了したら編集したマークダウンが標準出力に出力されるというのはどうだろう？
そういうツールがあれば、クリップボードの中身を標準入力にするのと、
出力の結果をクリップボードに入れるのはシェルスクリプトで書けば良い。

手頃なjsのライブラリとか無いかなぁ、と少しググった所、[editorjs](https://karino2.github.io/RandomThoughts/editorjs)はなかなかこの目的に良さそうに思う（[テーブルエディタ](https://karino2.github.io/RandomThoughts/テーブルエディタ)にググった時のメモを残した）。
これを[photino](https://karino2.github.io/RandomThoughts/photino)でさっき言った感じにすれば良いのでは無いか？

追記： 実装してみた。

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">出来た風味か？ <a href="https://t.co/gQFQMdMR77">pic.twitter.com/gQFQMdMR77</a></p>&mdash; karino2@平民階級 (@karino2012) <a href="https://twitter.com/karino2012/status/1493062701350002692?ref_src=twsrc%5Etfw">February 14, 2022</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">イメージ通りのものではあるが、便利なのかはまだ良く分からず… <a href="https://t.co/dEMNHGUbKu">pic.twitter.com/dEMNHGUbKu</a></p>&mdash; karino2@平民階級 (@karino2012) <a href="https://twitter.com/karino2012/status/1493066104918638592?ref_src=twsrc%5Etfw">February 14, 2022</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>


さらに追記: リリースした。

[stdin, stdoutを使ったGUIのmdテーブルエディタ、mdvtblをリリース](2022-02-15-mdvtbl_release.md)