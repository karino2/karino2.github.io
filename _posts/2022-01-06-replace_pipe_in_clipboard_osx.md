---
title: OS Xでクリップボードのパイプ記号を全角に置き換えるシェルスクリプト
layout: page
---
大した話しでは無いのだが、雑記の中に埋もれさせるのもなぁ、という内容なので独立した記事にしておく。

jekyllでは、リンクの表示文字列の方にパイプ記号があると、liquidと解釈されるとかでうまく動かない。
例えばこんなの。

[How to Write a Command-Line Tool with Kotlin Multiplatform | by Jean-Michel Fayard | ProAndroidDev](https://proandroiddev.com/how-to-write-a-command-line-tool-with-kotlin-multiplatform-b598247fe880)

テーブルとして解釈されてるように見えるが、とにかくリンクにはならない。

一方で、webのページからmarkdownのリンクを生成するブラウザのextensionはパイプ記号が含まれる事が多い。

本当はextensionでreplaceしたいところだけど自分でextensionを書くのも面倒なのでいつも手作業で直していたが、もううんざりしてきたので妥協してシェルスクリプトを書く事に。

大した事では無いが一応内容も書いておく。

```
#!/bin/sh

pbpaste | sed 's/|/｜/g' | pbcopy
```

ようするに全角で置き換えている。

これをreplace_pipe.commandとかいう名前で保存して、スポットライトから実行している。
そうするとこうなる。

[How to Write a Command-Line Tool with Kotlin Multiplatform ｜ by Jean-Michel Fayard ｜ ProAndroidDev](https://proandroiddev.com/how-to-write-a-command-line-tool-with-kotlin-multiplatform-b598247fe880)

ひと手間あるが、スポットライトから実行するのは我慢出来る程度の体験ではある。

誰か良いブラウザextension書いて〜と思いつつしばらくはこれでお茶を濁す。