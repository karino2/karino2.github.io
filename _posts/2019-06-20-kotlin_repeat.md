---
title: Kotlinの話-repeat
layout: page
---

0からsize-1まで順番にindexが欲しい事がある。
例えばrow col計算とか。

なんか自分はすぐ、

```
(0..size).forEach{...}
```

的な事を書きたくなるのだが、これはsizeが含まれちゃってダメじゃん、ってなって「...演算子が無いよ！」となって

```
(0 until size).forEach {...}
```

とか書いてしまいがち。

Kotlin的にはrepeatが正しい。

```
repeat(size).forEach {...}
```

repeatってどうも0からsize-1まで舐めるって感じが無いので盲点になりがちなのだが、itにはちゃんと0からsize-1が来る。

1.3にはsequence scopeが入ったので、row colでなんかしたい時は、例えば以下みたいになっている。

```
fun column(colIdx: Int) = sequence {
    val rowSize = shape[1]
    val rowNum = size/rowSize

    repeat(rowNum) {ridx->
        yield(floatArray[ridx*rowSize+colIdx])
    }
}.toList()
```

まぁまぁやね。

関係無いがsequence scopeが中括弧を導入するので、イコールで書いておきながらローカル変数作れるのはちょっと得した気分。