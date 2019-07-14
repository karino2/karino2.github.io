---
title: Pythonでトレーニングセット生成にコンビネータスタイルの言語内DSLを作る
layout: page
---

トレーニングセットなどのデータセットを作るのに、
いわゆるコンビネータスタイルの言語内DSLのようなものを作って書いた。

ライブラリじゃないので他人に使って欲しいとか思ってる訳じゃなくて、
なんというか、データセット回りはコンビネータの流儀が便利でいいんじゃないか、という、流儀の話をしたい。
この手の話はすぐ関数型言語でパーサーコンビネータの話になってしまうのだが、
Pythonで機械学習の話がしたいんだ、私は。

## 問題設定

まず具体的に何をやったのか、みたいな話をしてから、本題に入りたい（が本題よりも前置きの方が大分長くなりそう）。

aとかnとか、一文字のシンボルのストロークデータがある。
ストロークデータというのは1ストロークがx, y座標のリストで、そのストロークのリストで表現される。

これらのストロークデータを拡大縮小したり移動したりして、例えば $$a^n$$とかのストロークデータを作り、
これのラベルデータを`["a", "^", "n"]`としたい。

こういうのをいろいろなパターンで作りたい。
だから生成結果は、

- TeXの文字列
- その画像を表すストロークの列

という物になる。

```
LabelStroke = namedtuple('LabelStroke', ['labels', 'strokes'])
```

というnamedtupleでこのリストを保持した。だいたいlsという変数名になってる。
例えば`ls.labels[5]`にnが入ってて、`ls.strokes[5]`にそのストロークデータが入っている。

### 最初のコード

例えば$$a^n$$の場合は以下のようなコードを書いた。

```
def supsc(sym1, sym2, lislis1, lislis2):
  base_scale = 0.5 + random.uniform(-0.1, 0.1)
  sup_scale = 0.2+ random.uniform(-0.05, 0.05)

  base1 = scale_lis2(lislis1, base_scale)
  sup2 = scale_lis2(lislis2, sup_scale)
  
  basetop = max_y_lis2(sup2)/2+random.uniform(-5., 5.)
  supleft = max_x_lis2(base1)+random.uniform(-5., 5.)+30
  
  base1 = translate_lis2(base1, 0, basetop)
  sup2 = translate_lis2(sup2, supleft, 0)
  
  stroke = post_process(base1+sup2)
  syms = [sym1, SUPERSCRIPT_ID, sym2]
  return syms, stroke
```

supscはsuper scriptの略。

lislisは歴史的な事情でリストのリストをそう書いているが、ストロークのリスト。
で、symというのがtex上でのシンボル（を表すid）。

だいたいは点の列を拡大縮小平行移動すれば良い。やっている事を自然言語で書くと、

- 一番目のシンボルを0.5倍に縮小、この時0.1程度のノイズを入れる
- 二番目のシンボルを0.2倍に縮小、この時0.05程度のノイズを入れる
- 一番目のシンボルの右端に30ピクセルくらい足した位置に二番目のシンボルを移動
- 一番目のシンボルを、二番目のシンボルの高さの半分くらいまで下に移動
- sym1, SUPERSCRIPT_ID, sym2というtexのリストを作る

という感じの事をやっている。
このやっている事とコードの間の距離がまぁまぁある、というのが本題なのだが、
このレベルならそんなに悪いコードという訳でも無いと思う。

この他同様に、subscとかtwo_termというのも作っている。
two_termは$$2 a$$ とか$$ a x $$とかそういう二つの構成要素で出来た項。
この場合 文字-文字はいいとして、 数字-文字はOKだけど 文字-数字 は無い。

そんな訳で文字種の区別が必要なのでこんなのを書いた。

