---
title: System Verilogを書くぞ！
layout: page
---

[読書記録: ディジタル回路設計とコンピュータアーキテクチャ](https://karino2.github.io/2019/09/09/000435.html)を読みながら、いろいろ書いてみる時の記録。
環境設定とか適当にやってしまって記録が残ってないが、心を入れ替えてここからは記録を取る。
FPGAでLチカくらいはやった。

まずVivadoというIDEで開発していく事にする。あまりにもかったるかったらエディタでの開発環境を整えるが、ゆとりとしてはIDEでぽちぽちやりたい。

以後System Verilogを書いて行くが、面倒なのでVerilog、と記す。ゆとりなので細かい事は気にしない。

### 初めてのテストベンチ

細かなモジュールとかを書いて挙動を調べるのは、シミュレータというのでやる物らしい。
で、シミュレータではテストベンチというのを書いてモジュールをテストするらしい。

という事で、このテストベンチで何かをテストする、というのを書いてみる事から始めたい。
題材としては、書籍の4.9にテストベンチのコードがあるsillyfunctionでやってみる。

とりあえずプロジェクトを作る。
4章の演習問題を全部一つのプロジェクトに入れるのは取り回しが悪そうなので、3つくらいのプロジェクトに分けるかな。
chapter4_1というプロジェクトを作る。

次にsillyfunction.svというファイルを作り、sillyfunctionの実装をへこへこ書く。

テストベンチは普通はファイル分けるらしいが、今回は動作確認なので同じファイルでもいいかな。
ちょっと同じファイルにテストベンチも書いてみよう。

モジュール名はchapter4_1の前半で被らないように、testbench_sillyfunctionにしよう。長いがゆとりなので。

中身としてはとりあえず000と001のテストだけ書いて動かしてみよう。
どうやって動かすんだろう？

Runのアイコン（緑の右三角）を押して、Run synthesisというのを選んでみた。右上の所に Running synth_designって出てくるくる回ってる。しばらく待つか。
お、合成が成功した、と出てきて、三つの選択肢が出てきた。Run Implementationを選んでみるか。

おや、エラーになった。Design is emptyとPlacer could not place all instancesと言われた。

走らせたものが間違っているのか？なんか前はRun simulationというのを選んでビヘイビアがどうこう、とか選んだ記憶があるな。

左のペインにRun simulationというのがツリーのSimulationの中に入っているな。これを選んでみるか。
おー、出来た。波形が見れる。いいね。

少し変えてみた。ちゃんと動いてそう。よしよし。
一応failしたケースの挙動も調べておくか。`$error`というのを使っているのだが。assertをfailするように変更。

ん？何も起こらないが。
しばらく格闘した結果、Tcl consoleに出ているが流れて気づいていなかった、という結論っぽい。
`$display`というのもあるな。これは標準出力に出す、errorは標準エラー出力に出す、という所か。なるほど。

よし、これで作業を続けていけそうだな。

現状、Run Simulationとやると全テストベンチが流れてしまう。これはちと都合が悪いな。
選んで実行とかできないのだろうか？
Disable fileというのがあるな。これでテストをdisableにしておけばいいのか。

### 演習問題 4.3 xorを実装せよ

やってみよう。xorは予約語だから使えない、と言われた。myxorという名前にするか。

4入力のxor、期待する振る舞いはなんだろう？多入力ゲートは1.5.6節にあるな。
TRUEが奇数個ならTRUEを出力するらしい。

どう実装するのがいいかしら？4入力なら組み合わせは16個か？TRUEになるだけでいいので半数の8個くらいか。
この位ならcaseで書けばいい気もするな。

caseを使う場合はassignでいいんだっけ？4.5.4を見ると、caseを使う場合はブロッキング割り当てを使うのが良さそう。
それぞれの違いを軽く見直しておく。ノンブロッキングは並列に評価されるみたいな挙動か。
一応説明を読み直したが、とりあえず心を無にしてこのガイドラインに従って、always_combの時はブロッキング割り当てを使おう。

caseでは奇数でも偶数でもどちらか一つをセットすれば良い。
奇数個と偶数個はどっちが少ないか？偶数個は2個と4個。4個は一通り、2個は4C2で6通りか？
奇数個は1個と3個でどちらも4通りか。おや。偶数個の方が一つ少ない。まぁ一つくらいならいいか。

よし、出来た。
`logic [3:0] a, y;`とやったらyも4bit幅になっているというバグを入れてしまっていたが、無事デバッグも出来た。
よしよし。

### レポジトリを作ろう

進捗を見せるという点でも、githubに上げておく方が良かろう。という事でレポジトリを作りたい。
プロジェクトのディレクトリを眺めると、chapter4_1/chapter4_1.srcs/sources_1/new の下だけで良さそうか？
newってのが何なのか知らないが。

この本の英語名はなんだっけ。DDCAでいいか。ではDDCA_exerciseで行こう。
レポジトリ一つに全部入れたい気もするが、XilinxのIDEの構成と共存するのが難しいな。

シンボリックリンクを貼ったらgitはsymlinkはadd出来んと言われる。そうか。
ハードリンクなら？と思ったがハードリンクはファイルごとにやらないとダメそう。そりゃそうだな。

うーん、逆にxilinxの方のディレクトリをシンボリックリンクにしたらどうだろう？やってみよう。
mklinkコマンド、ちょくちょく出番あるよな。

よし、ちゃんと動いているね。

[https://github.com/karino2/DDCA_exercise](https://github.com/karino2/DDCA_exercise)