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
パーサーや金融の話はいらない。

## 問題設定

まず具体的に何をやったのか、みたいな話をしてから、本題に入りたい（が本題よりも前置きの方が大分長くなりそう）。

aとかnとか、一文字のシンボルのストロークデータがある。
ストロークデータというのは1ストロークがx, y座標のリストで、そのストロークのリストで表現される。


```
LabelStroke = namedtuple('LabelStroke', ['labels', 'strokes'])
```

というnamedtupleでこのリストを保持した。だいたいlsという変数名になってる。
例えば`ls.labels[5]`にnが入ってて、`ls.strokes[5]`にそのストロークデータが入っている。

これらのストロークデータを拡大縮小したり移動したりして、例えば $$a^n$$とかのストロークデータを作り、
これのラベルデータを`["a", "^", "n"]`としたい。

こういうのをいろいろなパターンで作りたい。
だから生成結果は、

- TeXの文字列
- その画像を表すストロークの列

という物になる。

合成といっても全部をプログラムで生成するのではなくて、シンボルのストロークのデータセットはあらかじめあって、それを合成してより複雑なトレーニングセットを作りたい訳です。
こういう、トレーニングセットの元データはあるけど何か加工したもので実際のトレーニングをしたい、というのは、
機械学習ではまぁまぁあると思う。

### 最初のコード

まずはコンビネータスタイルとか気にせずに、ベタにシンプルに実現する所から始めた。

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

ちょっと読むのは大変だが、subsc, supsc, two_termはだいたい同じなので、どれか一つを読めば良い。

例えばsupscを見ると以下。

```
  def supsc(self, num):
    return self._bin_op(supsc, self.char_indices, self.numchar_indices, num)
```

bin_opの中身は読みたければ読んでもらえば良いが、ようするに適当な字種と先ほどのsupscなどを与えると、
lsから対象となる字種をサンプリングして、supscを呼んで結果を返す。
サンプリングは複数行えて、結果はリストで返す。

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
これは前回のtwo_termでは生成されない。だが本質的には同じ処理で、単に渡すstroke listが別のところ、つまりsubscで作られた物も食わせられれば良い。処理はほとんど変わらないだろう。

イメージとしては、各項をサンプリングして、式を組み立てれば良い。
式の組み立てはこれまでとそんなに変わらない。
ただこれまではサンプリングは一番底のlsからしかやってなかった。
けど次はまず$$x$$なのか$$a_x$$なのか$$2 x$$なのか$$ 2 a_x $$なのかをサンプリングして、
そのあとxとかaとか2の部分に実際に何入れるかをサンプリングする。

あと、$$\mathbb{R}^2$$とかも出てくるのでこれもサポートしよう。
ただし$$\mathbb{R}$$は普通の等式などには出てこないので、この実数の次元とかを表す表記だけにしたい。

データセットとしては、最初は解ける程度の簡単な奴から始めて、
だんだんと複雑にしていって最終的には普段使いそうなのを全部サポートしたい。
だからこの手の変更は、今回で終わりでは無くて今後どんどん続いて行く。

こういう時、コンビネータ型のライブラリに慣れている人ならコンビネータ型のライブラリを作るか、となると思う。

## コンビネータスタイルで書く

という訳で、パーサーコンビネータとかにありがちな、primitiveと合成で作っていくようなコードに直した。

この辺をPythonでやる時の話をしたい、というのがこのポストの主旨。

### 作ったものを軽く見る

