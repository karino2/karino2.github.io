---
title: suspend関数の入門を書きました
layout: page
---

kotlinを教えていた所、どうもawait回りのコードがおかしいので、入門向けの解説を書きました。

[kotlin-lesson: 使うだけに絞ったsuspend関数入門](https://karino2.github.io/kotlin-lesson/suspend_intro.html)

他の言語のasync-awaitの経験が無くて非同期プログラミングもhello worldレベル、くらいの人向けに、呼び出しのシーケンス図をちゃんと理解する、というのを目標に書きました。

サーバーにpostしたあとActivityのfinishをしたい、
という一番良くあるケースをちゃんと書けるようになる唯一の（？）入門。

ベテランはいまさら感のある話ではありますが、たまにはボランティア活動も必要かな、と。（参考: [ボランティア精神と入門記事](https://karino2.github.io/2019/06/25/1039.html))