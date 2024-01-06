---
title: MDDeckというアプリを作ってリリースしました！
layout: page
---
年末くらいから作り始めていた、MDDeckというアプリをさきほどGoogle Playにリリースしました。Electron版もあってgithubのReleaseのところにバイナリが置いてあります。

- [MDDeck - Google Play のアプリ](https://play.google.com/store/apps/details?id=io.github.karino2.mddeck)
  - [github: MDDeck for android](https://github.com/karino2/MDDeck/)
- [github: MDDeck_Electron](https://github.com/karino2/MDDeck_Electron) PC版、バイナリもこちらから。
- [RandomThoughts: MDDeck](https://karino2.github.io/RandomThoughts/MDDeck) 開発中のメモなど

## コンセプト

各セルが独立したプレーンテキストのmdファイルとなります。
ファイルは例えば 2023/12/23/1703313584679.md のような形式です（最後のbasenameはDateのlong値です）。
最近の数十件だけを表示するようになっています。

Android版もSAFを使ってプレーンなファイルを指定されたディレクトリ以下に生成し、
Syncthingなどのフォルダシンクのアプリを使ってサーバー無しでPCとデータを共有出来ます。

追加に関してはその日付となるため、syncしてない状態でスマホなどでセルを追加してもconflictしません。
（既存のセルを編集する時は同じセルを編集していればコンフリクトする）。

ネットワークアクセス権限もファイルのりードライと権限も無しでユーザーがSAFで指定した権限だけで動きます。

## 対応しているマークダウン

CommonMark+GFMのタスクリスト、くらいです。ただし画像は今のところ対応していません。

## 開発背景

仕事でパフォーマンス関連の作業をしている時に、MacとWindowsでかなり遅いところが違う場合があって、
それぞれのケースのログや試したコードなどをメモしたい事が増えてきました。

同じテキストファイルでやっているとコンフリクトが多くてかったるく、
けれど別のファイルで作業をしていると時系列などがわかりにくい。

ローカルで動くgithubのissue一つ、みたいなものが欲しいな、と思い作りました。

完成した頃にはMacとWindowsを行ったり来たりするタスクが終わっていたので仕事では使っていませんが、
メモとしてなかなか見た目が良くて日常的な買い物メモなどに便利なので、Android版も作って使ってみたところ、
なかなか体験が良かったのでリリースする事にしました。

スマホとPCで共有する場合、適度にsyncをさぼってもconflictしないのが結構重要だなぁ、というのが最近の結論で、
1メモ1ファイルの方がいいんじゃないか、と最近は思っています。