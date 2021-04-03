---
title: Markdown見直し用ツール、MDMinaosi
layout: page
---

# 動機

最近Message Passingでmarkdownを良く書くのだが、誤植チェックに見直すのが辛い。

見直しでは、読む方がメインなので読むのが快適であるべきだが、エディタは書くのをメインにしているので、読むのはあまり快適では無い。
具体的にはカーソルとかが邪魔でタッチのスクロールがやりにくい。

見直しに必要なのは快適な読むモードで、さらに必要な時にそれの一部を訂正出来る、
というのが正しいはず。
でもそういうツールが見つからなかったので作る。

名前はmd-minaosiとする。markdownの見直し、という事で。


# ソースとバイナリ

- [https://github.com/karino2/MdMinaosi](https://github.com/karino2/MdMinaosi)
- [バイナリリリース: https://github.com/karino2/MdMinaosi/releases](https://github.com/karino2/MdMinaosi/releases)

**v0.1.0**

Markdownを読んで表示し、誤植を見つけたらタップして直す、という基本的な機能は出来たのでv0.1.0としてリースする。
現状はMac版しかビルド方法が分からなかったのでバイナリはMac版のみ。LinuxとかWindowsの人からのPR待ってます。


# 制作日記

やっている作業を書いていく。

### Electron入門

WindowsとMacの両方で使いたいので、Electronにしようと思う。
今の所Androidで使う予定は無いので。
Android用は必要になったら別途スクラッチから作る。

[Electron: クイックスタートガイド](https://www.electronjs.org/docs/tutorial/quick-start)

ElectronのMarkdown Viewerは世の中にいっぱいサンプルがあるが、どれも全く動かない。
コードを読むとなんで動くのか良く分からない（から動かない）ので、諦めて公式のサンプルを見ながら自分で書く。

preload.jsのデバッグ方法は、[https://github.com/Microsoft/vscode-recipes/tree/master/Electron](https://github.com/Microsoft/vscode-recipes/tree/master/Electron)を参考に設定。
ただし、F5では止まらないのでViewからReloadを選ぶ必要がある。間に合ってないっぽい？困ってないのでまぁいいか。

### 簡単なMarkdown viewerを作る

パッケージ名はMDMinaosiとしたら怒られたのでmd-minaosiにする。

公式から辿れるAPI DemoのshowOpenDialogがコールバックを渡しているのに、手元のはPormiseを返していて気づかずに少しハマる。
うー、そこはエラー出ないのか…

markdown parserは、行番号が取れて欲しいので少しいろいろ眺めた所、 [jonschlinkert/remarkable](https://github.com/jonschlinkert/remarkable)が、rendererまでは行情報が来ているのでこれが良さそう、という事でこれを使う。デモのdebugがだいたい何が来るかが見れるが、これなら十分そう。

めちゃくちゃググりにくい名前なので使い方をググるのは早々に諦めた。まぁこのくらい本家のサンプルとソースだけでどうにかなるだろう。

という事でとりあえずファイルを読んでmdをhtmlにして表示するだけ、が出来た。


### 行数を埋め込んでタップで編集出来るようにする

1. 行数を埋め込む
2. タップのイベントハンドラを書く
3. テキストエリアとかを書く


### ビルド

[Electron: クイックスタート](https://www.electronjs.org/docs/tutorial/quick-start#package-and-distribute-the-application)
では、electron-forgeというのを使う方法が書いてある。

```
$ npm run make
```

でビルド。

Mac用が出来たけど、ChromeBookの人用には何を作ったらいいんだろう？誰か教えて。

### ファイル入出力周り

コマンドライン引数に対応しようとしたが、普段electronに食わせているargとelectron-forgeでzipにした時のargの扱いは違うよなぁ。
どうしたらいいんだ？

良く分からないのでdrag and dropだけ対応しておく。
Recently Openも欲しいが、それはおいおい追加していこう。

### キーボードショートカット

Cmd+Rでファイルの開き直しを実装した。またtextareaでCmd+Enterのsubmitも実装した。
この辺はとりあえず生きていくのに必要な範囲で。Cmd+RはElectron自身のreloadとかぶっているが、とりあえずはいいだろう（そのうちメニューはちゃんと直すつもり）。

### カラーリング

ファンシーなのは後回しでいいと思ったが、ブロッククオートが分かりにくいのでやはり色はつけよう、と決意する。
Message Passingのソースを見てたらBulmaといのを使っているので真似する。いい感じ！

これでとりあえず使える所までは来たな。v0.1.0としてリリースしよう。
