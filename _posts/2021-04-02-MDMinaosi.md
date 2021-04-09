---
title: Markdown見直し用ツール、MDMinaosi
layout: page
---

![icon](https://raw.githubusercontent.com/karino2/MdMinaosi/main/misc/icons/png/256x256.png)

# 動機

最近Message Passingでmarkdownを良く書くのだが、誤植チェックに見直すのが辛い。

見直しでは、読む方がメインなので読むのが快適であるべきだが、エディタは書くのをメインにしているので、読むのはあまり快適では無い。
具体的にはカーソルとかが邪魔でタッチのスクロールがやりにくい。

見直しに必要なのは快適な読むモードで、さらに必要な時にそれの一部を訂正出来る、
というのが正しいはず。
でもそういうツールが見つからなかったので作る。

名前はMDMinaosiとする。markdownの見直し、という事で。


# ソースとバイナリ

- [https://github.com/karino2/MdMinaosi](https://github.com/karino2/MdMinaosi)
- [バイナリリリース: https://github.com/karino2/MdMinaosi/releases](https://github.com/karino2/MdMinaosi/releases)

**v0.1.2**

- Markdownを表示し、誤植を見つけたらタップして直すという基本機能
- メニューからのファイルオープン、及びドラッグアンドドロップでのファイルオープン
- appアイコン
- DockへのDnD
- Open Recent

現状はMac版しかビルド方法が分からなかったのでバイナリはMac版のみ。LinuxとかWindowsのビルドってMacでやるの大変なのかね？

![screenshot](https://raw.githubusercontent.com/karino2/MdMinaosi/main/misc/screenshot_md_minaosi.png)


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

パッケージ名はMDMinaosiとしたら怒られたのでmd-minaosiにする。（追記: electron-forgeでビルドする時のアプリの名前はMDMinaosiにした）

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

### スクリーンショット

せっかくなのでスクリーンショットを足してみた。
ついでにこのページのトップにもスクリーンショットを貼る。

### メニュー

iPadに送るとかの作り方が分からなかったが、Window以下のメニューはだいたいデフォルトで良さそうなのでroleをwindowMenuとする事で残す事に成功。

ファイル周りとview周りのメニューを作った物に変えてページの上のほうのボタンで代用していたのをメニューに変更。

これで作りかけな感じは大分無くなってきたな。

### アイコン周り

[How to Generate Mac and Windows Icons for an Electron Forge App](https://chasingcode.dev/blog/electron-generate-mac-windows-app-icons/)に詳しく書いてある。
1024x1024のpngを作って、electron-icon-builderというのを使ってアイコンを生成するらしい。なるほど。

上記ページからリンクされてたテンプレート、Maker周りの参考になるか？

[https://github.com/breadthe/electron-forge-svelte/blob/master/package.json](https://github.com/breadthe/electron-forge-svelte/blob/master/package.json)

よし、アイコン描いた！
少し様子見て問題無ければタグ打ってまたリリースだな。

現状はMacのアイコンを決め打ちしているが、makerで指定出来ないのかな？とググって以下を見つけた。[SO: Setting platform dependant icon via electron-forge electronPackagerConfig](https://stackoverflow.com/questions/48790003/setting-platform-dependant-icon-via-electron-forge-electronpackagerconfig)
そのうち対応しよう。

追記: アイコンメモ。

1024x1024で、円の時は上は64ピクセルあける。四角の時は96ピクセルあける。

```
$ npm install --save-dev electron-icon-builder
```

でpackages.jsonのscriptsに、
```
    "icon-make": "./node_modules/.bin/electron-icon-builder --flatten --input=./misc/icon_original.png --output=./misc",
```

### Open Recent対応

やっぱりOpen Recentが欲しい、という事でググってみたら、[最近使った書類 (Windows & macOS)](https://www.electronjs.org/docs/tutorial/recent-documents)を見つけて、簡単そうなので対応する。
setApplicationMenuをapp readyより後に呼ばないといけない、というのにハマるが（それならサンプルを最初からそうしておいてくれ…）、
それ以外は割と簡単に実装出来た。なかなかいい感じだ。
DockのRecent docも開けるようになってますます快適。

ここまで出来ると、Dockへのドラッグアンドドロップの対応もやりたくなるが、やり方が良く分からない…

### DockへのファイルのDnD対応

いろいろググって、以下から、Info.plistに.mdの関連付けが無いと駄目なんじゃないか？と予想をつける。

[Mac: dropping file/folder onto dock does not add to process.argv](https://github.com/electron/electron/issues/1926)

electron-forgeでやるんだろうな、とググって以下を見つける [How to associate file types with an electron app?](https://github.com/electron-userland/electron-forge/issues/492)

extendInfoではそのままInfo.plistの内容を書けそう。
上記リンクとは微妙に名前が違うが、packagerConfigで良さそうだな。[Electron Forge: Configuration](https://www.electronforge.io/configuration)からElectron Packager API docsのリンクをたどるとextendInfoがある。

[qiita: Electron で Markdownプレゼン作成ツールを作って公開するまで](https://qiita.com/yhatt/items/0bf65699a538d5508c33)

自分の場合は見るだけなので、LSHandlerRankはAlternateか？本家のドキュメントに解説が無いので良く分からないが。

Info.plistの内容はApplication下にコピーするだけだといまいち反映されないので一旦削除したりする必要はありそう。

という事で無事DnDも対応出来たヽ(´ー｀)ノ

### C-xとか効かないのはEditメニューが無いせいだ

ショートカットの所でハンドルしているので、メニューが無いとtextareaでキーボードショートカットが効かないのね。
という事でメニューも追加。

### Github Actionsで複数ビルドとかのメモ

そのうち気が向いたらチャレンジする。

- [Build and Publish a Multi-Platform Electron App on GitHub](https://dev.to/erikhofer/build-and-publish-a-multi-platform-electron-app-on-github-3lnd)
  - [github: electron-publish-example](https://github.com/erikhofer/electron-publish-example)

これが一番シンプルで良い気がする。package.jsonの書き方もこれを真似たい気がする。

以下ググってて見かけた関連しそうなもの。

- [Is possible to make "deb" and "rpm" on Mac OSX? #436](https://github.com/electron-userland/electron-forge/issues/436)
- [Qiita: [メモ] GitHub Actions を使って Electron の multi-platform-build をやる](https://qiita.com/jrsyo/items/76e476aa25bf4f8f8e79)
- [github: action-electron-forge](https://github.com/jsoma/action-electron-forge)