```
char_names = ["\\sigma", "\\pi", "H", "L", "P", "T", "x", "d", "h", "l", "p", "t",
             "X", "\\gamma", "\\theta", "C", "G", "S", "c", "z", "g", "k", "o",
             "s", "w", "\\alpha", "\\lambda", "B", "F", "N", "R", "V", "b", "f", 
             "j", "n", "r", "v", "\\phi","A", "E", "\\beta", "I", "M", "Y", "\\mu",
             "a", "e", "i", "m", "q", "u", "y"]
nonzero_num_names = [str(i) for i in range(1, 10)]
num_names = [str(i) for i in range(0, 10)]


char_ids = names2ids(char_names)
nonzero_num_ids = names2ids(nonzero_num_names)
num_ids = names2ids(num_names)
```

そして、idsetを渡すと、lsの中からそのidsetに一致するindexの一覧を返す、`idset2indices`なんて関数も用意した。

そして以下のように書いた。

```
class DatasetFactory:
  def __init__(self, labelstroke, char_ids, nonzero_num_ids, num_ids):
    self.ls = labelstroke
    
    self.char_indices = idset2indices(self.ls.labels, char_ids)
    self.nonzer_num_indices = idset2indices(self.ls.labels, nonzero_num_ids)
    self.num_indices = idset2indices(self.ls.labels, num_ids)
    self.numchar_indices = idset2indices(self.ls.labels, char_ids|num_ids)
  def _bin_op(self, binop, indices1, indices2, num):
    """binop(sym1, sym2, st1, st2)"""
    term1ids = random.choices(indices1, k=num)
    term2ids = random.choices(indices2, k=num)
    def binop_ids(baseid, subid):
      basesym, basest = self.ls.labels[baseid], self.ls.strokes[baseid]
      subsym, subst =  self.ls.labels[subid], self.ls.strokes[subid]
      return binop(basesym, subsym, basest, subst)
    return [binop_ids(t1, t2) for t1,t2 in zip(term1ids, term2ids)]
  
  def subsc(self, num):
    return self._bin_op(subsc, self.char_indices, self.numchar_indices, num)
  
  def supsc(self, num):
    return self._bin_op(supsc, self.char_indices, self.numchar_indices, num)
  def two_term(self, num):
    # num num is also OK. But we start from much standard case.
    return self._bin_op(two_term, self.numchar_indices, self.char_indices, num)
  def one_symbol_dataset(self):
    one_syms = random.sample(self.numchar_indices, k=len(self.numchar_indices))
    return [[[self.ls.labels[one]], self.ls.strokes[one]] for one in one_syms]
```

ちょっと読むのは大変だが、subsc, supsc, two_termはだいたい同じなので、どれかh凸を読めば良い。

例えばsupscを見ると以下。

```
  def supsc(self, num):
    return self._bin_op(supsc, self.char_indices, self.numchar_indices, num)
```

bin_opの中身は読みたければ読んでもらえば良いが、ようするに適当な字種と先ほどのsupscなどを与えると、
lsから対象となる字種をサンプリングして、supscを呼んで結果のリストを返す。

だから

```
fac.supsc(10)
```

とすると、10個ほど$$X^Y$$的なデータが得られる。

これを使って、こんなコードを書いた。

```
ONE_CATEGORY_SIZE=60000
fac = DatasetFactory(train_ls, char_ids, nonzero_num_ids, num_ids)

one_symboles = fac.one_symbol_dataset()
suplist = fac.supsc(ONE_CATEGORY_SIZE)
sublist = fac.subsc(ONE_CATEGORY_SIZE)
twotermlist = fac.two_term(ONE_CATEGORY_SIZE)

all_data = one_symboles+suplist+sublist+twotermlist
random.shuffle(all_data)
```

one_symbole_datasetが58kくらいあったので、他も同じ比率という事で60kずつ作る事にした。
ここまでは良くあるPythonのデータの前処理、という範囲と思う。

ここまでで、$$a$$とか$$a_x$$とか$$2x$$とか$$x^2$$とかは生成されるようになった。
ただし、$${a_t}^2$$とか$$3 x_t$$とかは生成されない。

このデータセットでしばらくモデルを作り、試行錯誤を重ねて、Androidの実機に移して動かしたりしていた。

### 次の要求

で、だいたい動く所まで来たので次のステップに進む事になった。