説明の前に、まずはどういう物が出来たのかを軽く見てみる方が雰囲気がつかめると思う。

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
EqExpS = HoriF(OneTermS, BinopS, OneTermS, MoveRightF(EqopS, 1000))
```

これがコンビネータスタイルで書いた、という言葉で呼んでいるものの実体となる。

全体像はこちら。 

- [https://gist.github.com/karino2/132b249314d250eb85ee198992f8825f/6a9eecc8aff8075e6c31589425959fdc552326a3](https://gist.github.com/karino2/132b249314d250eb85ee198992f8825f/6a9eecc8aff8075e6c31589425959fdc552326a3)
   - さらに本体のnotebook [github: tegashiki/tegashiki_mathexp_generate.ipynb](https://github.com/karino2/tegashiki/blob/7f5b0e3115feaab6a6b23d83a23bb467637d90c6/tegashiki_mathexp_generate.ipynb)

### 基本的な構成

まずは引数無しで、呼ぶとサンプルを返す関数を作る。
これは末尾にxxSとSをつける事にした（サンプラーのS）。

そして、この「サンプラーを合成してサンプラーを返す関数」を作る。
これはxxFと末尾にFをつける事にした（サンプラーファクトリーのF）。

今回の例だとOrFとか、HoriFとかMoveFとかScaleFとかがファクトリとなる。

このxxSとかxxFは今回の実装ローカルの話だけど、関数と合成の二種類に分けて考えるのは最初はだいたいそうだと思う。

こういう基本的なビルディングブロックをまずPython上で用意して、
これらのビルディングブロックを組み上げてプログラムをしていく。
ビルディングブロックを組み上げる時には、基本的にはPythonの制御構造などは必要としない（事が多い）。

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
MoveRightF
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

の二つを組み合わせてプログラミングしていくスタイルと思う。（これはあまり詳しくないが、計算機理論のコンビネータの定義にも結構近いと思う。計算機理論のコンビネータは関数の合成を主体とした計算の構成方法で、関数適用を主体としたラムダ計算とは兄弟みたいなものという認識。）

実用的には、まずプリミティブとして引数と戻り、つまりシグニチャが決まっている関数が幾つかあって、
それを合成して同じシグニチャを返す関数がある、みたいなのが多いと思う。
合成も幾つかのプリミティブがあって、合成自体も合成で作れるのが多い（が今回は合成の合成はやってない、後述）。

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

ポイントとしては、合成した結果を返すんじゃなくて、合成する関数を返す、という所。
関数を作る時に、numpyの移動などをするんじゃなくて、numpyの移動などをする関数を返す。

**4. 合成として価値のありそうな構成要素に分解する**

SubscFとかは例えば拡大、縮小、横に並べる、自身の半分の高さ下にずらす、などの集まりで表現出来ます。
どこまで分解するかはセンスの出る所ですが（これについても後述）、
何か追加する時に必要になったりする都度既存の合成を分解して複数の合成を合わせて作るように直します。

こんな感じで作れます。

## コンビネータスタイルについての議論

ようやく本題。上記のようなのを作るのは、結構これまで見たものを参考に適当に考えてやってます。
もうちょっと適当じゃなくちゃんと系統だってやれないかなぁ、と思っている。

だが、「コンビネータスタイル」という呼び名すらいまいち決まらないくらい、
あんまり機械学習界隈では見かけない。
まだ系統だって何かを語れる段階には自分は居ない。

という事で幾つかそこへと至る為の議論的な物を書いてみたい。

### 言語内DSLなのか？定義は？

私はコンビネータスタイルは、Pythonにおいては言語内DSLだと思う。
ただ関数を返す関数を作ったらDSLなの？というとそれも違うと思う。

この辺は程度問題で、あんまり定義がどうこうとかいう気は無いが、以下に気分的な事を書いておく。

まずPythonにおいて、関数の合成を主体とするプログラミングスタイルはそんなに一般的じゃない。
しかもAndやOrとか通常のPythonの言語機能と同じ名前で、全然違う機能を提供している。
だからそこだけ違うとはっきりわかる方が読みやすい。

この、コードの他の部分と分かれていて、別のルールがあるものは言語内DSLと呼んでよいと自分は思う。
そしてコンビネータスタイルに限らないその他の言語内DSLのノウハウを流用出来る所があるので、
そう呼ぶ事には意味があると思う（個人的にはkotlinのtype safe builderとまとめてこの辺の話をいつかしたいと思ってこの話を書いている）。

### 区別をはっきりする為の工夫

言語内DSLは他の部分とはっきりコードが分かれている方が読みやすい。
Pythonはあまりこういう用途にぴったりはまる言語機能は無いので、単純にネーミングコンベンションとコードの場所を分けておく、くらいが良いと思う。

コードの場所はセルが違うだけじゃなくて、Markdownセルを間に挟んでcolabの横のアウトラインで分かるようにしておくと良いと思う。
DSLの実装とDSLでのプログラミングをアウトラインレベルで分けるかは規模によると思う。
自分は今は分けてあるかな。

ネーミングコンベンションとしては、今回大文字はじまりのCapWordsのコンベンションを使った。
これはPythonの関数や変数のコンベンション（小文字のsnake_case)とは違う。
これは意図的に破った。
コードの中でコンビネータスタイルであるのが一目でわかる方が良い。

xxSやxxFをPythonで定義する所と、それらを使ってDSLでコードを書いている所はなるべく分けるようにしている。
先に定義して、使う部分はあとでまとめて使う。
使う部分ではPythonのdefとか出てこないようにする。
ただたまに面倒で破ってる。
この辺は気持ちそう気を付けてる、くらい。

### コンビネータスタイルは自分で作れるのが重要

この手の物は、必要性が訪れた時に自分で作れるのが大切と思う。
でもいまいちPythonとかの界隈ではそういう記事が無い。
パーサーコンビネータの話は結構あってパーサーコンビネータの作り方はぱっとググったら出てきたが、
界隈の外の人にはその辺の事情が伝わりにくい気がする。
特定のライブラリの実装を理解する為に作ってみよう、というんじゃなくて、
パーサー以外の用途でも、必要な時に作れるようになる為にそういう話をしているんだと思うけれど。

という事で今回はあえてパーサーの話はしないようにした。既存のライブラリの話をしたいんじゃないんだ、と。

コンビネータスタイルで何かを作る時には、別に外部のライブラリは要らない。
決まった形のprimitiveとなる関数を幾つか作り、その関数を合成して返す関数を作る。
合成にはAndとかOrみたいな奴やつなげるSequence的な奴とか幾つか良くあるパターンを知っておく方が語彙を考えるのには有利だが、その程度だ。

だからコンビネータ型「ライブラリ」というのは適切じゃない。
要点はそういうスタイルでのコード構成法をとる事が出来る、という所だと思う。

だが、コンビネータスタイルの話は関数型言語コミュニティ（＋C#）くらいに閉じている気がする。
少なくとも機械学習の話でこのコンビネータスタイルで書くというのを見かけた事は無い。

ライブラリとかが要らないので、逆に特定のライブラリのドキュメントを読んで使う事で覚える、
というのがやりにくいのだよなぁ。
パーサー使う用途があればパーサーコンビネータ使っていれば理屈は理解出来るが、
パーサーを使わない人が学ぶ手段がなかなか無い。

でも機械学習のデータの前処理とかでは、結構使う機会多いと思うんだよねぇ。
分布を制御したいのは良くあるが、これはコンビネータスタイルと相性が良い。
言語内DSLはcolabとの相性も良く、アウトラインとかを工夫する事で結構いい感じに出来る。

でもPythonの本とかでこの辺を説明しているのはあまり見ないから、普通の機械学習屋がこのスタイル学ぶ機会が無い気がする。
という事で今書いている。

コンビネータスタイルは使える問題が限られている。全部の問題をこれで解ける、という類の話では無い。
ただ、一度マスターして世の中を見渡すとまぁまぁ書く機会がある、くらいには良くある。
特に機械学習のトレーニング回りでは、コンビネータスタイル向きな物がちょくちょくある。

### 言語「内」DSLは重要

DSLというとどうしても言語外DSLの話が多くなりがちだが、
パーサーではANTLRとかの「外部DSL+コード生成」よりはパーサーコンビネータの方が小さなものを書く時は人気だと思う。
という事で業界的にはシチュエーションによるが、言語内DSLの優位性は広く知られている。

パーサーコンビネータの良さは他の人がさんざん語ってると思うけれど、
ようするにホスト言語の言語機能を使えて、拡張も簡単な所が強みと思う。
（さらにPythonならJupyterとの相性の良さと、IDEの強い言語ならIDEの支援などの話が出てくる）。
DSL上では面倒だがPythonで書けば早い、という時に気軽にPythonに降りられるのがメリット。
言語外DSLにしてしまうとこの行き来が面倒になる。

例えば、

```
Pattern2S = OrF(
    [0.15, OneSymbolS],
    [0.025, RnS],
    [0.1, SubS],
    [0.1, SupS],
    [0.1, TwoTermS],
    [0.2, OneBinopOneS],
    [0.3, EqExpS]
)
```

という物は、YAMLで以下のように書く事も出来るだろう。

```
Pattern2S:
  - name: OneSymbolS
    ratio: 0.15
  - name: RnS
    ratio: 0.025
  - name: SubS
    ratio: 0.1
  - name: SupS
    ratio: 0.1
  - name: TwoTermS
    ratio: 0.1
  - name: OneBinopOneS
    ratio: 0.2
  - name: EqExpS
    ratio: 0.3
