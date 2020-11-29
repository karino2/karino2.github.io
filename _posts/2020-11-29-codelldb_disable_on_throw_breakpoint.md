---
title: CodeLLDBで、C++でthrow時にbreakしなくする方法
layout: page
---
CodeLLDBは起動時にbreakpointで`breakpoint set -E c++`相当の事をしてしまう。
これを抑制する為には、launch.jsonで`"sourceLanguages": [],`とsouceLanguagesを空にしてやると良さそう。

ブレークポイントは設定の方はいろいろと豊富な指定が出来るがdeleteはidのみなのでdeleteをいくら調べてもやり方が乗ってないのが落とし穴。