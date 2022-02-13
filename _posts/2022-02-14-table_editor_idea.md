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