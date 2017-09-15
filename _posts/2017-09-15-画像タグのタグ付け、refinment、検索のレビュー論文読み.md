---
title: "画像タグのタグ付け、refinment、検索のレビュー論文読み"
date: 2017-09-15 09:29:38
---

以下の論文を読みつつ、自分の感想などを書いていく。（14の意味は後述）  

[14] X. Li, T. Uricchio, L. Ballan, M. Bertini, C. G. M. Snoek, and A. del
Bimbo. Socializing the semantic gap: A comparative study on image
tag assignment, refinement and retreival, 2015.
http://arxiv.org/abs/1503.08248.

あくまで自分の書こうとしているネタとの絡みで書くので、他人向けというよりは自分用メモ。

以下の論文の参考文献の14番だったのが読むきっかけ。

Deep Classifiers from Image Tags in the Wild
http://dl.acm.org/citation.cfm?id=2814821

レビュー論文という事なので、この分野の全体像をつかむのに良いかな、と。

もともと

http://jbbs.shitaraba.net/bbs/read.cgi/study/12706/1504171870/4-

で読んでいたが、図をまぜたくなったのでブログに移行。
とりあえず向こうに書いた物をコピーする事からはじめる。

この論文では、

- Tag assignment
- Tag refinment
- Tag retrieval

の3つのタスクを軸にいろいろな論文を比較している。
うーむ、我々の関心はこのどれとも違うなぁ。

NUS-WIDEとMIRFlickrというデータセットがちょくちょく出てくる。
後者は我々も使えたら使いたいな。

2章を見ると、画像につけられたタグと、そのコンテンツのrelevancyを中心的な概念としてそれぞれのタスクを見ていく。

我らは別にタグと画像のrelevancyは問題としてないのだよな。
それよりも、タグ自体の性質を解析している。
そういう点ではここで紹介されてる既存研究とはやってる事がそもそも違う、とは言えそう。

ノーテーション。Dで定義されるimage-tag association matrixは以下。

![](https://i.imgur.com/080LdRq.jpg)

行が画像で列がタグ。

2.1の最後にTable Iの説明がある。
このテーブルがレビュー論文のレビューとしてのまとめになってそう。

2.2.2で言及されている、learn visual classifiers from socially tagged examples、というのはちょっと気になるな。

- Wang et al. 2009
- Chen et al. 2012
- Li and Snoek 2013
- Yang et al. 2014

この4つが挙げられていた。

画像とtagのmodalityをどうこう、と書いてある。
これは関係ありそう。

我々は自分たちの仕事をカテゴリ分類と捉えていたが、この論文のフォーマットに従うとタグassinmentと解釈出来るかな。  
なるほど。

2.3でtransductive learningという言葉があるので軽くググる。
ラベル有りデータとラベル無しデータが最初にあって、ラベル無しデータのラベルを予想する、というのがtransdtive learningらしい。

一般のデータ点について予測する関数を推計するのでは無く、既知の与えられたラベル無しデータだけ予想すれば良い、という場合。

---

以後ざっと眺めたが、ここから先はあまり必要そうには見えなかったので、ここまで。

2.2.2に挙げられている論文を以後は読んでいこう。
