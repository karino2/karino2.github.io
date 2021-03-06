---
title: F# でのfsxベースの開発
layout: page
---
自分はF# での開発は、基本的にfsx上でM-Enterしながら開発している。
ちょっと動作を確認、とかじゃなくて、プロジェクトの最初から最後の直前までずっとfsx上からしか実行しない。
ビルドも動作確認目的でしかしない。めんどくさいので最後までProgram.fs書かない事もある。

普通emacsとかでスクリプト言語開発するとみんなこういうスタイルだろうからあまり言及する必要無いか？と思ったが、
jmukとkzysがF# 触ってみてるのを見て、一応簡単に自分がどう開発しているか、と、ちょっとしたワークアラウンド的な事も解説してみようかと思って書いてみる。

fsharp scriptとfsの関係とかもちょっと入門者にはわかりにくいし（自分も良く分かってない）。

### 前提条件: F# の開発環境

今のところMac Bookで書いてます。

- .NET Core SDK
- VS Code
- VS CodeのIonide拡張

基本はIonideで開発している。

## 開発の流れ

最初からどう進めているか、の流れを簡単に書く。fsxベースで開発できる所がF# の魅力だ。他にもREPLベースで開発できる言語はたくさんあるのでそこまで珍しくもないが、
同じ型をちょっといじってなんどもevalする時の挙動が洗練されているのは.NETに慣れてない人には驚きもあるかもしれない（無いかもしれない）。

### プロジェクトディレクトリを作る

まず開発をするにあたりプロジェクトのディレクトリを作る。これはコマンドラインから。
プロジェクト名をXXXとすると，以下のコマンドを実行する。

```
% dotnet new console -lang "F#" -o XXX
```

で、作られるXXXをVSCodeで開く。

### Scratch.fsxというファイルを作る

さて、プロジェクトディレクトリを作ってVSCodeで開いたら最初に何やるか？というと、自分はScratch.fsxというファイルを作る。
名前から分かるようにemacsのscratchバッファのつもりで、最初に何も考えずにこのファイルを作っている。

で、ここにコードを書いて、行末でM-Enterで評価する（この文書ではevalとも呼ぶ事にする）。
複数行を評価したい時はその範囲を選択して、M-Enterする。
この時検索窓が出ていると複数選択のキーバインドとぶつかって選択になってしまうので注意（何度もこれやって大変腹立たしい）。

### fsharp scriptの話

fsxという拡張子はfsharp scriptというもので、ビルドをするのとは別の、fsiというREPLに食わせる為の拡張子らしい。
プロジェクトファイルとかは一切関係なく、単にfsharpモードが有効になるテキストファイル、と思って使っている。
dotnetコマンドでもfsiは立ち上げられるらしいが、自分はM-Enterで勝手に立ち上がる立ち上がるのしか使ったことが無い。

fsprojにリファレンスがあってもfsx的には関係なくて、fsxでも自分でパッケージとかはロードしないといけない。

fsharp scriptが凄いのは、型の定義が結構いい感じにできる所。
.NETみたいな環境って型が実行中に何度も変わるのって珍しいと思うのだけれど、fsharp scriptはかなり頑張る。
同じ型をちょっといじっては何度もevalしても結構平気。

ただ、当然型の定義を直してevalしたら、それを使ってるコードもevalしなおさないと古い型を参照したまんまになってしまう。
でも使ってる関数の定義の方をevalし忘れてコールすると、なんか型のバージョンが違う、みたいな割と分かりやすいエラーメッセージが出て感動してしまう。
MSすげぇ。

fsharp scriptはたぶんスクリプトとして成立させる為に.fsと違う所がいろいろあると思うのだけれど、
使っている分にはほとんど違いが分からない。load以外に何が違うんだろう？知らない。

めっちゃ良く出来ている。凄い。

### 溜まってきたらコードを.fsファイルに切り出す

コードが溜まってきたら、だんだんどこをevalしたらいいかとか分からなくなってくるし、eval範囲を選択するのもかったるくなってくるので、.fsファイルに切り出す。

例えばTwitterのデータのjsonをマークダウンに変換するコードならTwitter.fsというファイルを作って、そこにコードを移動する。
まずTwitter.fsの先頭は

```
module Twitter
```

という文で始めている。無くてもファイル名のnamespaceになって同じような意味になるからいらないらしいけれど、自分はmodule文は書いている。
深い意味は無い。

