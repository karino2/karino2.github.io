---
title: 最近のFPGAいじりの話（DDRアクセスが動いた！）
layout: page
---

技術的な話は以下に書いてあるが、近況などを。

[Tiny SIMTを作ろう](https://karino2.github.io/2019/10/02/tinysimd.html)

というか今日DMAのコードが動いた、という感動を書きたいだけだったりする。いやぁ、めっさ苦労したよ。
たぶん自力では動かせなかったと思うが、T先生には聞きまくってようやく動かせた（お世話になっております。そのうちなんか手伝うよ）。

教科書の通りにSRAMとレジスタファイルだけで動くmipsをパイプラインでシミュレータ上で動かす、という状態から、
FPGA上でDDRとつなげる、という状態までの労力の差はやってみないと分からない世界ですなぁ。
クロックがDDRに引きずられて自由度が落ちるので、タイミング回りも一気にシビアになる。

合成は二時間とかかかってしまって、非常に非効率なトライアンドエラーを繰り返していたので、
凄い時間をこの作業に費やしている。流している間は他の事をやればいいし実際やるけど、
気になっていまいち大きな作業は出来なくてちまちました事ばかりやりがち。
これは機械学習のトレーニング流すのと似た話ですが。
ベテランならもっと効率的にぱっぱと片付けるのだろうけれど、自分は初心者なので素直に時間を突っ込んだ。
こういう時間がかかるのをずーっとやってると、それはそれで大変だよねぇ。

こればっかやってる結果他の事がいろいろ滞っているが、一度はやっておく価値のある事をやっているなぁ、と思うので満足はしている。
やっぱこういう良く分からない事に延々と時間をつっこめるのが無職のいい所だよね。

いやぁ、それにしても動いたぜ！やったぜ！頑張ったぜ！
まぁまだ肝心のマルチコア化が出来てないが。