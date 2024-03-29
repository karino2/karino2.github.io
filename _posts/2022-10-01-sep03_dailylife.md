---
title: 9月下旬の雑記
layout: page
---

## 2022-09-21 (水)

今日はあるある詐欺により、海に行ったがほとんど乗れなかった。
まぁ疲れ気味なのでいいか、とお仕事したりpodcast録ったり[728x](https://karino2.github.io/RandomThoughts/728x)のWeek2の試験の続きをしたり。

## 2022-09-22 (木)

今日は真面目にお仕事。結構進んだ。
あれ？明日も祝日？
それなら今週分くらいはもう働いた気もするが。
ただ土曜あたりからまた波が来そうなので、
明日はむしろ働いておいてもいいかもしれないなぁ。

[728x](https://karino2.github.io/RandomThoughts/728x)のWeek2の試験をようやく終えるなどした。
なんか2.5週間くらい掛かった気もするが、なんとか終えたぜ。
感覚的にはWeek3とか4あたりまで終えれば最後までやれそうな気がするのでもう少し頑張りたい所。

夜は[FSharpLesson](https://karino2.github.io/RandomThoughts/FSharpLesson)の続きを書くなど。割と骨格は出来てきたかなぁ。

## 2022-09-23 (金)

今日はあまり波が上がってこなかったので真面目にお仕事。
本当は祝日らしいが、まぁいいだろう。

最近MacのEdgeがたまにCPU100%で回り続けるようになったのでググっていたら以下のredditを見つける。

[100% CPU usage since Edge 105 on Mac M1 ? : MicrosoftEdge](https://www.reddit.com/r/MicrosoftEdge/comments/x89osx/100_cpu_usage_since_edge_105_on_mac_m1/)

やり方が良く分からなかったが、以下のようにしてみた。

```
$ open /Applications/Microsoft\ Edge.app --args --enable-features=msSmartScreenLegacyDisabled
```

今の所平気そう？＞追記：やはりダメでした。再現してる。Dev版にしてみる。こちらは平気そう。今のバージョンは 105.0.1343.53なのでもう少し新しいバージョンが出たら試す。

## 2022-09-25 （日）

昨日サーフィンに行ったらやけに疲れて、今朝はずっと寝ていた。久しぶりに翌日まで持ち越したのだが、
昨日はそんなにハードという訳でも無かったんだけどなぁ。

午後は溜まってた書類関係を片付ける。住民票を移した関係でちょくちょく書類関連がやってくるのだよな。

どうも疲れ気味なのでゴロゴロしつつニコ動で将棋のゆっくり実況を見るなど。
そういえば糖質が足りてないかもしれない。ちょうど糖質用のゼリー切らしているので。

## 2022-09-26 (月)

今日は真面目にお仕事。予約語を足してシンタックスのバックトラックを減らしたり。こういうのは言語作ってるって感じするよなぁ。

Electron版の[TeFWiki](https://karino2.github.io/RandomThoughts/TeFWiki)のulのpaddingが広すぎる気がしたので調整するなど。
ノートとしては箇条書きのネストは結構出てくるのだが、それがあまりキレイにネストっぽく見えないのだよね。
リリースは気が向いた時にやればいいか。

## 2022-09-27 （火）

今日は品川にお出かけ。ようやくコロナも落ち着いてきたということで。
そのほか役所巡りも。
10時ころの電車で普通に座れた。
結構空いてるな。

電車ではクヌース先生の本でソートのあたりを読む。
最初は順列的な数学の話も読んでたが、別に新たなソートのアルゴリズムを作りたい訳では無いなら不要だな、と思い飛ばす事に。

役所をいろいろ巡る。
この手のは、やる前は億劫だが、片付けると達成感があるよね。

最後に銀行に行ったらすでに窓口閉まってた。15時ってめちゃ早いな。
ただ銀行は家のそばの支店でも多分平気と思うのでまぁいいか。

## 2022-09-29 (木)

今日は真面目にお仕事。
内部ツリーの構造が良くないなぁ、とツリーの形を変更して、それに合わせて文法も変更したりしている。
こういうのはなんかプログラミングしているなぁ、という満足度が高い。

MacのPDFリーダーをいろいろ探すなど＞[Mac](https://karino2.github.io/RandomThoughts/Mac)

## 2022-09-30 (金)

ぐぬぬ、波が入らなかった…という事で真面目にお仕事。
昨日に引き続き大きめの構造変更でこれまで手抜きだった部分がだいぶまともになってきた。
こういう大きな変更がたくさんできるのはリリースしてないアプリの強いだよなぁ。

夕方は[【書籍】TheArtOfComputerProgramming](https://karino2.github.io/RandomThoughts/【書籍】TheArtOfComputerProgramming)を読むなど。ソート回りをちょっと仕事で使いたいのでソートを読んでて、
MIXアセンブリを理解した方がいいかな、と思って一巻に戻ったりしていた。
このアセンブリもまた難解だな。自己書き換えするし構造化されてない書き方をするので読みづらい。