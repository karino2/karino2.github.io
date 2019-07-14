---
title: Pythonでトレーニングセット生成に言語内DSLを作る
layout: page
---

トレーニングセットなどのデータセットを作るのに、
いわゆるコンビネータ型のライブラリのようなものを作って書いた。

といってもライブラリにした訳じゃないのでライブラリを書いた、という訳でも無く、
なんとタイトルをつけたらいいか分からずにこのようなタイトルになっている。

ライブラリじゃないので他人に使って欲しいとか思ってる訳じゃなくて、
なんというか、コンビネータの流儀が便利でいいんじゃないか、という、流儀の話をしたい。

## 問題設定

まず具体的に何をやったのか、みたいな話をしてから、本題に入りたい（が本題よりも前置きの方が大分長くなりそう）。

aとかnとか、一文字のシンボルのストロークデータがある。
ストロークデータというのは1ストロークがx, y座標のリストで、そのストロークのリストで表現される。

これらのストロークデータを拡大縮小したり移動したりして、例えば $$a^n$$とかのストロークデータを作り、
これのラベルデータを`a^n`としたい。

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

ちょっと読むのは大変だけど、ようするに適当な字種と先ほどのsupscなどを与えると、
lsから対象となる字種をサンプリングして、supscを呼んで結果のリストを返す。

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

データセットとしては、最初は解ける程度の簡単な奴から始めて、
だんだんと複雑にしていって最終的には普段使いそうなのを全部サポートしたい。
だからこの手の変更は今後どんどん続いて行く。

こういう時、コンビネータ型のライブラリに慣れている人ならコンビネータ型のライブラリを作るか、となると思う。


続く。


