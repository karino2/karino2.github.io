---
title: 11月上旬の雑記
layout: page
---

## 2022-11-01 (火)

おや、もう11月。まじか。

今週からはWindowsのお仕事なので久しぶりにWindowsの開発環境を整えたりしている。
CMake+Ninja+VSCodeかなぁ、と思いつつ、VSも少し使ってみようかなぁ、とか。

## 2022-11-02 (水)

なんか副反応をやり過ごすべく寝まくっていたら、寝るのと起きるのが2時間くらい遅くなってしまった。明日から前倒しするかなぁ。

## 2022-11-04 (金)

サーフィン、昨日は荒れててあんまり乗れず。今日は着いた時には波が落ちてしまってあまり乗れず、
で2連続でいまいち。健康診断が終わったらまた伊豆行きたいなぁ。

今日はサーフィンから帰ってきてから普通にお仕事。Windows上での環境構築はまぁまぁ出来た。
ついでにWindows上で見つかったバグをいろいろ直す。

## 2022-11-05 (土)

- [Link: Performing Calculations on a GPU - Apple Developer Documentation – 法蓮草の森](https://records.dodgson.org/2022/11/04/link-performing-calculations-on-a-gpu-apple-developer-documentation/)
- [ARM GPU Cores – 法蓮草の森](https://records.dodgson.org/2022/11/04/arm-gpu-cores/)

Metalはプラットフォーム提供者が提供してくれてるがゆえのお手軽さがCUDAよりいいですよ。まぁそれは技術自体の問題では無いのではないか、という話もあるけれど。

なおSMとかの話は自分もそれなりに調べたのだが結局良く分からなんのだが、自分のデバイスだとアプリ側からはスレッドは1024本あるように見えて、
使ってる分には同時に1024本動いていると考えて支障は無い印象。具体的にはいっぱいスレッド動かした方が早い。
自分の手元のiPad ProはARM世代だけど、それでも結構早い。
for文よりもディスパッチの方が早いだけかもしれないけれど、FLOPS単位で限界にチャレンジしない以上、使う側からはその辺は区別のしようが無い感じ。
特定のデバイスで限界を追求するよりは、デバイスのグレードを上げるとちゃんとスケールするとかの方が重要になる気がしていて、その辺はHPCと違う所だなぁ、と思っている。

ハードウェアスペック的には単純に同時に動くハードウェアスレッドの数が知りたい、という気持ちもあるが、ワープ単位でいろいろ隠蔽したりもするのでそういう指標が正しいのかも良く分からず、まぁこの辺はシンプルに何かを知るのは難しいよなぁ、という話もありますね（昔触ってたスパコン用GPGPUはPEが4スレッドx2の構成で同時に動くのは4スレッドだがストールすると後ろの4スレッドになる、とかで、これを4とすべきか8とすべきかは良く分からない所）。

パフォーマンス的にはARM版のiPad Proでも手元のIntel Mac Book Proよりも数倍遅いくらいの速度は出ている模様。使ってる印象では結構早いし（CPUとは段違いに早い）、結構パラレルに動いてくれている気がする。
M1 のMac BookとiPadの比較もそのうちやりたい所。

なお、Metalではローカル変数の配列はレジスタにマップされるようで、例えば

```
   float buf[3*1024];
```

とか(C言語の意味での）ローカル変数で定義すると、自分のARM系のiPad Proだとレジスタ数が足りない、とか言われる。
6kBytesくらいまでは取れた。ARM版もけっこうレジスタたくさんありそう。

AndroidもOpenGL ESまではそれなりに皆が使えるように出来たのに、Computing Shaderが無いのはなんとかして欲しい所ですね〜。
まぁそこまでやる気になるタブレット市場があるのか？と言われると微妙だが、そういう所を整備しないのでそういう市場が無いという話のような気もする。

### もうひとつやる事を考える

[サーフィンと仕事以外にやる事を考える - なーんだ、ただの水たまりじゃないか](https://karino2.github.io/2022/11/05/surf_work_and.html)

という事で何やったもんかなぁ。休日に波が無いとやる事が無いんだよな。

とりあえずイタリア語をやってみようと思い、入門書をポチる。[【書籍】これからはじめるイタリア語入門](https://karino2.github.io/RandomThoughts/【書籍】これからはじめるイタリア語入門)

## 2022-11-06 (日)

イタリア語をやったりギターを弾いたり。イタリア語を再開したのは結構良い気がする。
夕方はpodcast聞きつつステッパーでもやるかなぁ。

## 2022-11-07 (月)

お仕事でDirectXを触るなど。自分が最後に触ったのは15年前とかなので、環境周りはかなり別世界になっていて調べるのは楽しい。
先週のWindows上でのCMake環境構築からこの辺の話は結構やってて楽しいので、どうしても働きすぎてしまうなぁ。
まぁ動くようになったあとは巡航速度に戻るだろうから、この辺を頑張りすぎてしまうのはまぁいいか、という話もある。

この辺が触ってて楽しいのは、昔いろいろ面倒だった事情がいろいろ改善されている所だよなぁ。具体的にはWIndows 10にはDirectX 12がプレインストールされてるとか、Windows SDKにDirectSDK相当のものがあらかじめ入っているとかそういうの。

最近はけっこう仕事が楽しいのはいいね。結果もついてきてくれると言う事無いんだが。

## 2022-11-08 (火)

twitterの話はあまり交じる気はなかったし、誰についての何の話かは分かってないが、[kyanny's blogでその程度の仕事で最高とか言ってるなよ](https://blog.kyanny.me/entry/2022/11/07/233149)というのは割と同意する事が自分も多い。
社内でお互いをリスペクトしているのは良い事だと思うのだけれど、
その結果自分たちの客観評価を見誤りがちと思うシーンは良く見かける。
それはby designだとは思うので、外に何かを言う時にそのまま垂れ流さないように気をつければそれでいいいのかもしれないが。

ま、他人の事より自分の事だよな。今回の仕事が大きなアウトプットになってくれるように頑張りたい所。

## 2022-11-09 (水)

昨日はサーフィンに出てあんまり働かなかったので今日は働こうと思うがどうも手が動かないな。
これは次にやるタスクが不確定性が多いからなんだろうなぁ、と思う。何をやるかをもうちょっとはっきりさせる所から始めるべきか。

## 2022-11-10 (木)

DirectComputeの分かってない所をいろいろお勉強して、だいたい必要な事は理解出来た。
DeviceとかContextとかBufferのRAIIラッパをつくったりしている。
とりあえず試すよりも先にこの辺作るのはいまいちだなぁ、と思うんだけど、
とりあえず試すコードがこの辺が無いとかったるいので仕方なし。

なんか技術エッセイ系を書きたいな。技術じゃなくてもいいんだが、少しは分量のある文章を書きたい気がする。前やってたmessage passingくらいの長さくらいの。
