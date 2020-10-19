---
title: Halideコード読み その1： realizeからlowerまで
layout: page
---

### はじめに

お仕事で計算グラフを作って最適化して動かすような物が必要になった。
Halideとは別物なんだが参考にはなりそうなので、Halideのソースを読もう、と決意した。

読んでいたのだが、なにか書き残さないと後でわからなくなりそうだなぁ、と思ったのと、
Halideのソース読みの範囲では仕事に関係ある事も無いのでここに書くか、と思い始めるシリーズ。

といってもコード読みブログはちゃんと書くと大変なので、今回はメモっぽい程度で。
ちゃんとブログの内容を理解したい人はソースコードと突き合わせて読む必要がある。
ただそんなのでもブログだけでも雰囲気はわかるかな？という期待が多少はある。


### 前準備

ソースは今とった最新（a189fd4）。
src下をwcしたら13万行。思ったよりでかいな！

VSCodeでフォルダごと開いてCMake toolsでブラウズ出来るようにした。
CMakeだとプロジェクト的に認識出来るのはなかなか便利で良いね。

Halide自身は[公式のチュートリアル](https://halide-lang.org/tutorials/tutorial_introduction.html)を一部飛ばしつつだいたい見た。これは「ここまでは要らないかな」というくらい細かい機能まで書かれているので、
ユーザーとして基礎知識を得るには十分と思う。

### コード読みメモ

コード読みのヒントになりそうなメモとか無いかな？とかREADMEとかをいろいろ漁るが大した物は無い。うぐぅ。

ファイル名とかフォルダ構成を眺める。フォルダ分けはあまりされてなく、フラットにファイルがずらずら追いてある。
こういうところを無駄に面倒にしないのは好感が持てるな。ただモジュール的な区分けがわかりにくいので初見のソース読み的にはやや困る。
CodeGenで始まるファイルが結構ある。これは中間コードから最終的なバイナリやコードを生成する所だろうな。

さて、どこから読んだものか。今回は計算グラフを作るところと中間コードを作るところを読みたい。
逆に中間コードから先は要らない。

一番簡単なFuncを作ってrealizeするようなケースの流れを理解するのを最初の目標にしよう。

Func.cppのrealizeを見る。piplineというののrealizeを呼ぶだけ。
その中はいろいろあるが、なんとなくcompilem_jitってのがそれっぽい。
見てみるとその中もいろいろやっているが、compile_to_moduleというのでModuleというのを作り、
これが生成された結果、jitの場合はjitしたバイナリを表す物っぽい雰囲気。
compile_to_moduleもなんかいろいろあるが、最終的に実作業をやってるのはlowerってやつか？
これはLower.cppにあるらしい。

どうもLower.cppのlowerでコンパイルするっぽい？
引数はPipelineのcontents->outputsか？

この時点で知りたくなったのは以下の２つ。

- contents->outputsがFuncからどう詰められるかを追いたい。
- lowerの処理を追いたい

まずlowerの処理を追う。

output_funcsは複数の関数を渡せるっぽいが、基本は一つなんじゃないか？と予想し、一つだと思って読む。

populate_environment_helperを読む。
Functionの.name()を関数のidentityとしている模様。Funcとかでunique nameをつけてたっぽいのでその文字列か？

has_extern_definitionってのがなんなのかはよく分からない。C++のextern呼び出しがあった時のコード生成で使うのかな。
とりあえず普通は呼ばれないと思って飛ばして進むか。

recursiveはlowerから呼ばれる時はtrueになる。

calls.callsで呼び出している関数が列挙されているっぽいな。再帰呼び出しになっているので、一段目の呼び出しだけを列挙している。
callsはFindCalls型。次はこれを見てみよう。

う、visitorパターンだ…で、Functionのacceptを呼ぶとFunctionContentsのacceptが呼ばれて、ここでfunc_scheduleとかそれっぽいののacceptが呼ばれているな。
ただ呼び出し先の関数がここにあるのを期待しているがそれっぽいのは無いような？

init_defとupdateのacceptが呼ばれている。これが関数定義の最初の定義とupdate定義のことだな。
では基本的なケースならinit_defを追えば良いか？
するとDefinition型のcontentsのacceptが呼ばれているな。これはDefinitionContentsか。
なんか全体的にXXX型はXXXContents型を持っていて、実際の処理はそっちを呼んでいるなぁ。この一段間接にはどういう意味があるんだろう。
XXX型の方がユーザーが実際に触る型っぽいな。

DefinitionContentsはちょっと良く分からないな。以下のacceptが呼ばれている。

- predicate
- values
- args
- stage_schedule
- specializations

specializationsはなんとなく無視して良さそうだな。stage_scheduleはこの関数自身のスケジュール関連か。
predicate、values、argsがDefinitionContentsの本体のExprっぽいな。

多分valuesの中に関数呼び出しがあって、それのvisitで元のFindCallsで呼び出し先関数を集めるんだろうなぁ。
predicateってのが何かは少し見てみないと分からない。
この辺は組み立て側を追う事でわかりそうなので、次はこのDefinitionContentsがどう組み立てられるのかを追いたいなぁ。

でもここまでで組み立て側はだいぶ雰囲気は分かった。

### ここまでのまとめ

realizeを追う事でコンパイル周辺はlowerでやってるっぽい事を理解する。
lowerの中はまだ最初のpopulate_environmentしか見てないが、ここで依存している関数を集めているっぽい。

ここから先lowerを読む前に、ここまでの流れで依存してる関数を集める所に登場するデータ構造はなんとなく見たので、
次は組み立て側を見てここまでいろいろ推測した事を確認していきたい。

以下へつづく。[Halideコード読み その2：Funcの組み立て](https://karino2.github.io/2020/10/14/halide_reading_2.html)
