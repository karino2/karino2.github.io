---
title: guashで遊ぼう！
layout: page
---
[https://github.com/karino2/guash](https://github.com/karino2/guash)

guashが出来てきたので、どんなものなのか、幾つか例を書いてみたい。

### Hello World

まずはHello World。

```
#!/usr/bin/env bash
export GUASH_DIR=$(mktemp -d)

guash_readtext "何か言ってね！"
guash_doquery
```

これをターミナルから実行すると、こんな画面が出る。

![hello guash]({{"/assets/images/2021-04/guash_hello.png" | absolute_url}})

で、何か入力してSubmitを押すと、ターミナルに入力されたテキストが出力される。標準出力に出る訳です。
例えば「ほげほげ」と入力すると、「ほげほげ」が出力されます。

当然通常のシェルのコマンドなので、変数に受け取る事も出来ます。

```
#!/usr/bin/env bash
export GUASH_DIR=$(mktemp -d)

guash_readtext "何か言ってね！"
RES=$(guash_doquery)

echo "$(date):$RES"
```

こうすると以下のように出力されます。

```
2021年 4月27日 火曜日 09時06分46秒 JST:ほげほげ
```

guash特有の事を見ると、まずGUASH_DIRというのをexportする必要があります。

そして、以下の二行で、テキストの入力一つのダイアログを出して、結果を標準出力に出します。

```
guash_readtext "何か言ってね！"
guash_doquery
```

ここまでだと単なる面倒なreadという感じですね。

### ２つの入力を得るケース

guashでは、入力は２つまで指定出来る。２つしか指定出来ない。
とりあえず以下の例を見てみよう。

```
#!/usr/bin/env bash
export GUASH_DIR=$(mktemp -d)

guash_readtext "１つ目！"
guash_readtext "２つ目！"
guash_doquery
```

すると以下のような画面が出ます。

![two input]({{"/assets/images/2021-04/guash_two_input.png" | absolute_url}})

１つ目に「ほげほげ」、２つ目に「いかいか」と入れると、ターミナルに以下のように表示されます。

```
ほげほげ
いかいか
```

２つの入力の時は、二行に分けて出力される訳です。
これはarrayで展開して受け取る事を想定しています。

例えば以下のようにRESでarrayとして受け取る事が出来ます。

```
#!/usr/bin/env bash
export GUASH_DIR=$(mktemp -d)

guash_readtext "１つ目！"
guash_readtext "２つ目！"
RES=($(guash_doquery))

echo "RES1=${RES[0]}, RES2=${RES[1]}"
```

結果は以下になります。

```
RES1=ほげほげ, RES2=いかいか
```

1つのダイアログが二回出るのでは無く、２つの入力フィールドを備えたダイアログが出る、というのがポイント。

なお、最初の二行はいつも同じなので、

```
#!/usr/bin/env bash
export GUASH_DIR=$(mktemp -d)
```

これをしてくれるguashというスクリプトも付属しております。

```
$ cat ~/bin/guash
#!/usr/bin/env bash

export GUASH_DIR=$(mktemp -d)
/usr/bin/env bash $1
```

これを使うと、先程の最初の二行は以下のように一行で書ける。

```
#!/usr/bin/env guash

guash_readtext "１つ目！"
guash_readtext "２つ目！"
RES=($(guash_doquery))

echo "RES1=${RES[0]}, RES2=${RES[1]}"
```

### Filterでpercolみたいな事をする

次にインクリメンタル絞り込みのフィールドを表示してみる。

まず、`ls bin`すると以下のような出力が得られる。

```
[		chmod		dash		df		expr ...
```

次に、この結果から一つを選ぶ、というスクリプトを書くとこんな感じ。

```
#!/usr/bin/env guash

ls /bin | guash_filter "binから何か選んでね！"
guash_doquery
```

![filter]({{"/assets/images/2021-04/guash_filter.png" | absolute_url}})

で、何か選ぶ。例えばhostnameとか。この場合はhosと打つと絞り込みでhostnameだけが残るのでそれを選ぶ。

すると出力は、

```
hostname
```

となる。

フィルタのところを見ると、

```
ls /bin | guash_filter "binから何か選んでね！"
```

となっていて、パイプを使ってpercolのようにフィルタリングの元になるデータを選ぶ事が分かる。
これだけだとpercolを面倒にしただけという風にも見える。

### /etcから何かのファイルをホームに、指定した名前でコピーするスクリプトを書く

さて、ここからがguashの本領発揮。
/etcからファイルを一つ選んでホームディレクトリに、指定した名前でコピーするスクリプトを書こう。
スクリプト自体に実用性はまったく無いが、どういう事が出来るのかは理解出来るはず。

スクリプトはこんなの。

```
#!/usr/bin/env guash

ls /etc | guash_filter "etcから何か選んでね"
guash_readtext "コピー先のファイル名を教えてね"
RES=($(guash_doquery))

cp /etc/${RES[0]} ~/${RES[1]}
```

これを実行すると、以下のような画面になる。

![copy_etc]({{"/assets/images/2021-04/guash_copy_etc.png" | absolute_url}})

ここからhostsを選んで、右側にmy_hostと入力してSubmitすると、`/etc/hosts`が`~/my_host`というファイルとしてコピーされます。

スクリプトのうち、UIを作っている部分に着目してみると以下になります。

```
ls /etc | guash_filter "etcから何か選んでね"
guash_readtext "コピー先のファイル名を教えてね"
RES=($(guash_doquery))
```

一行目でフィルタリングのカラムを、二行目で名前を入力するカラムを作っています。
で、ダイアログを出して、ユーザーがSubmitをしたら、結果をRESに入れる。

### 実用例1: Jekyllの草稿ファイルを生成する

jekyllは、例えば`2021-04-27-somename.md`のようなファイル名で、

```
---
title: guashで遊ぼう！
layout: page
---
```

で始まるファイルを作る事になる。ファイルのベースネームに使うところと、タイトルの２つを入力したい。

そこで、以下みたいなコードを書いた。

```
#!/usr/bin/env guash

guash_readtext "ファイルのbasename"
guash_readtext "タイトル"
RES=($(guash_doquery))

DEST=$(dirname $0)
FILENAME="$DEST/"`date +%F`"-${RES[0]}.md"
echo $FILENAME
echo "---" > $FILENAME
echo "title: ${RES[1]}" >> $FILENAME
echo "layout: page" >> $FILENAME
echo "---" >> $FILENAME
```

DESTを`$0`から取っているのは、Finderから実行した時にCWDがホームディレクトリになるから。

こんな風に作っておくと、Finderからダブルクリックするとダイアログが立ち上がって、入力すると草稿となるマークダウンファイルを生成したり出来る。

dateコマンドとかが使えるのが良い。

### 実用例2: jekyllの_postディレクトリからTeFWikiへハードリンクを貼りたい

lnコマンドは引数の順番をひたすら忘れる。
あとgithubで管理されているところとGoogle Driveのフォルダが遠いので、いちいち手で打ちたくない。

という事で以下のようなスクリプトを書いた。

```
#!/usr/bin/env guash

ls -t ~/work/GitHub/karino2.github.io/_posts | guash_filter "Src file"
guash_readtext "Dest name"
RES=($(guash_doquery))

ln ~/work/GitHub/karino2.github.io/_posts/${RES[0]} ~/Google\ ドライブ/DriveText/TeFWiki/${RES[1]}.md
```

jekyllのマークダウンは大量にあるが、lsに`-t`オプションをつける事で新しいの順に出す事が出来る。
だいたいリンクしたいのは上の方なのでこれで十分。

さらに「あー、あれ年末くらいに書いたんだよな〜」という時には、「2020-12」と打てば絞り込みが出来て、
あとはぽちっと選べば良い。


### 内部の動作

guash_filterとguash_readtextは、GUASH_DIRにGUIを作るためのデータを生成します。
一回目に実行された時は1.txt、２つ目に実行された時は2.txtとなります。

guash_doqueryはこの２つのファイルの内容からダイアログを生成します。

guash_doqueryはデフォルトでは終了にGUASH_DIRを削除します。
なお、デバッグなどで削除してほしくない時は-kというオプションをつけると残したままに出来ます。

### コンセプト的な話

ちょっとした書き捨てのスクリプトでGUIを使いたい、という事がちょくちょくある。

でもGUIアプリを作るのは、シェルスクリプトを書くのに比べてひたすらかったるい。
何故かというと、GUIアプリは指定しなきゃいけない項目が多いからだと思う。
また、GUIを生成するためのデータの生成が、シェルスクリプトに比べて冗長な記述を要求される事が多い。

やはり短さという点においては、シェルスクリプトは究極に近い。

だから書き捨てのGUIを作る時も、シェルスクリプトで作りたい。

percolやPowerShellのOut-GridViewを使うくらいまでは簡単なので、あんな感じに作れないものか。

percolが簡単なのは、位置とか他にどういうウィジェットがあるかとか指定しないからだよなぁ。
なんでそういう指定が要らないかというと、やれる事が凄く限定されているから。

あれの延長で、もうちょっと日常的なツールを書きたい。
という事で、なるべく出来る事を制限して指定しなきゃいけない量を減らしたい。

書き捨てコマンドのかなりの部分は、

- 入力
- 出力

の２つのパラメータで実現出来るんじゃないか、という考えで、これを決め打ちにしてなるべく記述を少なく書けるようにしてみよう、というのがguashの考え。

２つより多くの場合ももちろんあるのだけれど、それを許し始めると簡単に書けないので、とりあえず一つ、または２つの二通りだけに特化して、なるべく簡単に記述する。

### 余談

もともとはもっと複雑なシステムだったのでホスト言語はF# で書いたのだが、結局ほとんどファイルを読んでJSONにしてるだけなので、もっとdeployが簡単そうな言語で書いてもいいかもしれない。

ただwebviewをパックして一つに出来るのは手軽ではある。
homebrewとかにするなら別にdllがあっても良いかも。