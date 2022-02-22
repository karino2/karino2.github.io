---
title: OilシェルのVSCode Extensionをリリースしました
layout: page
---
シンタックスハイライトくらい欲しいなぁ、と思い質問した所なさそうだったので、自分で作ってみました。

- [OilShell extension - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=karino2.oilshell-extension)
- [VSCode Extension for Oil : oilshell@reddit](https://www.reddit.com/r/oilshell/comments/sybw4r/vscode_extension_for_oil/)

bashをベースに幾つか特徴的な所だけオーバーライドする感じになっています。
JSON周りとか型周りとか、本格的にコーディングする系の機能はあまり対応していませんが、日常的なスクリプトの範囲は割とカバー出来ているんじゃないか。

括弧の対応関係をちゃんと数えないとサポート出来ないケースは諦めています。
また、arrayなどでコマンドモードに戻る時は閉じ括弧があってもコマンドモードのままにしてあります。
これは対応を間違えた時にそこから後の行が全てExpression Modeになってしまうような状態だと普段使いしていていまいちだった為です。

今回初めてVSCodeのExtensionとTextMateのgrammarを書きましたが、なかなか良く出来ていますね。
Marketpalceの登録もAzure Dev関連で前世のアカウントがどうしても紐付いてしまって苦戦したくらいで他はあまり苦労も無かったです。

このくらいの出来でも通常のシェルスクリプトのモードを使うよりはだいぶ快適ですし、
PRを受け取る土台さえあればちまちま対応を増やしていくのは割と簡単なので、ユーザーが増えてきたらマンパワーで解決出来るんじゃないか、
という気もするので、結構有意義な活動だったんじゃないか、と思っています。