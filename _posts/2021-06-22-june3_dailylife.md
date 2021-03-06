---
title: 6月下旬
layout: page
---

## 2021-06-22 (火)

気づけばもう6月も下旬か。最近は割と充実した生活は送れている気がする。ギターが少し足りてない気がするので、ギターはもうちょっと弾きたいなぁ。

最近サーフィンとかすると２日くらい疲労が残る。サーフィンした翌日は15時間くらい寝ていて、その次の日も少し眠さが残って行動すると頭痛くなりそうな予感がする（のでいつもゴロゴロして過ごしている）。三日目からは普通に戻る。

単に歳って可能性もあるけれど、なんか炭水化物が足りてない気もするんだよなぁ。
今度運動する時はその前後に少し炭水化物を増やしてみようかな。
高齢者向け配食サービスは運動しないとちょうど良いくらいのカロリーなんだが、運動するには足りてない気もする。

Jetpack Composeで段落ごとに編集できるMarkdown Editorを作るの、Jetpack Compose側はとりあえず完成。
あとは保存と入出力回りを書いてドッグフードは開始できる感じに。
ドッグフードとしてはいい感じのものが出来たが、正式にリリースするのは先が長そうだな…

## 2021-06-23 (水)

こんなコードを書いたら、

```kotlin
newBlockList.map { it.src }
  .joinToString("")
 .also { saveMd(it) }
```

simplifyできるよ、とtooltipが言ってきて、alt enterしたら以下になった。

```kotlin
newBlockList.joinToString("") { it.src }
 .also { saveMd(it) }
```

joinToStringがtransformerを渡せるのでこうできるとの事だが、これはシンプルになっているかね？
パイプライン的には上の方がシンプルと思うのだが。

MDTouchはドッグフード開始出来そうなくらいは出来たな。可能性を感じる出来ではある。

## 2021-06-25 (金)

昔TOEFL用に買った参考書が生物とか結構詳しかったような？と思ってsdcardの中を見ると、
昔ScanSnapでスキャンしたpdfファイルが。これは埋め込みjpegなんだが、スキャンの自動フィードがまだいまいちだった時代でいくつかのファイルに分かれているのだよねぇ。

これまでの人生でこのpdfからjpegを連番で抜き出すプログラムを何度か書いているのだが、

1. C# どっか行った
2. PowerShell どっか行った
3. Swift 古すぎて今のSwiftに直すのが面倒
4. Androidアプリ 古くてストレージ回りがちょっと動かなさそうだがそこだけ直せば動くかも？（ただAsyncTaskとか使ってる…）

という事で、いい加減どうにかしたい。
Androidは必要になったら手直しすれば良いが、今回はMac Book上でやりたいなぁ。

Android版はUIに依存しない所はファイルが分かれててこれはそのまま動きそうなので、mainだけ書いてやればコンソールアプリに出来そう？
ただJavaのコンソールアプリを作るIDE的な物が無い。

javacとjavaは入ってた。じゃあ理論上は手作業でjavac呼んで、javaコマンドに食わせればいいはずだよな？

という事でやってみた。
昔のJavaコードが何も問題無くコンパイル出来て動くのはjava素晴らしいねぇ。

import手書きとかだるすぎて辛いけれど、結構すぐに動いて割といい感じになった。

こういう一瞬で出来たものをgithubに上げないからどっか行ってしまうのだ、と今回は反省してgithubに上げる。

