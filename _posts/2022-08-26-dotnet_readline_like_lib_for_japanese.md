---
title: dotnetで使えるReadLineっぽいライブラリで日本語が使えるのは無いのだろうか？
layout: page
---
[fsharp-lesson](https://karino2.github.io/fsharp-lesson/toyrel.html)では以前ちらっと見かけて触ったら普通に動いているように見えた[radline](https://github.com/spectreconsole/radline)というのを使ってreplを作ってもらった所、
日本語を入力していくとどんどん下にカーソルがずれていって変な事になる、と言われた。
確かに変だ。

で、いろいろ探したけれど結局良いのが見つけられなかった、という話なのだけれど、以下にその過程を書いておく。

## 調べた事

うーむ、こんな日本人なら必要になるようなものやってる人ひとりもいないという事は無かろう、と思って少しググってみた所、以下のStackoverflowを見かける。

[c# - Is there a .Net library similar to GNU readline? - Stack Overflow](https://stackoverflow.com/questions/2024170/is-there-a-net-library-similar-to-gnu-readline)

これを試していった。

### getline.cs

getline.csというのが最初に紹介されていて、このファイルを持っていって自前でビルドして動かしてみた。

[mono/getline.cs at main · mono/mono](https://github.com/mono/mono/blob/main/mcs/tools/csharp/getline.cs)

cscではMacでは生成されたファイルが実行できず、良くわからんのでプロジェクト作ってコピペしてネームスペースがなんかぶつかったとか言われたのでネームスペース変えてifdefの所だけ中に入れて実行してみた所、日本語はエコーバックが表示されない。だめそう。

### deveelrl

SOからのリンクは切れていたが、githubにうつっていてNuGetもあった。

[deveel/deveelrl: A .NET/Mono ReadLine implementation](https://github.com/deveel/deveelrl)

日本語はエコーバックされるがバックスペースすると文字が半分しか消えない。

ただコードは一番いじりやすそうだった。直すならこれかなぁ。

### tonerdo/readline

これがたぶん一番使われている定番っぽい。

[tonerdo/readline: A Pure C# GNU-Readline like library for .NET/.NET Core](https://github.com/tonerdo/readline)

ただ挙動はdeveelrlと同じ。
しかもコードがかなり幅を決め打ちにしている感じになっているので、直すならdeveelrlの方が楽そうに見えた。

### 試さなかったもの

mono readlinesというのはバイナリが置いてあるだけで2004年だったので試さなかった。Macで動か無さそうだし。

## 知っている人いたら教えて下さい

dotnetのreadlineっぽいライブラリで日本語扱えるの、なにか無いんですかね？
無いって事は無いと思うんだが…
