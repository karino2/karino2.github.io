---
title: "kotlinのsuspend function調査メモ"
layout: page	
---

suspend functionが良く分からないので調査した事のメモ。

### あらすじ

公式ドキュメントを見たら[coroutineのセクションが出来ていた](https://kotlinlang.org/docs/reference/coroutines/coroutines-guide.html)ので読んでみた。

使う方はだいたいわかるとして、suspend functionが何なんかいまいちわからない。

そこでyoutubeの[KotlinConf 2017 - Deep Dive into Coroutines on JVM by Roman Elizarov](https://www.youtube.com/watch?v=YrrUCSi72E8)を見ると、state machineになる事、CPSの引数が追加される事、などは分かる。
世の中の解説はだいたいこれの劣化コピーなので、まずはこれを見るのが良い。

だがこれでは、いまいち肝心なsuspend functionの呼び出しとか生成回りの仕組みの解説が中途半端で分かりにくい。

[KEEPのデザインドキュメント](https://github.com/Kotlin/KEEP/blob/master/proposals/coroutines.md)は良く書けているが、デザインドキュメントなのでいろいろ厳密ではなく、やはりsuspend function回りは良く分からない。

仕方ないので自分で調べる事にした。ただ説明を書く気はあまり無くて、調べたリンクとかを残す程度のつもり。

# ソースコード

関係するソースコードのリンク。

### stdlibのjvm/internal
[https://github.com/JetBrains/kotlin/tree/master/libraries/stdlib/jvm/src/kotlin/coroutines/jvm/internal](https://github.com/JetBrains/kotlin/tree/master/libraries/stdlib/jvm/src/kotlin/coroutines/jvm/internal)

ContinuationImpl.ktにContinuationImplやLambdaSuspendなどの重要な関数の定義がある。
だいたいこのコードが今回書く事のメイン

### kotlinx.coroutines

[https://github.com/Kotlin/kotlinx.coroutines](https://github.com/Kotlin/kotlinx.coroutines)

suspend functionを理解するにはあまり必要ないが、適当なコードを動かしてみる時のエントリポイントとしてはkotlinx.coroutines回りのコードもある方がいい（launchから追う事になるので）


# テスト用のコード

以下のコードをanalyze apkでdalvikバイトコード見ていく。

[https://github.com/karino2/SuspendTest](https://github.com/karino2/SuspendTest)