```

だが、例えばこのRnSがどう出来ているのか、というのをYAML内で辿れるかは作り手の匙加減になる。

仕様の記述として完結するように全部をYAML側にしてしまうと、外部化するメリットが薄れる。Pythonで書く方が楽な事を面倒なやり方でやるだけになってしまう。
だが一部だけにしてしまうと、その一部の外の情報が必要になった時にコードを見ないといけない。
コードを見る時は言語内DSLの方が普通は読みやすい。

言語内DSLにはPythonの抽象化の力を使える、というメリットがある。
だから適切な抽象のレイヤーが構築できるので、読み手が必要な所まで調べる、という事がやりやすい。

また、上記の例を比較すると、言語内DSLに比べて、外部DSLにすると可読性が上がっている訳でも無いと思う。
YAMLよりもっと良い言語を作る事は出来るが、それでもそんなには違わないと思う。

DSL側がかなり固まっているケース以外では言語内DSLの方が良い事が多く、
そしてDSLがかなり固まるのはドメインの理解がかなり固まったという事を意味している。
パーサージェネレータなどのようなケースならばそれも可能かもしれないが、
機械学習でデータ生成とかモデルとかを扱う場合には、そんな事は普通は最後まで無い。

という事で言語内DSLは非常にメリットが多くて、言語内DSLを選ぶべき所は多い。
でもDSLの話ってなんかみんな外部DSLの方のパーサー回りが多くなってしまって、言語内DSLの話はあまり無い。
そして言語内DSLはだいたいはメタプログラミングの機能でこんな変な事も実現できるよ！みたいなのが多くなってしまう。

適切な内部DSLを設計する為の原理原則や、内部DSLを作るべき時などの話をもうちょっと出来ないものか、
と思ってこのブログを書いている。

### データセットの生成をDSL化する意義

DSL化する、つまり他の部分と分離して別のルールを組み込む事には、機械学習の現場的には結構意味がある。
今回の例では、データセットの生成だが、それ以外の場合でもだいたい、
機械学習の開発では「あるバージョンの詳細な仕様の記述」というのを記録する必要がある。

こういう時に、コードの全スナップショットとは別に、DSLで書かれたデータセットの仕様が記録に残せて共有できる事には意味がある。
もちろん本当にデータが正しく生成されているかを確認したければ元のコードに当たっているほか無いが、
いろいろなパターンのトレーニングデータを作って、それにいろいろなモデルを適用して結果を見てみる時に、個々のデータセットがどういう物かを並べてみてみるのは結構重要。

そこで、このデータセットの性質を簡潔に記述した部分が、コードと分離されている事には意義がある。

例えば元の例を考えると、以下のようなコードになっていた。

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

これでも一つのシンボルと、上付きの式60k、下付きの式60k, 二項の式60kがある、というのは分かる。
だが、このsupscのベースの所に何を許していたのか、はここだけを見ると分からない。
どう見るかというとここを見る事になる。

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
...
```

