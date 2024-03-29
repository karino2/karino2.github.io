---
title: mdvtblをリリース ー GUIのmdテーブルエディタ、stdin, stdoutでやりとり
layout: page
---
テキストエリアなどでクリップボードを介してGFMのマークダウンのテーブルを編集するツール、mdvtblをリリースしました。
バイナリはMacのみ。dotnet coreなのでビルドをすればたいていの環境で動くと思う。

以下のデモ画像を見るとどういうアプリかは分かると思う。

![demo animation of gif](https://github.com/karino2/mdvtbl/raw/master/screenshot/mdvtbl_demo.gif)

インストール方法はhomebrewのtapでインストール出来ます。

具体的な方法と付随するシェルスクリプト例はgithubを見てください。

- [github: mdvtbl](https://github.com/karino2/mdvtbl)

## コンセプト、stdinとstdoutを使ったGUIツール

マークダウンでノートを取るツールは世の中にたくさんあり、テーブル周辺の出来はサービスやアプリによってかなり違う。
そしてこれらのモジュールはサービスに埋め込まれてしまっている。
例えばNotionのテーブル編集はとても良く出来ていると思うのだけれど、これをGithubのWikiで使おうと思っても使えません。

WYSIWYGのテーブル編集の出来が微妙だったり、そもそもそういうものが無いマークダウン系のサービスで使えるようなテーブル編集専用の小物アプリを作ろうとしたのがmdvtblになります。

仕様としては、標準入力からマークダウンを読み込みGUIを表示し、編集が終わってDoneボタンが押されたら編集結果を標準出力に吐く、というものです。
非常にUnix的なインターフェースと思うのですがどうでしょう？

これをシェルスクリプトでクリップボードから読み込んで結果をクリップボードに戻すようにして、
これをSpotlightから実行すれば、
ブラウザのテキストエリアや好きなエディタで使う事が出来る、という訳です。

いわば poorman's プラグイン！

使ってみると結構いい感じに思える。

## 関連ページ

- [マークダウンのテーブルを編集するツールを考える - なーんだ、ただの水たまりじゃないか](https://karino2.github.io/2022/02/14/table_editor_idea.html)
- [mdvtbl - RandomThoughts](https://karino2.github.io/RandomThoughts/mdvtbl)