[github: pdf2jpeg_java](https://github.com/karino2/pdf2jpeg_java)

これでjavacとjavaが動けば使えるコマンドラインツールが出来た。本当は.NET Core SDKで動く形にしておきたかったが、面倒なのでこれで妥協。

## 2021-06-26 (土)

Jetpack Composeでマークダウンのエディタを書く企画、まぁまぁ実用できる所までは来たな。
細かい所でドッグフードクオリティではあるが、使い心地は圧倒的に良い。
長いマークダウンをタッチで編集するならこのUIしか無いよな。

### VSCodeでgithubを開く、Remote Repositories拡張がなかなかいい

ごうさんに教えてもらって、[Remote Repositorie拡張](https://marketplace.visualstudio.com/items?itemName=github.remotehub)を入れてみたが、なかなかいいね。
検索とかファイルブラウズがCmd+Pとかも含めてちゃんと動く。

VSCodeはどんどん良くなるよなぁ。

### TopAppBarの動画を見る

そういえばMDTouchにタイトルバーが無いな、と気づく。要るかどうかは微妙だが、Jetpack Composeでどうなってるかを軽く見てみるか、と見てみる。

[Exploring Jetpack Compose: TopAppBar](https://medium.com/google-developer-experts/exploring-jetpack-compose-topappbar-c8b79893be34)

ふむ、とりあえず基本的な所は理解した。まだ一定以上になったらメニューの中に入る奴(ifRoomとか)は実装されてないっぽいがどうするんだろうね？

どうやってauto hideとかやるのかなぁ、とか知りたかったが、上記動画では単にColumnに入れてるな。うーん、ちょっと違うような？

少しググったら [Scrollable TopAppBar with Jetpack Compose](https://proandroiddev.com/scrollable-topappbar-with-jetpack-compose-bf22ca900cfe) のコメントに正しいやり方が載っていて、[JohannBlake/navigation-with-animated-transitions-using-jetpack-compose](https://github.com/JohannBlake/navigation-with-animated-transitions-using-jetpack-compose)でデモ実装があるとの事。

ちらっと見ると、この辺のNestedScrollConnectionという奴か？ [PetsListUI.kt#L99](https://github.com/JohannBlake/navigation-with-animated-transitions-using-jetpack-compose/blob/main/app/src/main/java/dev/wirespec/adoptme/ui/screens/petslist/PetsListUI.kt#L99)

え？こんなの自分で書かないといけないの？だるいんだけど。

まぁいいや、必要になったらこの辺を真似すれば良いという事で。
Material Design対応っていいつつこういうのデフォルトで用意されてないってどうなのかねぇ。

## 2021-06-27 (日)

最近はかばんを持ち歩かず、スマホを胸ポケットに入れてストラップで首に紐をかけ、鍵はチェーンでジーパンにつないでた。
このカバンレスでの散歩はなかなか快適で良いなぁ、と思っていたのだが、
夏になってきて、短パンとTシャツになると、胸ポケットもズボンに鍵をかける所も無くて、どうしよっかなぁ、と考えている。

なんか胸から下げる感じがいいかしら？ただ裸でぶら下げるのは自転車とか乗るのでちょっと怖いんだよなぁ。落ちそうで。
鍵もなんかの中に入ってる安心感は欲しい。
ただカバンほど邪魔になってほしくも無い。

うーん、と悩みAEONを歩いていたら、1200円くらいでいい感じの財布を見つける。
これで良い気はするが、財布である必要は無いんだよなぁ、もっとしょぼい物でもいい気がするんだが…
という事でスルーして、ダイソーで200円のパスケースを買ってみた。楽天miniくらいは入るのだが、鍵が入らん…
鍵は鍵で鍵用ケースみたいなの買ってこれにつけるかなぁ。

### 趣味コードいろいろ

Jetpack Composeのお勉強目的で作ったマークダウンエディタ、MDTouchだが、細かい所をちょくちょく直していったら割と使いやすい感じになってきた。
もうこれでリリースしてしまってもいいかなぁ。アイコンとかどうするか決めないといけないが。

もうちょっと触ってみて問題なさそうならリリースするか。

これでひとまず完成、という事で、次は何やろっかなぁ。

- guashの細かい所を直してHNに出してみる
- uitの続きを実装
- 手書き版AnkiDroid的なアプリを作る

この辺が候補だが。とりあえずもうちょっとJetpack Composeをいじってみたいので、手書きAnkiDroid的なアプリを作るかなぁ。

### QuickEdit Proを購入

エディタくらい買わんでもいいだろう、とも思うのだが、いい感じに納得する振る舞いをするエディタが意外と少なくて、
QuickEditは普通にちゃんと動いていたのと、セールで200円だったので、
まぁいいか、と買う事にする。

Androidではちゃんと普通に動く、は結構競争力になってるよなぁ。

古いアプリは最近のファイラーからは開けなかったりするし。

## 2021-06-29 (火)

昨日は結構限界までサーフィンやったので今日は一日寝てるか？と思ったが、起きたら割と回復していた。
多少の疲労は残っているが頭痛とかは無い。
多めにいろいろ食べたのが良かったのか、体が慣れてきたのか。
どっちにしろ活動出来る日が一日減らないのはありがたい。

生物関連の英単語帳を眺める。

英単語の勉強するとかすごい久しぶりだなぁ。下手したら20年ぶりくらいか？それは無いか、社会人の初期ではまぁまぁ単語帳っぽい奴のディクテとかやってたし。