関係ない所に必要な所が埋もれがちと思う。

言語内DSLでの記述だと、以下みたいになる。

```
Pattern1S = Or(
    [0.58, OneSymbolS],
    [0.6, SupS],
    [0.6, SubS],
    [0.6, TwoTermS]
)
```

そしてSupSはどうなっているかというとこうだ。

```
CharS = OneOfNamesF(char_names)
NumCharS = OneOfNamesF(list(set(char_names+num_names)))

SupS = SupscF(CharS, NumCharS)
```

よりプリミティブに近い所までDSLのレイヤーで追えて、こちらのコードの方が普通は読みやすくなる。
だからデータセットの仕様の記述、みたいな類の仕事には向いている。

最初のコードよりはコンビネータスタイルにした後の方がデータセットの記述という点ではより良いと実務家なら理解してもらえると思う。

例えば $$ 3 x_2 + a y $$ をpredictするとどうもaが誤認識する、という事があったとする。
そこで元のデータセットで、係数が文字の場合もあっただろうか？とこのデータセットを生成しているコードを確認したい。

こういうのはいかにもありそうな話だ。こういう時に最初の書き方と言語内DSL化して書いた書き方でどちらが追いやすいかを考えてみて欲しい。

### どこまでDSL上で記述すべきか？

コンビネータスタイルで基礎となるビルディングブロックを選ぶには、ある程度の自由度がある。
例えばSupscFは、本当はもっと小さなプリミティブを合成して実装出来るし、
ScaleFなどはあとで必要になったのでより小さなプリミティブを抜き出した。

