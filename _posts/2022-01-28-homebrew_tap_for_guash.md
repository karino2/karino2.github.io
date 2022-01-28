---
title: guashをhomebrew tapでインストール出来るようにした
layout: page
---
自分的にはかなり良く出来たと思っている[[guash]]だが、ちょっと試すのに敷居が高すぎるよなぁ、と思っていたところ、dotnetのランタイムがhomebrewにあることに気づいたので、homebrew tapに対応してみた。

## homebrew tapでのインストール方法

```
$ brew tap karino2/tap
$ brew install karino2/tap/guash
```

これでインストール出来る。
アンインストールも以下で出来る。素晴らしい。

```
$ brew uninstall karino2/tap/guash
```

## guashのHello world

インストールをしたら、Hello worldしてみる。

以下のようなファイルをhello_guash.shというファイルで作って、実行属性つけて実行する。

```
#!/usr/bin/env guash

guash_readtext "何か言ってね！"
RES=($(guash_doquery))

echo "Hello, ${RES[0]}"
```

すると以下みたいな画面が出る。

![guash_hello.png](https://karino2.github.io/assets/images/2021-04/guash_hello.png)


もっと進んだ使い方のチュートリアルとしては以下を参考のこと。

[guashで遊ぼう！ - なーんだ、ただの水たまりじゃないか](https://karino2.github.io/2021/04/27/play_with_guash.html)

## F#のツールをhomebrew tapにする時の雑感

dotnetのランタイムがhomebrewに入っていると、
コマンドラインツールを.NET系の言語で作る時には、
公開はdotnetランタイムに依存させたhomebrewでいいかなぁ、という気分になった。

今回はphotino.NETが入っていて30MBくらい。
GUIがなければもっと小さいが、
入っていてもElectronの100MBオーバーに比べればだいぶ許せるサイズに思う。

シングルバイナリーにしなければもっと小さくなる訳だけど、
nugetとかの依存とかを真面目に管理するのも面倒なので、
コマンドラインツールはシングルバイナリーでdotnetランタイムにだけ依存させて、
homebrewでインストールを管理するのが良い気がした。

以前書いたブログ記事も参照のこと: [Create a single binary GUI tool with photino and F# on osx - なーんだ、ただの水たまりじゃないか](https://karino2.github.io/2021/04/25/fsharp_de_photino.html)