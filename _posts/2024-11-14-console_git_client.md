---
title: コンソールとか小さめのgitクライアントをいろいろ触ってみている
layout: page
---
SourceTreeはまぁ満足ではあるのだが、インストールとかも面倒だし、
ターミナルからちょろっと今いるディレクトリのレポジトリで作業したい、という事も多く、
こういう時に軽く使えるものを最近いろいろ触っている。

## tig

最初に触ったのがtig。なんで触ったのかは覚えていないが、Windows版のgitに同梱されていて、
どの環境でもすぐ使えるのがいい。
動作もここで挙げるものの中では一番安定している。

ただ、機能が少ない。基本的にはステージング専用コマンド、という感じ。
hunkの追加とか取り除くとかの作業はいい感じに出来る。
ただしhunkの判定が期待した塊にならないケースで手作業で行をステージングしたい、みたいなのはいまいち。

これにコミットログを書く機能がついてればかなり満足なんだが、コミットログを差分を見ながら書く事は出来ない。
というかコミットとかの機能は無い。
Cで外部コマンドとして単なるgit commitが実行出来るのだが、なんか特定の場所にカーソルが無いと発動しなくて条件が良くわからなかったりする。
何より差分見ながら書けない。

ログとか差分は見やすいので、かなりいいんだけれどなぁ。

## git-gui

これはコンソールじゃないけれど、tcl/tkで書かれた、なんかgitのレポジトリの中に入っているが一緒には入ってこない中途半端な位置づけの奴。
ただどこでもパッケージマネージャで入れられて設定無しですぐ使えて、現在のディレクトリのレポジトリでちょろっと作業する、
という用途には良い。

これはステージングとコミットだけのGUIツールという感じで、tigの「あとこれがあれば！」というコミットログを差分を見ながら書くというまさにその機能を提供している。
かなり良いのだが、微妙に動作が不安定で、たまに帰ってこなくなたりめっちゃ遅くなったりする。
レポジトリがある程度大きいと不安定になる印象。

けれど差分を見つつコミットログを書くだけでいいんだよな〜という自分の用途にパーフェクトにマッチしているので、たまに使う事もある。
ステージングをtigでやってコミットログだけgit-guiで書くのが一番今の所いい組み合わせなのだけれど、
２つもツールを行ったり来たりするのはややかったるい。
そしてgit-guiのステージングはいまいち。なんだこの中途半端な状況は…

## gitui

なんかrustで書かれているコンソールベースのGitのUI。だいたいのパッケージマネージャにあるので、手軽さはある。

使い方がわかりやすくて自然な動きをする。
とても素直なので、説明を見ずになんとなく触っても割と期待通りに動く。
これは次のlazygitに比べた大きなアピールポイント。

一通り必要な機能は入っていて、ステージングとコミットログを書くのには現時点での結論となっているが、
コミットログのウィンドウは日本語IMEでなんかカーソルが吹っ飛んだ状態で候補が見えなかったりと日本語の入力がいまいち。
さらにコミットログを書きつつ差分の違う所を表示したり、とかは出来なくて、git-guiほど欲しい機能をちゃんと提供している訳では無い。

gituiはログとかブランチ周りの機能もちゃんとあるのだが、なんか挙動がバグっていて、
ファイルが他のプロセスによって編集中です、とかいってチェックアウトは出来ないがファイルの状態はそのチェックアウトした状態になってしまったり、変な状態になって困る。
作業が消えそうで怖い。

編集状態でブランチを切る、は非常に良くやる作業なのだが、これもなんか怒られたりする。ここらへんはgitまんまにして欲しいんだがなぁ。

という訳でちゃんと良くなったらこれでいい気がしているが、現時点ではチェックアウト周りの挙動が怖くて、
結局ステージングとコミットくらいにしか使ってない。
ただ一つのツールで両方使えるし、git-guiのようになんか帰ってこなくなったり遅くなったりは無いので、
割と使っている。

## lazygit

gituiと似ているのだが、こちらはなんか機能があるのか無いのか良くわからないものが多くて、
やりたい事のやり方がわからない、という事が多い。
クセが強いので、何もみずに適当に触ると期待と違う動作をする。
例えばコミットログを見ていて、そこでブランチを作ろうとしてbを押すとbisectだったりする。
ブランチを作成はn。普段の作業をいちいち調べないとやり方がわからない。