次はもうちょっとパターンを増やす。
線形計画法の教科書を読むので、それに使えるのがいいかな？と線形計画法の教科書をパラパラ見た。

結果として、$$ 2x + 3y > 4 $$とかをサポートしたい。
ただちょっとした事情で右辺までは要らない。
という事で、$$ 2x + 3y > $$ みたいなデータを作りたい。

各項は、とりあえず $$a_x$$, $$ 3x $$といったこれまでの例の他に、$$ 3 x_t$$くらいはサポートしたい気がする。
これは前回のtwo_termでは生成されない。

イメージとしては、各項をサンプリングして、式を組み立てれば良い。
式の組み立てはこれまでとそんなに変わらない。
ただこれまではサンプリングは一番底のlsからしかやってなかった。
けど次はまず$$x$$なのか$$a_x$$なのか$$2 x$$なのか$$ 2 a_x $$なのかをサンプリングして、
そのあとxとかaとか2の部分に実際に何入れるかをサンプリングする。

あと、$$\mathbb{R}^2$$とかも出てくるのでこれもサポートしよう。
ただし$$\mathbb{R}$$は普通の等式などには出てこないので、この実数の次元とかを表す表記だけにしたい。

データセットとしては、最初は解ける程度の簡単な奴から始めて、
だんだんと複雑にしていって最終的には普段使いそうなのを全部サポートしたい。
だからこの手の変更は今後どんどん続いて行く。

こういう時、コンビネータ型のライブラリに慣れている人ならコンビネータ型のライブラリを作るか、となると思う。

## コンビネータスタイルで書く

パーサーコンビネータとかにありがちな、primitiveと合成で作っていくようなコードにした。

この辺をPythonでやる時の話をしたい。

### 作ったものを軽く見る

```
MathbbrS = OneOfNamesF(["\\mathbb{R}"])
SupOfRnS = OneOfNamesF(nonzero_num_names+ ["n", "m"])
RnS = SupscF(MathbbrS, SupOfRnS)
```

とかいう感じで、$$\mathbb{R}^2$$とか$$\mathbb{R}^n$$とかを作った。
なお、nとm以外はあんま使わないので今回は入れてない。

等式は、各項の、係数以外を以下のように定義し、

```
TermBaseS = OrF(
    [0.33, CharS],
    [0.33, SupS],
    [0.33, SubS]
)
```

さらに係数がある場合と無い場合で以下のように書いた。

```
OneTermS = OrF(
    [0.3, TwoTermF(NonzeroNumS, TermBaseS)],
    [0.7, TermBaseS]
)
```

係数がある場合が30%、係数が無い場合が70%。
$$ax + b$$とかのプラスの部分は以下のように定義した。

```
NormalBinOpS = OneOfNamesF(['+', '-', '\\times'])
RareBinOpS = OneOfNamesF(['\\div', '\\pm'])

BinopRawS = OrF([0.9, NormalBinOpS],
               [0.1, RareBinOpS])
BinopS = ScaleF(BinopRawS, 0.6)
```

割るはあんまり使わないのとデータセットの質が悪いのであまり使わない事にした。
プラスマイナスもあまり使わないので頻度を減らした。
さらに記号のサイズは少し小さめにした方が自然に見えたので、60%のサイズにした。

同様に最後の等号の所もEqopSという名前で作り、以下みたいに式を作る関数を作った。

```
EqExpS = HoriF(OneTermS, BinopS, OneTermS, MoveLeftF(EqopS, 1000))
```

これがコンビネータスタイルで書いた、という言葉で呼んでいるものの実体となる。

