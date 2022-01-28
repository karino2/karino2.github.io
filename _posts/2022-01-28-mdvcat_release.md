---
title: コマンドラインから使うWebViewを使ったマークダウンビュワー、mdvcatを作りました
layout: page
---
コマンドラインからgrepして見つけたファイルをWebViewで見たい、ということが多いので、コマンドラインから使えるGUIのビュワー、mdvcatを作ってリリースしました。

- [karino2/mdvcat: Markdown viewer from command line using photino](https://github.com/karino2/mdvcat)

## インストール

```
$ brew tap karino2/tap
$ brew install karino2/tap/mdvcat
```

Mac以外の人はdotnet sdkでビルドすれば使えるはずです。

## 使い方

```
$ mdvcat README.md
```

これで以下みたいな感じにレンダリングされます。

![screenshot.png](https://github.com/karino2/mdvcat/raw/main/screenshot/screenshot.png)

html片があるとそのまま表示する仕様になっています。
スクリプトも実行されてしまうので、外からのmarkdownを表示する時は`-d`オプションをつけてhtmlのパーシングをオフに出来ます。

## 雑感

[yoshuawuyts/vmd: preview markdown files](https://github.com/yoshuawuyts/vmd)がなかなか良かったのだけれど、
起動が遅いのと開発が止まっていてスクリプト実行とかがそのままされちゃうのはなぁ、
と思い、Photinoで似たようなのを実装してみました。

やはりElectronよりはだいぶ起動が早い。