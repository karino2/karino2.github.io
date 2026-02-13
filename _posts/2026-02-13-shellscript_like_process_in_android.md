---
title: Android上でシェルスクリプト的な事をやりたい
layout: page
---

機内書き物。

[slog](https://karino2.github.io/RandomThoughts/slog)ではシェルスクリプトでファイル名と一行目のタイトルの一覧から目的のファイルを開く、みたいな事をやる。
これをSyncthingsでAndroid上にもsyncしている訳だが、
Android上で見るにはどうしたらいいか？という事を考えて思った事。

Android上でも簡単なシェルスクリプトのような事をやりたい事は多い。
ただシェルを入れてターミナルでやりたい訳では無い。
ファイルはSAFで触りたい気もする（でもgrepとかやりたいならこれでは遅いかもしれない）。
Runtime Permissionとかを正しく扱えて欲しくて、要するにAndroidの流儀に従った処理にしてほしい。

プレーンテキストのテキストファイルがたくさんある時にスクリプトで処理をしたい。
そしてスクリプトで簡単なインターフェースを書きたい。
インターフェースは通常のコンソール的なアウトプットにpercolみたいな何かでいいだろう。

ちょっとしたテキスト処理のつどアプリを作るのもかったるいので、何かシェルスクリプトアプリのようなものがあって、
そいつがスクリプトを動かす感じにしたい。
書いたスクリプトはランチャーに置けてタップすると実行出来たらいいな、と思う。まぁこれはnice to have。

言語はシェルじゃなくていいんだけれど、最低でも[zx](https://karino2.github.io/RandomThoughts/zx)くらいの書きやすさが欲しい。

例えば[Starlark](https://karino2.github.io/RandomThoughts/Starlark)に[Plumbum](https://plumbum.readthedocs.io/en/latest/)みたいなシンタックスで書ければいいんじゃないか？

必要なコマンドはなんだろう？
ls, sort, head, tail, cat, xargs, date, echo, cat, sedくらいだろうか？
sedを移植する気は起こらないのでsedっぽい何かをStarlark上で動かせればいいかもしれない。