fsprojはファイルの順番が重要で、依存関係の順場に並んでいる必要がある。
なんかionideの一番左のバーの一番下のメニューでその順番を変えたりできる。

ただしばらくはfsxからしか使わないので、順番はどうでもいい（一応揃えておくけれど）。

Twitter.fsにコードを切り出したら、Scratch.fsxの先頭には

```
#load "Twitter.fs"

open Twitter
```

と書く。これはロードした後に名前空間を展開してそのままのコードが動くようにしている。

.fsファイルに切り出すけれど、実行はあくまでScratch.fsxからやる事に注意。
REPL的な関数のランチャー的に、開発の最後の手前までずっとScratch.fsxからしか実行しない。
コマンドライン的なCLIの代わりにScratch.fsxを使っているという側面もある訳です。

### Program.fsを使う時

だいたいScratch.fsxからしか実行しないので最初に作られたmain関数の入っているProgram.fsはずっといじらないままなのだけれど、たまに使う事もある。

まず、デバッガを貼ってステップ実行したい時はProgram.fsから呼ぶようにしている。
普段から、Scratch.fsxが大きくなってきたら適当な.fsに切り出していれば、デバッグしたい部分をProgram.fsから呼ぶようにしてビルドして実行するのはまったく苦労無くできる。
fsxとfsのシームレスさは感動するね。

普段から静的コード解析が行われてcode hintで正しくない所は直すように動機づけられるので、evalでだけ動くコードとかはすぐに無くなる（波線出てると気が散るので）。
これがevalベースで作ってても普通に.fs書いているのと同じ結果になる秘訣か？

あと一通りの機能の実装が終わってコマンドラインから実行したくなった時には、ようやく重い腰を上げてProgram.fsのmain関数を書いて、コマンドラインから実行できるようにしている。
ただこれは本当に最後だし、そこまでやらずにfsxから目的のタスクが終わってしまえばそこで満足してProgram.fsを作らない事も多い。
例えばtwitterのデータアーカイブのjsonからmarkdownを生成するのはScratch.fsxからマークダウン生成出来てしまったので、いまだにProgram.fsにしてない。

## 細かいTips

細かな事をほそぼそと。

### lintのdisable

fsharplintがコードの可読性を落とすような合成を薦めてきて気に食わないので、fsxの先頭の方で以下の文を入れてdisableしている。

```
// fsharplint:disable Hints
```

気に食わない物以外も全部disableされてしまっていまいちなのだけれど、ちょっと格闘してもいい感じに出来なかったので諦めた。

### REPLが変な状態になったらReload Window

なんかREPLやコードアナライザが変になったら、M-Shift-P して、Reloadとかタイプすると出てくる`Developer: Reload Window`というのをして再読み込みしている。
実はReloadって打って出てきたそれっぽいものを脊髄反射で選んでいるので、Reload Windowという名前だと今調べてコピペした。

例えばfsiを立ち上げ直したいだけなら終了する方法もあって最初はそういう事をやっていたが、最近はもう面倒なのでなんでもかんでもReload Windowしてる。

### UnitTestどうするか？

Unit Test、雑用ばかりなのであまり書いていないが、たまに書きたい事もある。
だがいまいちfsxと相性がいいのが無くて、結局テストを書きたい時は自分でassertっぽいのを作って書いている。

[github:uit SmokeTest.fsx](https://github.com/karino2/uit/blob/main/SmokeTest.fsx)を参照の事。
これの実行は普通にM-Enterしている。

## まとめ

F#の開発は、fsxをM-Enterしながら進めていく。決して簡単な動作確認だけじゃなく、複雑な型の定義からそれを使った関数まで、またコードが増えてきて複数ファイルに分割したあとも、
全部fsx上でevalしながら作っていく。
静的型付け言語なのでたまに変な事にもなるけれど、思ったよりもずっと頑張ってくれてたまにReload Windowしてやる優しささえあれば不満もほとんど無く開発できると思う。

REPLベースで開発をしていって勝手に豊富な型の階層が出来上がるのがF#開発の楽しさに思う。
REPLでこんなに型周りを繰り返しevalしてもこんなに動くの、ほんと凄い。

最近では割と普通の事なのかもしれないけれど、自分が昔IronPythonとか触ってた頃はこの辺もっと全然出来が悪くてねぇ。