全体像はこちら。 [https://gist.github.com/karino2/132b249314d250eb85ee198992f8825f/6a9eecc8aff8075e6c31589425959fdc552326a3](https://gist.github.com/karino2/132b249314d250eb85ee198992f8825f/6a9eecc8aff8075e6c31589425959fdc552326a3)

### 基本的な構成

まずは引数無しで、呼ぶとサンプルを返す関数を作る。
これは末尾にxxSとSをつける事にした（サンプラーのS）。

そして、この「サンプラーを合成してサンプラーを返す関数」を作る。
これはxxFと末尾にFをつける事にした（サンプラーファクトリーのF）。

今回の例だとOrFとか、HoriFとかMoveFとかScaleFとかがファクトリとなる。

こういう基本的なビルディングブロックを用意して、これらのビルディングブロック


まず、呼ぶとサンプルを一つ返す関数を、xxSと末尾にSをつけて名づける事にする。
さらに、このxxSを返す関数をxxFと名付ける事にする。

**サンプラーの例**

```
CharS
NumCharS
```

**サンプラーファクトリの例**

```
SubscF
SupscF
OrF
ScaleF
MoveLeftF
```

今回はこの最初のサンプラーを作るのもファクトリになっていて、OneOfNamesFというのを使っている。
別に引数無しの関数で同じ型の物を返していれば普通の関数でも良いのですが。

### SupscFの実装を見る

具体的にどう実装しているかを見る為に、さきほど見たsupscのコンビネータ版を見てみよう。

supscはもともとの実装があったので、それを少しいじって以下のようにした。

```
def SupscF(baseS, termS):
  def supscS():
    lbase, sbase = baseS()
    lterm, sterm = termS()
    
    base1 = scale_to(sbase, 0.5)
    sup2 = scale_to(sterm, 0.2)
    
    basetop = height_of(sup2)/2
    supleft = next_to(base1)
        
    base1 = translate_to(base1, 0, basetop)
    sup2 = translate_to(sup2, supleft, 0)

    stroke = post_process(base1+sup2)
    syms = lbase+ [SUPERSCRIPT_ID] + lterm
    return [syms, stroke]
  return supscS
```

関数を受け取って関数を返す、という所が前のsupscと違うけれど、supscSの中でやっている事はsupscとそんなに変わらない（一部可読性を上げる為にコードを変えたけど）。
関数の中にinner関数を作って、この中の関数は前と同じ感じになる、というのはコンビネータスタイルにする時に良くあるパターンと思う。

また、このコードを書くつもりになれば分かるのだが、引数のbaseSとtermSは関数で、しかもシグニチャが決まってないといけない。
具体的には、この場合だと

- 引数は無し
- 返るのは `sym_list, stroke_list`

こうなるように作る。
考え方としては、サンプラーはこのシグニチャで統一。ファクトリは引数はどうでも良いが返すのはサンプラー。

こんな感じでその他のファクトリも実装していった。
実装自体はやれば出来ると思う。

### コンビネータスタイルとは？

あまり明確な定義は見た事が無い、というかこの用語自体そんなにちゃんと定義されているものでも無い気がするが、自分はコンビネータっぽい前提でパーサーコンビネータっぽい事をやる事全般をそう呼んでいる。

コンビネータっぽいというのはおおざっぱには

- 関数
- 引数の型の決まった関数の合成

の二つを組み合わせてプログラミングしていくスタイルと思う。（これは計算機理論のコンビネータの定義にも結構近いと思う）

まずプリミティブとして引数と戻り、つまりシグニチャが決まっている関数が幾つかあって、
それを合成して同じシグニチャを返す関数がある、みたいなのが多いと思う。

コンビネータ理論的には同じ引数である必要は無いと思うのだが、コンビネータスタイルといったらこういう物を指している気が自分はする。（識者のコメント希望）

今回の例だとxxSが関数、xxFが合成となる。

### コンビネータスタイルの書き方

以上を踏まえて、この手のものはどんな感じで作るのかを簡単に。

**1. 二つくらいのパターンをコンビネータじゃなく普通に実装してみる**

とりあえずsupscとtwo_termくらいはコンビネータスタイルじゃなく普通に実装してみる。
ついでに動作も確認しておく。

**2. プリミティブとしてのサンプラーを幾つか作る**

とりあえずNumSとCharSくらいは作る。その他使った奴は一通り作っても良い。
サンプラー側は大して難しい事は無いと思うので簡単に作れると思う（というか1で既に作ってある場合も多い）。

この時、何かnaming conventionでそれ、と分かるようにしておく方が良い（この件については後述）。

**3. 普通に作った実装を、合成に直す**

例えばsubscをSubscFにする。これは上記でコードを貼ってあるので分かると思う。

**4. 合成として価値のありそうな構成要素に分解する**

SubscFとかは例えば拡大、縮小、横に並べる、自身の半分の高さ下にずらす、などの集まりで表現出来ます。
どこまで分解するかはセンスの出る所ですが（これについても後述）、
何か追加する時に必要になったりする都度既存の合成を分解して複数の合成を合わせて作るように直します。

こんな感じで作れます。

## コンビネータスタイルについての議論

ようやく本題。上記のようなのを作るのは、結構これまで見たものを参考に適当に考えてやってます。
ですが、呼び名すらいまいち決まらないくらい、あんまり機械学習界隈では見かけない。
という事で幾つか議論的な物を書いてみたい。

### 言語内DSLなのか？定義は？

私はコンビネータスタイルは、Pythonにおいては言語内DSLだと思う。
ただ関数を返す関数を作ったらDSLなの？というとそれも違うと思う。

この辺は程度問題で、あんまり定義がどうこうとかいう気は無いが、以下に気分的な事を書いておく。

まずPythonにおいて、関数の合成を主体とするプログラミングスタイルはそんなに一般的じゃない。
しかもAndやOrとか通常のPythonの言語機能と同じ名前で、全然違う機能を提供している。
だからそこだけ違うとはっきりわかる方が読みやすい。

この、コードの他の部分と分かれていて、別のルールがあるものは言語内DSLと呼んでよいと自分は思う。
またコンビネータスタイルとは違う言語内DSLのノウハウを流用出来る所でもあるので、
そういうカテゴリを作る事には意味があると思う（個人的にはkotlinのtype safe builderとまとめてこの辺の話をいつかしたいと思っている）。

### 区別をはっきりする為の工夫

言語内DSLは他の部分とはっきりコードが分かれている方が読みやすい。
Pythonはあまりこういう用途にぴったりはまる言語機能は無いので、単純にネーミングコンベンションとコードの場所を分けておく、くらいが良いと思う。

ネーミングコンベンションとしては、今回大文字はじまりのCapWordsのコンベンションを使った。
これはPythonの関数や変数のコンベンション（小文字のsnake_case)とは違う。
これは意図的に破った。
コードの中でコンビネータスタイルであるのが一目でわかる方が良い。

