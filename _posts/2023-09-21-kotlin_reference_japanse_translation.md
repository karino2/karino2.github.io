---
title: Kotlinのリファレンスの和訳を引き継ぎました
layout: page
---
もともとdogwood008氏が以前やっていた和訳、

- [Kotlinの公式リファレンスを日本語化してみた[前編] - Qiita](https://qiita.com/dogwood008/items/6e8d3225ea9bb0fe3099)
- [Kotlinの公式リファレンスを日本語化してみた[後編] - Qiita](https://qiita.com/dogwood008/items/f4ceabd0b0d801fb3a9f)

が、かなり出来ていて、けれど最近メンテがされてないようだったので連絡を取った所、
レポジトリをtransferして私が翻訳を続ける事になりました。

- [karino2/kotlin-web-site-ja: The Kotlin Programming Language Website (original: http://kotlinlang.org/)](https://github.com/karino2/kotlin-web-site-ja)
- [リファレンス - Kotlin Programming Language](https://karino2.github.io/kotlin-web-site-ja/docs/)

元のURLのまま作業しようと思っていたのだけれど、transferというのはURLも変わるんですね…

ただ個人名のドメインの下に他人が作業するのも良く無いので、仕方ないのかもしれない。
本当はユーザーグループか何かがOrganizationとかで作業するのが良いのだろうけれど、
自分はそこまで頑張る気は無いので個人レポジトリで作業します。

## 和訳する動機

今、プログラム未経験の友人にAndroid開発を教えていて（[トップページ - karino2のあおぞらAndroid開発教室](https://karino2.github.io/kotlin-lesson/)参照）、
英語が読めないというので、リファレンスの和訳が必要だな、と思っている。

そろそろkotlin言語をちゃんと教える段階に来たので、リファレンスの和訳をもとに教えていこうと思っていて、
その目的のために和訳したい。

## 作業する気の範囲など

左のnavbarとしては、以下の二つはやりたいと思っている（後者は完成出来るかは怪しいが）

- Tour
- Basics
- Concepts

また、余力があればStandard libraryもやりたいと思っている。

以下はたぶんやりません。

- Get started
- Kotlin overview
- What's new
- Multiplatform development
- Platforms

Official librariesのcoroutinesは出来たらやりたいが、多分無理かなぁ。

また、既存の和訳はv1.9.10にアップデートしたいと思っている。
playgraoundでの実行もやれるようにしていきたい（[本家がkotlin-runnableとしている実行出来るブロックをkotlin_quote.htmlに直す · Issue #34 · karino2/kotlin-web-site-ja](https://github.com/karino2/kotlin-web-site-ja/issues/34)参照、PR歓迎です、変換スクリプト書いてくれると嬉しい）。

方針としてはmdのカバレッジを増やす事を重視して、
クオリティを上げていく作業はあまり出来ないと思います（訳語の統一などはあまり期待しないでください…）。
CSSのスタイルなどもある程度見れるようになったらそれ以上はいじらない予定（PRは歓迎です）。

また、長期間メンテしていく気もあまりなくて、
v1.9.10までか、その次のバージョンくらいまでしか作業しないと思います。
（そこまで行ったらまた誰かにバトンを渡す感じでいいかと）

## ビルドの方針など

本家のビルドシステムは複雑な上に外部の人には再現も難しいので、
似せるのも諦めて省エネでjekyllで書き直しました。
nodeなどを使って生成しているものも全て排除して、
自分でLiquidを書いて素のjekyllでやれる範囲でやっています。

本家の構成を再現するのもそんなに熱心では無く、mdが同じなら価値はあるだろう、と思ってトップページなどは変えてしまっていますし、
ツアーのフォルダ構成なども変えています。

課題の解答のcollapseや左のnavbar、kotlin playgroundでの実行周辺は完全に別物にしました。

見た目が野暮ったくなりますが、とりあえず私はmdを増やして行くのを優先します。

見た目を良い感じに調整してくれるPRは大歓迎です。

## 翻訳のPRやその他のPRは大歓迎です

なかなか量が膨大でやりたい範囲を全部はやれなさそうなので、
PRは大歓迎です。

また、既存の訳のコードをkotlin playgroundで実行出来るようにするような単調作業の類のPRも歓迎です。

最後になりましたが、ここまで大量に翻訳してくれて、
しかもそれをレポジトリごとtransferしてくれた太っ腹な [dogwood008 (KITAGAWA Daisuke)](https://github.com/dogwood008)氏にも感謝です。