ただgituiのように変なチェックアウトの挙動で作業が消えそうになったり、とかは無い。
機能的にも必要なものが全部入っていそうなので、
慣れたらこれでいいのかもしれない、と思いつつ、今の所はtigの方が使いやすいなぁ。

あとステージングだけはすごくいい感じに動く。行単位でも自由自在。
tigのdiffビューがこれだったらな〜。

コミットログもちゃんと日本語入力が吹っ飛んだりもしないし、書き書けがちゃんと保持されるので差分みながら書ける。

この記事を書いていて、なんかlazygitをマスターするのが自分的には一番良いかもしれない、という気もしてきた。

## 雑感など

なんかどれもかなり惜しくて、もうちょっとでSourceTree無しでも良いのでは？と思えるような状況なんだが、
微妙に細かく足りない。
ただtigやgituiはステージングツールとしては十分良いので、
残りはコマンドラインとかgitkで頑張れない事も無いんだよな。

ログを見るにもtigやgituiは十分いいんだよな。
ただログを見てここからブランチを作る、みたいなのがtigやgituiはやりにくい（出来ない）。
lazygitはやりやすい。でもステージング周りとか普段の操作体系がlazygitは分かりにくいというかなかなかなじまない。

なんかヘルプが?だったりhだったりとツールによって違っていて、この辺統一してよ〜とう気持ちになる。
あと中途半端にvi的なキーバインドが前提となっていて、でもページアップやページダウンは違ったりする。

ただ本質的にはコマンドラインですべての作業は出来る訳で、
それでは嫌な作業をどこまで軽減するか、という話ではある。

嫌な作業をリストアップしてみよう。

1. ステージング
2. コミットログ書き
3. ブランチ切ったりチェックアウトしたり
4. ログを見て該当の差分をコピペしたり

このくらいだろうか。

ステージングは苦痛な事ナンバーワンなのだが、
これは普段の作業はtigで十分いい。だが数行だけstagingしたい、とかだと微妙。
これはlazygitが一番良い。あんまりそういう事は無いのでだいたいtigでいいんだが、たまに足りないんだよな。
それなら普段からlazygit使えば良いのでは？という話もある。ただ操作体系がなれないので普段の操作には微妙にストレスがある。

差分を見つつコミットログを書いたりしたい、というのはgit-guiで解決出来ている。ただちょっと重くて不安定。
lazygitもかなりいい感じに動く。lazygitで頑張るのがいいかもしれない。

ブランチを切ったりチェックアウトしたりは微妙な所で、gitkは十分に良いが、微妙に見づらいのとちょっと立ち上がりが遅い。
他のツールで似たような機能を提供しているものもあるが、どれもrefsのremotes下にだけあるものとかの扱いがいまいちなんだよな。
gitkが一番マシでもっと言えばコマンドラインも悪くない。目の前に見えるブランチ名をコピペしたりする必要があるのがかったるいが。

現在のブランチのログを見ていく事に関しては、どのツールも悪くない。ただtigとかはコピペするにはいまいちなんだよな。
マウスで選択すると隣のウィンドウまで選択されてしまうので複数行のコピペがやりにくい。
こういうのはgituiがいい感じなんだよなぁ。
ログは一番見やすい。
lazygitも悪くない。

lazygitはどれもかなりいいんだが、細かな操作がいちいちクセがあってちょっとずつストレスなんだよなぁ。
tigとかはそういうのが全然無いんだよな。

いろいろ使っているとキーバインディングが違ったりして微妙にストレスなのでもう少し減らしたいのだが。

普段はtigでステージングしてgit-guiでコミットログを書いたりしているが、
lazygitに慣れた方がいいかもしれん。

### 追記: 結局lazygitに適応した　2024-11-26 (火)

結局lazygitに頑張って適応する事にした。

慣れれば結構良い。現在のブランチ以外の履歴を見るのはいまいちで、
そこはgitkと併用しているが、他は概ね不満無い。

キーボードショートカットが特殊だが、
適応してしまえば悪くない。
ステージングはかなり良い。
また、チェリーピックや過去のバージョンからブランチ作るのも良い。

履歴は少し見づらい時もあるが、許容範囲内。
何より安定して動くのがいいね。

今後はlazygitメインで生きていきます。