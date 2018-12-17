---
title: "kotlinのsuspending function調査メモ"
layout: page	
---

suspending functionが良く分からないので調査した事のメモ。

### あらすじ

公式ドキュメントを見たら[coroutineのセクションが出来ていた](https://kotlinlang.org/docs/reference/coroutines/coroutines-guide.html)ので読んでみた。

使う方はだいたいわかるとして、suspending functionが何なんかいまいちわからない。

そこでyoutubeの[KotlinConf 2017 - Deep Dive into Coroutines on JVM by Roman Elizarov](https://www.youtube.com/watch?v=YrrUCSi72E8)を見ると、state machineになる事、CPSの引数が追加される事、などは分かる。
世の中の解説はだいたいこれの劣化コピーなので、まずはこれを見るのが良い。

だがこれでは、いまいち肝心なsuspending functionの呼び出しとか生成回りの仕組みの解説が中途半端で分かりにくい。

[KEEPのデザインドキュメント](https://github.com/Kotlin/KEEP/blob/master/proposals/coroutines.md)は良く書けているが、デザインドキュメントなのでいろいろ厳密ではなく、やはりsuspending function回りは良く分からない。

仕方ないので自分で調べる事にした。ただ他人に分かるような説明を書く気はあまり無くて、調べたリンクとかを残す程度のつもり。
他の言語のasync awaitとかがCPS化してswitchにする、とかの基本は知っているという前提で（その辺は上記の動画にも詳しい）。

# ソースコード

関係するソースコードのリンク。

### stdlibのjvm/internal
[https://github.com/JetBrains/kotlin/tree/master/libraries/stdlib/jvm/src/kotlin/coroutines/jvm/internal](https://github.com/JetBrains/kotlin/tree/master/libraries/stdlib/jvm/src/kotlin/coroutines/jvm/internal)

ContinuationImpl.ktにContinuationImplやLambdaSuspendなどの重要な関数の定義がある。
だいたいこのコードが今回書く事のメイン

### kotlinx.coroutines

[https://github.com/Kotlin/kotlinx.coroutines](https://github.com/Kotlin/kotlinx.coroutines)

suspending functionを理解するにはあまり必要ないが、適当なコードを動かしてみる時のエントリポイントとしてはkotlinx.coroutines回りのコードもある方がいい（launchから追う事になるので）


# テスト用のコード

以下のコードをanalyze apkでdalvikバイトコード見ていく。

[https://github.com/karino2/SuspendTest](https://github.com/karino2/SuspendTest)




### suspending functionはどう呼ばれるか

suspending functionからContinuationを得るのは、最終的にはIntrinsic/IntrinsicsJvm.ktの以下

```
public inline fun <T> createCoroutineFromSuspendFunction(
    completion: Continuation<T>,
    crossline block: (ContinuationT>)->Any?)...
```

crosslineというのが何なのか分からないが、このラムダ式は以下みたいに作られる。(thisがsuspending function)

```
public actual fun<R,T> (suspend R.()->T).createCoroutineUnintercepted(
    receiver: R,
    completion: Continuation<T>)... {
    ...
    // 上記のblockになるラムダ式
    { (this as Function2...).invoke(receiver, it) }
}
```

ようするにsuspending functionは、最終的にはFunction2にキャストしてinvokeされる。
このblockはどこから呼ばれるかというとinvokeSuspend。
これはBaseContinuationImpleのresumeWithから呼ばれる。

resumeWithは最初の一回は普通にstartCoroutineの中で呼ばれている(呼ばれてるのはresumeだが)。

### suspending functionの型

例えば

```
class Test {
    suspend fun susAll(a: Int): Int {
        ...
```

は、以下になる。

```
.method public final susAll(ILkotlin/coroutines/Continuation;)Ljava/lang/Object;
    .registers 10
    .param p1, "a"    # I
    .param p2    # Lkotlin/coroutines/Continuation;
        .annotation build Lorg/jetbrains/annotations/NotNull;
        .end annotation
    .end param
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(I",
            "Lkotlin/coroutines/Continuation<",
            "-",
            "Ljava/lang/Integer;",
            ">;)",
            "Ljava/lang/Object;"
        }
    .end annotation

    .annotation build Lorg/jetbrains/annotations/Nullable;
    .end annotation
```

IとContinuation。Iはもともとの引数なので、末尾にCPS用のContinuation型が足される。


### ローカル変数とステートマシンのデータの持ち方

suspendingメソッド一つにつき、そのメソッドにドルを付けたような名前のクラスが生成される。
先ほどの例なら

```
class Test$susAll$1
.super Lkotlin/coroutines/jvm/internal/ContinuationImpl;
```

というクラス。

このクラスはcontinuationをラッパするcontinuationで、resumeWithは

1. invokeSuspendが終わってなければこれを繰り返し呼ぶ
2. invokeSuspendが結果を返したらラップしてた元のcontinuationのresumeWithを呼ぶ

となっている。通常のCPSをinvokeSuspendをoverrideする事で実現できるクラス。
このContinuationImplのサブクラスにステートマシンの必要な要素やローカル変数などを持たせて一回resumeWithを呼ぶ。

以後のresumeWithの呼び出しはCOROUTINE_SUSPENDEDを返した人の責任（つまり普通のCPS）。


自身が終わったらラップしてる中身のcontinuationのresumeWithを呼び出す。