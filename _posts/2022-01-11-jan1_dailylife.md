---
title: 1月上旬の雑記
layout: page
---

## 2022-01-01

あけおめ。今年は仕事の方が良い成果になるといいなぁ。

午後は今年の抱負を考えるなどした。今年はお仕事頑張る年かね。

[【書籍】RforDataScience](https://karino2.github.io/RandomThoughts/【書籍】RforDataScience)を読むなど。dplyrはなかなか良いな。
F#で書く時にもっといろんな事をこういう感じで統一的に書けないかなぁ。

### 入力時のワーニング

guashで一覧から選ぶ時、`_TIPropertyValueIsValid called with 4 on nil context!`とか出るようになって、何これ？と思ってググってみた。

[_TIPropertyValueIsValid called with 4 on nil context!が出る原因と対処法 - yu9824's Notes](https://note.yu9824.com/error/2021/08/28/matplotlib-warning-TIPropertyValueIsValid.html)

なんか自分のせいでは無さそうだなぁ。うんざりだがほっとくしか無いか。

## 2022-01-02 (日)

ファイル名に【書籍】と入っているものの一覧をlsとかで列挙して「書籍.md」ファイルを生成する、というシェルスクリプトを書く。
[書籍](https://karino2.github.io/RandomThoughts/書籍)はこれで生成する事に。

ファイル名をWIkiNameにするという選択は制約も多いけれど、その制約を採用する事でこうしたシェルスクリプトで拡張するのが容易になるんだよな。Unix的だ。

昨日[guash](https://karino2.github.io/RandomThoughts/guash)でファイル一覧からwikilink作ってクリップボードに入れるを作ってスポットライトから実行する事で、
長い書籍名のリンクも簡単に貼れるようになったのもこのUnix的な解法の延長と思うし、
機能をアプリの中に作り込まずに外に作れるようにするってのは強力だよなぁ。

.commadの拡張子のファイルをスポットライトから実行するのは体験が良い。

午前中は[【書籍】RforDataScience](https://karino2.github.io/RandomThoughts/【書籍】RforDataScience)を読むなど。dplyrは素晴らしいね。

### 沖縄はしばらく行かない事に

新年からUSでCovid-19がやばいくらい広まっていて沖縄も飛び火しそうな気配なので、沖縄行くのはやめておく。

代わりに八丈島とかどうかな〜？と検索している。
楽天トラベルで見てみると宿はまぁまぁある印象。
WiMaxが入らないがPocketWiFiは入るようなので、これをレンタルすれば行けるか？

WiMaxレンタルしている所で２つレンタルするのもなぁ、という気もするが、
それで仕事のやる気が出て寒くも無いなら行ってみる価値はあるだろう。

[八丈島計画](https://karino2.github.io/RandomThoughts/八丈島計画) ページをつくる事に。

## 2022-01-03 (月)

今日で三が日も終わりか。結局三が日は[BaseFood](https://karino2.github.io/RandomThoughts/BaseFood)しか食べなかったなぁ。

[【書籍】RforDataScience](https://karino2.github.io/RandomThoughts/【書籍】RforDataScience)を読んでいて、ファイル操作もgrammar的な事が作れないかなぁ、と思う。
これは前から思っている事なんだが。

[GoFO](https://karino2.github.io/RandomThoughts/GoFO)というページを作る。

### 化け学の勉強

年始は暇つぶし的に、[化学](https://karino2.github.io/RandomThoughts/化学)の動画でも見ようかなぁ、といろいろ物色している。
結局CourseraのIntroduction to Chemistry: Structures and Solutionsを見ていく感じになるかな。

最後までやる気は無くて、edXの分子生物学のコースが始まったらやめようと思っている。

## 2022-01-04 (火)

配食サービスがやってきて三が日の終わりを知る。そろそろ通常営業かねぇ。
そろそろ来週に向けていろいろ計画するか。

Courseraの[化学](https://karino2.github.io/RandomThoughts/化学)のコース、ちょっとメモを残したくなったのでページを作る。[IntroductionToChemistry](https://karino2.github.io/RandomThoughts/IntroductionToChemistry)。

### タブレットスタンドを購入

ステッパーをしながら動画を見るのにスタンドが欲しいな、と思い、タブレットスタンドを買う。＞[タブレットスタンド](https://karino2.github.io/RandomThoughts/タブレットスタンド)

## 2022-01-06 (木)

タブレットスタンドが届いたヽ(´ー｀)ノ

という事で組み立てる。最初玉に突っ込むところが結構力を入れないと入らなくてどう組み立てるのか戸惑ったが、力こそパワー。

### しばらく引きこもりかな〜

Covid-19が急激に増えてきたので、ワーケーションの予定は中断してしばらく引きこもるかなぁ。
キャリーバッグ買っちゃったが(´・ω・｀)

### Compose for Desktopってどうなんだろう？

RSSを消化していて、以下の記事を見た（なお動画は出来が悪すぎて序盤で挫折）

[JetBrains Toolbox Case Study: Moving 1M users to Kotlin & Compose Multiplatform ｜ The Kotlin Blog](https://blog.jetbrains.com/kotlin/2021/12/compose-multiplatform-toolbox-case-study/)

前見た時はalpha版、って感じだったが、意外とできてるのか？Compose Desktop。
ちょっと評価してみようかなぁ。

この記事の話に出てきたJetBrains Toolboxというのを試しに入れてみたがめっちゃいまいちだな。
ウィンドウが動かせないしシステムメニュー使わないし。これは酷いなぁ。
もうちょっとマシな例はあるはずだが。

少しHello worldをビルドして動かしてみたがめちゃくちゃ遅くてボタンも反応悪くて調べる気をなくすなぁ。
もう少し経ったらまた見るか。

ついでに[KotinNative](https://karino2.github.io/RandomThoughts/KotinNative)と[ScalaNative](https://karino2.github.io/RandomThoughts/ScalaNative)周りのドキュメントや動画などを見たり。
どちらも結構良く出来ていて、何か使い道が無いかなぁ、とか考えるなど。

## 2022-01-07 (金)

[【書籍】RforDataScience](https://karino2.github.io/RandomThoughts/【書籍】RforDataScience)を読み終わるなど。簡単に感想も末尾に書く。

次はなんかUNIXの思想的なのを読みたいな。[【書籍】TheArtOfUnixProgramming](https://karino2.github.io/RandomThoughts/【書籍】TheArtOfUnixProgramming)でも読むかなぁ。

## 2022-01-08 (土)

photinoの最新版をちょっと評価。まだMacのEditメニューは有効にならないのでコピペが使えない。
最近はコピペあんま使わないので最新版にあげてもいいのだが、そんなにメリットも無いのでまだローカルフォーク版を使い続ける事に。
PR作ってもいいんだが、それほどの情熱は無いんだよなぁ。
[guash](https://karino2.github.io/RandomThoughts/guash)以外にも使う用途がもうひとつくらいあれば真面目にcontributeするんだが。

Homebrewのドキュメントを読むなどした。だいたい理解。割と簡単で便利に使えそうなので自前tapを試してみたい。

夜になって、午前中にやったphotinoのバージョン上げがうまく行ってなかったのが気になってきたので真面目に調査。
結論としては、デフォルトで標準出力にログを出すようになっていて（！）シェルスクリプトに意図しない文字列を渡していた、というオチ。
このログは酷い…

一応上げたバージョンで動いてそうなのでgithubにはpushしておく。

その流れで、FSharpのパーサーなどを探してみる。[FPrasec](https://karino2.github.io/RandomThoughts/FPrasec)で良さそうという事でチュートリアルを見つつ簡単なサンプルを動かしたり。

## 2022-01-09 (日)

もう少しFPrasecのチュートリアルを読み進めつつ簡単なコードを動かしてみる。
だいたい使うのに必要な程度は理解出来たかなぁ。

[40代のプログラマ目標](https://karino2.github.io/RandomThoughts/40代のプログラマ目標)を書くなどする。こういうのを時間を取って考えながら書くのは必要な事だよなぁ。

### 夜

FParsecをいじっていたら夜になってしまった…

ただ、だいたいやりたい事は出来る程度の理解には到達したかな。

コマンドラインでちょっとしたパーサーが必要になるおもちゃ作る土台にはなりそうなので、
一度やっておくのは悪くない。

[【書籍】働く人のための、最強の休息法](https://karino2.github.io/RandomThoughts/【書籍】働く人のための、最強の休息法) 聞き終わり。ろくでも無い本ではあるが、俺もしっかり休まないとな、という気分を高めるにはこんなもんでも十分ではある。

## 2022-01-10 (月)

[GoFO](https://karino2.github.io/RandomThoughts/GoFO)が一通りアイデアを確認する程度は動く。
使ってみるまではまだまだ先は長いけれど、FParsecを理解する所でやる気を使い果たしたのでとりあえずここまで。
ただ今後はちょっとした遊び言語を作ってみるのにこの土台が使えるので、書き溜めとしてはなかなかいいんじゃないか。

### 夜

Electron版のTeFWikiのReloadが効いていない事に気づいたので直す。
ついでにhomebrew化してみようと思ったが、いくつか誤解していた所があって自分のやりたいようには出来ない事に気づく。
だいたい理解はしたと思うがやる気が尽きたのでまたの機会に。