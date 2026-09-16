---
title: Rhinocsエディタ、Android用キーボード専用、を作った
layout: page
---
Rhinocsというエディタを作った。いろいろ解説動画を作ったのでそこへのリンクも含めて説明していく。

<img src="https://raw.githubusercontent.com/karino2/Rhinocs/main/rhinocs_icon_original.png" width="256" alt="Rhinocs icon">

アイコンはきみどりさん([@kani_beam__](https://x.com/kani_beam__))）に描いてもらいました！

## Rhinocsとは何か

[Rhino](https://github.com/mozilla/rhino/tree/master)というJSインタプリタをバックエンドにした、
キーボードを前提としたAndroid用エディタを作った。
キー入力は直接ハンドリングして、日本語入力も自前のSKKを使うようにしている。

[Rhinocs、Android用キーボード必須のエディタの紹介 -YouTube](https://youtu.be/7kJEAiL9vds?si=kCMG4TPdPCHjkR5n)

Emacsのようなものが欲しかったのだが、より日本語の文章入力に特化し、ActivityのリサイクルやSAFといったAndroid的な要素を重視して作ってある。
細かい事は以下の動画を参照のこと。

[Emacsとの比較で見るRhinocs - YouTube](https://youtu.be/EMbBkcpVTOo)

### コンセプト: AndroidにBluetoothのキーボードをつけて快適に日本語入力をしたい、

AndroidにBluetoothキーボードをつなげて日本語入力をしたいと思ったのだが、
既存の環境は、日本語入力周りの挙動が軽快さにかけて中途半端にタッチに反応したりもして、
全く快適に入力出来なかった。

IMEから全て自分でハンドリングするエディタが欲しかったので作った。

日本語入力はjmukが以前ChromeOS用に作ったものを持ってきて修正して使っています。
詳細を知りたければ以下の動画をどうぞ。

[RhinocsのSKK - YouTube](https://youtu.be/oGteMCvtBdA)

## インストールとセットアップ

インストールはapkをダウンロードして実行する形で行います。
セットアップとしてRhinocsで使うJSパッケージを端末の適当な場所に置いて、そこに読み書きの権限を与える必要があります。

[Rhinocsのインストールとセットアップ方法 - YouTube](https://www.youtube.com/watch?v=vTVCbSpzEfI)

以下のリリースページからapkとRhinocsJS.zipをダウンロードしてセットアップします。

- [GitHub: Rhinocs][https://github.com/karino2/Rhinocs] apkはこちら
- [GitHub: RhinocsJSPackage](https://github.com/karino2/RhinocsJSPackage) JSパッケージ(RhinocsJS.zip)はこちらから

## SAFベースのファイル入出力

セットアップが終われば、だいたいはEmacsのつもりで触っていればどう使うかは分かると思いますが、ファイル周りだけは少し特殊なので、
最初に動画を見ておくと良いと思います。

- [RhinocsのファイラーとSAF](https://www.youtube.com/watch?v=XHvv5OJi8Kk) 理論的な解説
- [Rhinocsのファイラーのデモ - YouTube](https://www.youtube.com/watch?v=AoRf0oSFea4) 実際の挙動のデモ

## 実際に使っての雑感

[BOOX](https://karino2.github.io/RandomThoughts/BOOX)にiCleverの折りたたみキーボード（[amazon: iClever 折りたたみ Bluetooth キーボード IC-BK06](https://amzn.to/4dsOyrn)）をつなげて使っているが、日本語の文章を入力する環境としてはかなり完成していると思っている。

BlogやパーソナルWikiなどファイル名などに細かな決まりのあるものはJavaScriptで拡張して対応していけて、十分に快適な文書作成環境になっている。
結構長い文章も書いているが、文章の執筆環境としてはもう不満は無い。
キーボードから手を離さずに画面タッチをしなくて良いのは文章を書く事に没頭出来て昔のワープロのような良さがあるし、
キーボードの入力からのレスポンスの早さやSKKの間に挟まるものが無い感覚は、
ずっと文章を書いていたくなるような爽快感がある。

一方、ブラウザなどでいろいろ見つつリンクを貼っていく、みたいな風に、アプリを行ったり来たりする用途では快適さはだいぶ損なわれてしまうなぁ、とも思っている。これは没入感とのトレードオフなので一長一短ではあるけれど、
PCで向いているものはPCで、それ以外はRhinocsで、という感じに分担している。

また、プログラムに関してはAndroidにしては悪くないがPCでVSCodeの方が快適かな、
という印象。エディタの性質上JavaScriptのコードは結構書いていて、十分書いていけるのだが、
やはり補間とかがちゃんとあるVSCodeの方がいいな、とも思っている。
セルフでちょっと何かやりたい時にサクッと書けるのは良いのだけれど、メインの開発はPCでVSCodeでいいと思っている。

Rhinocsとしては、やはりプログラムよりは日本語文章執筆にフォーカスしたアプリとしたい。

## もっと知りたい人向け

- [Rhinocsエディタ PlayList - YouTube](https://www.youtube.com/playlist?list=PLMuRFsqc0MB0)
- [Rhinocs - RandomThoughts](https://karino2.github.io/RandomThoughts/Rhinocs.html) 開発記録や仕様検討など

後者のRandomThoughtsの方からは実質全ての情報をたどる事が出来ます。