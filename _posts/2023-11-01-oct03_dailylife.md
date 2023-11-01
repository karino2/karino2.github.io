---
title: 10月下旬の雑記
layout: page
---

## 2023-10-21 (土)

波は残らなかったようなので今朝は暇になる。
[Kotlinリファレンスの和訳](https://karino2.github.io/RandomThoughts/Kotlinリファレンスの和訳)を進めるなど。

audiobookを聞いたりしつつ、リファレンスの和訳をしたりする。

## 2023-10-22 (日)

朝は[【書籍】サピエンス全史](https://karino2.github.io/RandomThoughts/【書籍】サピエンス全史)を聞くなど。下巻に入って聞くに堪えない感じでは無くなってきた。

malloc置き換えとして[microsoft/mimalloc: mimalloc is a compact general purpose allocator with excellent performance.](https://github.com/microsoft/mimalloc)を評価していたら、なかなか早くなっている。
ただそのままではこちらの事情で組み込めないケースがあるので、
これが何をやっているか理解したいな。

論文はこれか＞[Mimalloc: Free List Sharding in Action - Microsoft Research](https://www.microsoft.com/en-us/research/publication/mimalloc-free-list-sharding-in-action/)

先週のサーフィンを録画してもらったものを見ているが、結構上手くなってるな、自分。
テイクオフの時に経った時点で腰が高いというか、立ち上がる時にもう腰が高くて上半身が後から立つ感じになっているので、
これを直すのが良さそう。
ちょっと陸トレしてみよう。

mimallocの論文を途中まで読んで、その後コードを少し眺めてみる。thread locla storageにheapオブジェクトみたいなのを置いているが、
これはスレッドが無くなった時にどうなるんだろう？

_mi_thread_doneか。ちょっとこの辺はコード読みページ作るかな？

理解は深まったが、やはり一般的ゆえの面倒さがいろいろあるなぁ。

follyのThreadCachedArenaはなかなか良くできてて、そうそう、こういう感じだよ、ってものなんだがなぁ。
こういうのがサーバーサイド以外でも使えればいいんだけれど。

## 2023-10-23

品川で友人とダベる。採用は雇うなら雇う、雇わないなら雇わないでバシっと言ってあげてよ、みたいな話をするなど。

少し新宿の本屋によってkotlinとかAndroidの本を軽く見たり、最近の関心の並列アロケータについて見るがめぼしいものはなし。
Androidはこれじゃあ駄目だよな、という内容が多く参考にならない。
Kotlinの本は薄くて簡素なので、もうちょっと初心者向けに詳しい方がいいのになぁ、とは思うが、それなりに初学者向けに書かれているものはある。薄い本で頑張ってやるのもできなくは無さそう。

並列アロケータみたいな話は全然無い。
最近はC++の現場と書籍の間の乖離が随分大きくなった気がするがどうだろう？
follyには多くの知見が詰まってるが、それが本棚には無い。

follyのThreadLocalはC++のthread_localと何が違うんだ？と思っていたら、youtubeで解説を見つけた。 [CppCon 2016: David Watson “Experiences with Facebook's C++ library" - YouTube](https://www.youtube.com/watch?v=GDxb21kEthM)

なるほど、メンバ変数で使いたい場合に使えるのか。逆にメンバじゃなくて良ければthread_localでいいんだな。

## 2023-10-24 (火)

今日はmimallocのうち、お仕事で関係ありそうな所だけをちゃんと読む。せっかくなのでコード読みブログでも書くかな。

今日は早起きして午前中に十分働いてしまってこれ以上進む気もしなかったので、午後は散歩したりカフェで読書したり。
[【書籍】ConcurrentProgrammingOnWindows](https://karino2.github.io/RandomThoughts/【書籍】ConcurrentProgrammingOnWindows)を読んでいる。
でもこれよりももっと教科書っぽいの読む方がいいかもしれん。

帰ってきてabema見たら河村カイサのRound 3がやってたので見てみた。おー、なんかうまく試合運んだね。
Round 2も見たかったな。

## 2023-10-25 (水)

mimallocのうち必要な所だけを軽く読もうとしているが、思ったより大変なのでブログを書く事にする。
とりあえずmalloc_genericのうちスライスから取り出すあたりまでを読む。
もう少し読んでから1ポストにしようと思っていたが、かなり長くなってきたので切る事に。

[mimallocコード読み、malloc_generic前篇](https://karino2.github.io/2023/10/24/mimalloc_code_reading.html)

[【書籍】ConcurrentProgrammingOnWindows](https://karino2.github.io/RandomThoughts/【書籍】ConcurrentProgrammingOnWindows)を読んでいて、Reader Writer LockのWindowsAPIを見て、
そういえばSTLでreader-writer lockってどうなっているんだろう？と調べると、C++ 14からshared_timed_mutexとshared_lockというのが入ったらしい。
C++ 17にはshared_mutexというのがあってこっちの方が軽いらしい。うげぇ。

[c++ - Why shared_timed_mutex is defined in c++14, but shared_mutex in c++17? - Stack Overflow](https://stackoverflow.com/questions/40207171/why-shared-timed-mutex-is-defined-in-c14-but-shared-mutex-in-c17)

これは残念な歴史的偶然。timeoutなんて無い版を先に入れておけばなぁ。

なんにせよshared_timed_mutexは自分で実装するよりは良かろう。

## 2023-10-26 (木)

mimallocのコード読みをしていたが、思ったより大変。ただ割と全体の構造は把握出来てきたので、だいたい予想出来るようにはなってきた。
知りたいところの核心を読んで終わりにしたいかな。

## 2023-10-28 (土)

昨日は雑記を書いていなかったか。あおぞら教室してmimallocのコードを読んでいた。

今日も午前中はmimallocのコードを読んでいた。だいぶ理解は深まってきた気はする。

ゲームのアロケータの話とか無いかなぁ、とググっていたら以下の動画を発見。

<iframe width="1300" height="732" src="https://www.youtube.com/embed/jWFBdIVaeBo" title="RE:2023 仮想メモリアロケータ導入への道のり" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

我々の目的とは全然違うので直接は参考にならないが、難度は同じくらいの話で、やっぱみんな頑張ってるなぁ、という気はする。

おぉ、mimallocを採用したとの事。タイムリーだな。

mimallocはパフォーマンス的に重要では無い所でもほとんどロックしないんだよな。
これはパフォーマンス上重要な所をロック無しで書いた結果、整合性をもたせるためには同じように書く事で統一するのが一番簡単という事に思う。
follyのコードでもそういう所あるんだよな。
CASで書く方が難しいけど安全なんだよなぁ。

## 2023-10-29 (日)

昨日、[技術ドキュメントを読む速度](https://karino2.github.io/2023/10/28/speed_of_reading_tech_doc.html)について書いたあとに友人達と話した所、
どうもこういうのは教える必要がある技術なんじゃないか、という気がしてくる。
ただ自分も何かノウハウとか定まった方法でやっているという訳でも無いので、
何を教えたらいいかは良く分からないんだよなぁ。

こういう本を読む方法的なハウツーは大学受験の前後でたくさん読んだが、あまり役に立たなかった。
だから何らかの「こうやって読む」という手法に対して懐疑的で、それを語る気もあまり起こらない。
けれど教えている相手が現実問題として明らかに遅すぎて困っているのだから、改善する必要はある気もする。

[【書籍】CppConcurrencyInAction](https://karino2.github.io/RandomThoughts/【書籍】CppConcurrencyInAction)を読む。半分以上は要らない内容だけど、そういう所を飛ばせば結構情報はある本だな。
もっと良い本が無い以上C++プログラマ的には必読ではある気がする。

かなり分かってる感じの人のブログを見つけた。[1024cores](https://www.1024cores.net/home)。
ちょっと一通り読んでみよう。メモ： [omo/rsc.epub](https://github.com/omo/rsc.epub) omo先生が前epub作ってたヤツ。

夜は頑張って1024 coresのサイトをepubにする。
更新がある訳じゃないのでurlのリストは準人力で。
一応出来たっぽいがplay bookアプリで開けないな？koboとapple booksでは開けた。
webから見たら処理中と出ているので少し待つ。＞Processing failedになる

まぁBookwalkerアプリとかでは読めているのでいいや。（結局koboで落ち着いた）

## 2023-10-30 (月)

昨晩は1024 coresをepub化したのを読んでいたら、なんか寝付けなくなってしまって夜更かししてしまった。
いやぁ、このepubはなかなか良いな。そのうちブログポストを書こう。

なんか並列プログラム楽しくなってきた。これはC++って感じするよなぁ。

思ったよりもplacement newとatomic周りを合わせて使うコードに慣れてない自分に気づいたので、本をもう少し読みすすめることに。

本を読むなら家に居ても仕方ないので、気分転換も兼ねて東戸塚に買い物に出つつ読書することに。
服とか水着とか買いたいものがあったし、ちょうど良かろう。

水着とゴーグルとシャツを買う。
そのまま帰りにドトールによっておやつ食べつつ読書。
東戸塚はなかなか有能だよなぁ。

Cppの並列本は、cppであるという点が思ったより意味があるな。
ノードの解放とかのせいでデータ構造がshared_ptrになったりするのは、他の言語の並列のコードからは簡単には分からない場合もある。

## 2023-10-31 (火)

仕事をしようと思ったら他人のビルドブレイクで直す事に。こんな日もあります。

最近波が無くて運動不足なのでプールに行ってきた。最後に行ったのは八景で奄美に行く前なのでほぼ一年ぶりとか。
さすがにこれだけサーフィンでパドリングしているので一年ぶりの割にはかなり泳げる。
久しぶりに泳ぐとやっぱ気分いいな。

[技術文書の読み方](https://karino2.github.io/RandomThoughts/技術文書の読み方)を考えてみる。教えたり訓練させたりする前に、そもそも自分は何をやっているのかが良く分かってない。

その後はmimallocのソース読み終盤。もうだいたい知りたい事は読んだ感じがあるが、ブログとしては中途半端なので終わらせたい。＞微妙に終わらず。あと一歩