また、自分は横に並べるHoriF（Horizontalの略）というのも作ったが、これとは別にTwoTermというのも作っている。
違いはTwoTermは間が狭い、くらいだ。
supもsubも横に並べているともいえるので、これらは一般化したプリミティブとその合成にたぶん出来そう。

一方で、合成のコードはPythonではそんなにデバッグしやすい訳じゃない。

今回自分は、SupscF、SubscF、TwoTermF、HoriFは別々な合成としてPython側で実装した。
この辺はあまりDSL上での実装にこだわって小さなプリミティブを用意するよりは、
プリミティブ一つの粒度がPythonの関数として適切な大きさで、単体での挙動がそれなりに意味があってテストし甲斐があるくらいが良いと思うから。

ただ、ScaleFとMoveRightFは必要になったので単体としては小さいが実装した。
上記のSupscFなどは内部に同等の機能を含んでいるので本来はこのScaleFなどを使うように直せるのだが、別にいいか、と直さなかった。（そのうち直すかもしれないが）

実装の順番として最初にコンビネータスタイルじゃない実装でいくつか試してみる必要があると思うが、
この時に実装したものは、最初はとりあえずはそのままプリミティブの単位にしてもいいんじゃなか、という気がする。

また、今回は合成の合成は作らなかった。
コンビネータスタイルでは合成側も合成出来る方が多いと思うのだが、Pythonで部分適用とか書くのはちょっとかったるいし、不要だったから。
この辺もやりたい事とPython向きな範囲でバランスをとる必要があると思う。
ただ必要があれば別にPythonで合成の合成を作る事も出来る。

NumSとかCharSとかは、本来は文字種をサンプルする、という一般的なOneOfNamesFで作る事が出来る。
OneOfNamesFを実装したのがNumSとかより後だったのでそのまま使っているが、別にxxSは全てこのxxFで作るという形に統一する事は出来たと思う。
これはコンビネータスタイルに直す時に良くある事だと思う。
最初はPython上でxxSを幾つか実装していたが、実はもっと一般的なxxFが一つあれば全xxSはそれで作れる、みたいなの。

また、NumCharSとかは、数字と文字の一覧からサンプリングしているが、
原理的には、NumSとCharSのOrFで同じ物が作れる。
ただサンプリングの比率を全文字で一定にするには、NumSの範囲とCharSの範囲の比率にする必要がある。
CharSはa-zまでの23文字と大文字とかこまごましたシンボルがあるので40文字くらい？
NumSは10文字なので、

```
NumCharS = OrF([0.4: CharS], [0.1: NumS])
```

みたいなので作る事が出来る。
だがそれよりは素直にPython側で、文字と数字を合わせた集合を作る、つまり`list(set(num_names+char_names))`として、

```
NumCharS = OneOfNamesF(list(set(num_names+char_names)))
```

とする方が素直と思ったのでそうしている。
この辺ももっとDSL上でやろうと思えば上のOrFみたいなやり方で全部書けるはずだが、
これで十分何やっているかは分かりやすいので十分と思った。

ただこの辺の、下のプリミティブをどこまで原始的な所まで下りるか、という問題は、最終的な記述には影響を与えない。
NumCharSをどう作っているかは、別にNumCharSを使って記述する部分から先には影響がない。
だから最後の方の記述が適切であれば、それらの構成要素をどう作っているかはあまり重要では無いので、一番楽な方法でやるのが良いんじゃないか。

Pythonだとこの辺かな、というラインは関数型言語とは結構違うので、この辺はPythonらしい範囲でうまい事やりたい。
現在の自分のバランスとしては、以下くらいになっている、という話だと思う。

- 合成の合成はやらない
- 合成のプリミティブの粒度は関数型言語よりは大き目
- DSL側で作れるものでも、ホスト言語側で実装する事は関数型言語よりは少し多めが良い気がする

この辺の話をもうちょっと掘り下げたいが、ちょっと今は難しいのでここまでにしておいて次の機会に頑張ろう。

## 終わりに

Pythonで機械学習のデータ生成をやる時には、コンビネータスタイルが合う事が結構ある。
でもPythonの本とかにはあんまり出てこないので、どっかで覚えた方が良さそう。
ライブラリを使うんじゃなくて自分で作る時に良い、という話。

関数型言語でやるのとPython+Notebook環境でやるのでは多少違いもあるので、
Python+Notebookに合わせたやり方をやるべきと思う。
この環境での適切な落としどころはまだ自分の中でも結論は出てない所なので、他の人の考えも聞きたい。