また、xxSやxxFをPythonで定義する所と、それらを使ってDSLでコードを書いている所はなるべく分けるようにしている。
先に定義して、使う部分はあとでまとめて使う。
使う部分ではPythonのdefとか出てこないようにする。

この辺は気持ちそう気を付けてる、くらいでたまに破っているけれど。

### コンビネータスタイルは自分で作れるのが重要

この手の物は、必要性が訪れた時に自分で作れるのが大切と思う。
でもいまいちPythonとかの界隈ではそういう記事が無い。
パーサーコンビネータの話は結構あってパーサーコンビネータの作り方はぱっとググったら出てきたが、
それよりもパーサー以外の用途でも、必要な時に作れる事が重要と思う。

で、これを作るには別に外部のライブラリは要らない。
決まった形のprimitiveとなる関数を幾つか作り、その関数を合成して返す関数を作る。
合成にはAndとかOrみたいな奴やつなげるSequence的な奴とか幾つか良くあるパターンを知っておく方が語彙を考えるのには有利だが、その程度だ。

だからコンビネータ型「ライブラリ」というのは適切じゃない。
要点はそういうスタイルでのコード構成法をとる事が出来る、という所だと思う。

だが、コンビネータスタイルの話は関数型言語コミュニティ（＋C#）くらいに閉じている気がする。
少なくとも機械学習の話でこのコンビネータスタイルで書くというのを見かけた事は無い。

でも結構使う機会多いと思うんだよねぇ。分布を制御したいのは良くあるので、コンビネータスタイルの方が都合が良い。
でもPythonの本とかでこの辺を説明しているのはあまり見ないから、普通の機械学習屋がこのスタイル学ぶ機会が無い気がする。


つづく。