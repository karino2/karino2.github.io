---
title: 論文メモ
layout: page
---

とりあえずちらっと見た、みたいな論文をメモしておく場所。
開いたはいいがあんまり読まなかった物とかはあまりブログにならないのだが、そうするとあとで「あー、前ちらっと見たがあの論文どこだったかなぁ」となった時に探せなくなるので、ちらっと見た程度の事をメモしておく場所を作る。

### Trellis Net

[arXiv:1810.06682 Trellis Networks for Sequence Modeling](https://arxiv.org/abs/1810.06682)

[系列データを扱うモデルは何が良いのか？]({% post_url 2019-06-05-seqlearn %})で一番最新のがこれ。
あまり真面目には読んでないが、convolutionのレイヤ間も同じweightを使う、という構造。
展開したRNN的になるという事かな。

### Self attention回り

Trellis Netの論文で、self attentionの文脈で参照されていたので以下の論文を読む。

[[1806.01822] Relational recurrent neural networks](https://arxiv.org/abs/1806.01822)

タイトルからはそうは見えないが、self attentionを使ってメモリ回りの学習が中心。
multihead attentionの解説はTransformer論文よりだいぶ分かりやすい。

メモリという行列があった時に、それをself attentionで更新する。
また新たな入力があった時に新たな入力を含めて更新する。
これが基本で、それを何かに組み込んで使いましょう、という話。

論文ではLSTMに組み込んでいて、これはLSTMのcに相当する物（stateのうち長期を保存する物）をこのメモリで置き換える、というモデル。
LSTMの拡張として使えそうなのでいいかもね。

