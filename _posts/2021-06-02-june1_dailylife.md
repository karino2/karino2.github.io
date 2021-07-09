---
title: 6月上旬
layout: page
---

## 2021-06-02 （水）

さて、無職になったので何をやっていこうかしら？

とりあえず書きかけだったアプリとか更新をやっていこうかなぁ。
まず「てきすとでっき」でセッティング回りが無駄に分かりにくい所を直していこう。

FileNotFound exceptionをちゃんとハンドルして、refreshのメニューをつけた。
あとはopenとcreate回りを作ってsettingから行けるようにすれば割と普通のアプリになるかな。

共産党の街宣車みたいなのが「政府にワクチンの安全性を徹底的に追求していきます！」とか言っていて、
「え？野党はそっちに力入れてるの！？」ってなった。
人気取りとしてはもっと早く打てるように、の方が筋が良いと思うのだが。

### 海の公園の散歩

今の家のいい所は家から海の公園まで自転車でまぁまぁ近い事がある。
週に5回くらいは散歩している気がする。
整備されててそれなりに広くてそれなりに空いている公園というのは貴重だよなぁ。

### プレイリストを共有したい

Google Play Musicがディスコンという事でプレイリストを複数デバイスで共有したい問題と向き合う。
powerampのm3uフォーマットが単なるテキストファイルで、さらに相対パスでも動くのでUIからプレイリストを作ったあとにエディタで相対パスに直せばフォルダに置いとくだけで共有出来そう。

powerampはEXT-X-RATINGとかいうコメントっぽいのも必須だった。うーむ、かったるいが、全部powerampで統一すればいいか。

お、VLCプレーヤーでも再生出来るな。語学の勉強にはこっちのUIの方が使いやすいか？

追記： Powerampは設定をいろいろすると使いやすくなる。戻るで頭出し、クロスフェードをオフ、静的なシークバーなど。

## 2021-06-08 (火)

週末はサーフィンから帰ってきたあとあまりにも疲れていてそのまま頭痛がするようになり、２日ほど寝込んでいた。
頭痛は疲労と気圧と睡眠不足が重なったのが原因なのかなぁ。たまにあるんだよね。

寝ている間暇だったのでなろう小説をいろいろ読んでいたら、「	弱小領地の生存戦略！　～俺の領地が何度繰り返しても滅亡するんだけど。これ、どうしたら助かりますか？～ 」がなかなか面白くて、体調が治ったあともそのまま読んでいて昨日最新話に追いついた。

今日から生活を立て直していきたい。

[てきすとでっき](https://play.google.com/store/apps/details?id=io.github.karino2.textdeck) の更新をいろいろ。
StorageAccessFrameworkを真面目に使う事で、セットアップが難解だったのをちゃんと直す。
大分普通のアプリになった。

ついでにたまに古いメモが出る問題は手動でリロードするように変更。
GoogleDriveはだいたい100msecごとに6回くらい読むと最新のが返ってくるのは突き止めたが、さすがにそんな意味不明な挙動をコーディングするよりは手でリロードする方がいいだろう、という事で。

完成度は割と高い気がするがどうだろう？

## 2021-06-10 (木)

お気にの絵師、きみどり先生が、アイコン描くの数千円くらいで受け付けます、
と言ってたので、ファン活動の一貫として「いつなに」のアイコンを描いてもらおうと、作りかけだった「いつなに」の細かい所をちゃんと実装している。
あとは設定画面を「てきすとでっき」から持ってくればリリース出来るかな。
アイコン描く時間があるだろうからこの辺で頼んでみよう。

果物を10kg買うと、後半は傷みとの競争みたくなるので、もう少し少なく3kgの青りんごを買ってみた。
3kgってどれくらいかな？と思ったが、12個かぁ。2000円だったので一つ165円くらい？ちょっと高いね。
5kgがいいかなぁ。