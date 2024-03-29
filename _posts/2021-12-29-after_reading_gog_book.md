---
title: The Grammar of Graphics を読み終わっての感想
layout: page
---

[【書籍】TheGrammarOfGraphics](https://karino2.github.io/RandomThoughts/【書籍】TheGrammarOfGraphics)を読み終わったので感想など。

<iframe style="width:120px;height:240px;" marginwidth="0" marginheight="0" scrolling="no" frameborder="0" src="//rcm-fe.amazon-adsystem.com/e/cm?lt1=_blank&bc1=000000&IS2=1&bg1=FFFFFF&fc1=000000&lc1=0000FF&t=karino203-22&language=ja_JP&o=9&p=8&l=as4&m=amazon&f=ifr&ref=as_ss_li_til&asins=B00HWUVHXK&linkId=0e7b53a6005ea66f8e781a7f8376e0e3"></iframe>

素晴らしい内容を無駄に難解に、しかも余計な事もたくさん書いた本だと思う。
書き方にはたくさんの文句をつけたいけれど、書かれている内容の良さがすべてを補ってあまりある。

著者はSPSSのグラフ機能の開発者で、それを題材にして解説したものという風に見える。
MINIX本がMINIXを対象にOSの説明をするのに少し似ていて、この本はSPSSのグラフ機能を具体例にその背後にある理論を説明しているように見える（ただSPSSの話はそんなには表には出てこない）。

なお、ここではGrammar of GraphicsをGoGと略す。

## 書き方が無駄に難しくて酷い

実質テーブルとSQL的な話で書けるはずの事を集合論的な高度に抽象的な書き方をするせいですごく読みづらい。
しかもご利益はほとんど無い。
普通はそうした一般的に扱うおかげでより広い対象に対して適用出来るとかあるのに、この本にはそれが無い。ただ無駄に難しいだけ。
具体的なテーブルを示さないせいで、どれがカラムの名前でどれがpredefinedな変数なのかとかも推測しながら読まないといけない、と難しさがただ増している。
そして唐突に挟まるオブジェクト指向語りが90年代のノリで読んでいて辛い。
Grammar of Graphicsはオブジェクト指向でうんたらとかいうが現代の視点で読めばオブジェクト指向全く関係ない。酷い。
その紙面をテーブルのデータの最初5行を表示する事に使えば10倍以上読みやすくなるのに…

と文句はすごく言いたいし、そのせいで２回も自分は過去にこの本の序盤で挫折しているので、それは大多数の読者にとって単なる愚痴にとどまらない、致命的なレベルで酷いのだけれど、
それでもこの本の内容はなかなかのものだ。
同じ内容をもっと普通に解説してくれる本が出来るまでは、この本を読む価値はあり続ける。

## 素晴らしい内容について

その内容とはようするに大部分はGoGで、それはつまり統計のチャートを生成する為のDSLという理解で良い。

ただチャートの生成と言うだけだと一見したら必要無さそうな統計処理などは、実は含まれている方が都合が良いということが分かり、
その範囲としては、

1. SQL的なデータの整形
2. 統計処理
3. そしてグラフの生成に関わる指定

が入る事になる。

なお、グラフという単語は統計のグラフとグラフ理論のグラフが両方出てきてややこしいし、Graphicsは独自に定義された語で普通のグラフィックスとは意味が違うのでこういう感想では使いづらい。ここではチャート、グラフをだいたい同じ意味で統計のグラフとして使い、グラフ理論のグラフはなるべく出さない事にする。
本書ではチャートじゃなくてグラフィックスなんだよ、と言う説明があるけれど、グラフィックスという言葉の定義をするのが結構長くかかる（さらに普通のグラフィックスと全然意味が違う）ので、ここではチャートという用語も使う事にする。

さて、この本は上記の3が本体であるのだけれど、1と2にもそれなりに紙面が割かれる。
それらの各構成要素について、

- 既存の研究を紹介し、
- 数学的なものや論理的なものを記述し、
- さらに心理学的な人間の知覚され方などの研究を紹介して、
- GoGでどうなっているかの記述として不完全な具体例

が続く。最後の記述が不完全なせいですごく読みづらく、GoGがどういうものかある程度分かっていないと読むのが大変。でもそれを知るために本を読んでいる訳で、鶏が先か卵が先かという問題が無駄に発生する。
なお終盤の18章まで行くと細かい仕様のほぼ完全な解説が始まり、これでようやく記述の意味が厳密に理解出来るようになる。
でもここまで行く頃にはもうだいたいすべてを理解したあとだろう。
この定義されてない物を長々と読んでだんだんと分かっていくというのが読んでいてとてもつらい体験になる。

しかも既存の研究や心理学的な感じ方などがすべてGoGに結実している訳では無い。
だから長々といろいろな難しい事を解説したあとに、
それと全然関係無いGoGの記述が続く、という事が頻繁にある。
この、必要無い所が難しい、というのがますます読む気力を損なう。

### 統計のグラフという研究分野の基礎を理解出来る

では、GoGには反映されていないグラフの議論を紹介する意義はなんだろうか？

この直接GoGとは現時点では関係してない様々な関連研究の紹介は、
統計のグラフというものの理解を深めるのにとても役に立っている事が、あとから分かる。
最初学んでいる時は「なんじゃこりゃ、無駄だなぁ」と思っていたが、後半になっていろいろ実例が出てきて、
「こういうグラフは避けるべき」というような文を見る都度その理由が理解出来て、
おぉ、意外と役に立つな、と思う機会がちょくちょくある。

GoGだけの説明ならもっとずっと短く簡単な本に出来ると思うし、[【書籍】ggplot2、ElegantGraphicsForDataAnalysis](https://karino2.github.io/RandomThoughts/【書籍】ggplot2、ElegantGraphicsForDataAnalysis)も部分的にはそういう本だ（短くは無いが）。
だが、本書を読み終わって見ると、それでは明らかに不十分と思うようになった。
現時点でグラフという事について分かっている事をまず心の中に作って、
その中にGoGというのを置くという事に意味があるように思う。

分かっている事はまだまだ未完成なので記述も未完成のものになって、
一見すると何を言いたいのか良く分からない事も多い。
だがその良く分からない事がまさに現状の未理解さを表していて、
その曖昧な理解の境界を理解したあとに、そのずっと内側でGoGの話が行われるのを見る事で、
GoGの占めている範囲を心の中に描く事が出来るようになる。

GoGがグラフという物の理解の土台になり、またグラフというものの理解がGoGに反映されてない余白を通してGoGという物の理解を深めてくれる。
それらの相互作用を通して統計のグラフという研究分野を知って理解を深めるのがこの本の内容という事になると思う。
そしてGoGとは直接関係の無いグラフについての様々な議論を知ってみると、
グラフを書く時に気をつけないといけない事などもその中から取り出せるようになり、
学んでいる時に思ったよりも役に立つ知識である事も分かる。

この統計のグラフというものについての研究の基本的な事を学ぶというのがこの本の意義の一つに思うし、それは成功していると思う。
そして他の本でこれだけ見事にまとめられているのは見た事が無いので、これだけ書き方に問題を感じるにも関わらず、
この本が唯一無二の価値を提供していると認めざるを得ない。

読み終わった印象として「こんな研究分野があったのか」という率直な感想を持つ程度にはこの分野を理解出来た。
さらにこの分野で重要な研究を行った人の名前は理解出来て、
もっと詳しく知る必要があればどの論文を読むべきかは分かるようになった（さらに学ぶ日は来ないとは思うが…）。

### グラフを見たら、GoGを経由する事で簡単にそのグラフの再現方法が分かるようになる

さて、統計のグラフという研究分野なんて大風呂敷はおいといて、GoGというもの自体に学ぶ意義はあるのだろうか？
私はあると思った。

GoGを学ぶ直接的なご利益としては、グラフを見た時に、それの再現方法が分かるようになる、というのがある。
これはデータがあった時に、こういうグラフで見てみたいと思った時にそれが簡単につくれるようになる、
という事と、またデータがあった時に取れる可視化の手段も思い浮かぶようになる、という事。
これは多分GoGを学ぼうと思う人の一番のモチベーションで、それには見事に答えてくれる。

Grammarというのは、要するに直行した小さな構成要素とその組み合わせで構築する何かだ。
ようするにUnixのコマンド的な奴だ。
で、GoGを学ぶと、グラフを見た時に、それを構成要素に分解してどう組み合わせるか、と考える事が出来るようになる。
驚くほど多くの複雑なグラフは、構成要素は良く使うかんたんなものばかりな事に気づくし、
またあまり使わない構成要素を使っているグラフを見かけても関連する章を見直せば調べるのは簡単に出来る事が分かる。
例えば人口ピラミッドとかExcelとかで書く時にはどうやるのか良く知らないグラフも簡単に書けるようになったし、
本書の終盤に出てくる例は自分が生涯書く事が無いであろうレベルで複雑なグラフだけれど、
その書き方も難しい事は何もなく理解出来た。
それら使わないレベルに複雑なものまで構成要素に分解して組み合わせる方法で自然に理解出来るのだから、
常識的に現れるレベルのグラフはすべて再現出来るだろうな、という自信を持った。

本書の冒頭で、この本の目的として心に浮かぶグラフとそれが実際に描かれるまでの距離を縮める、
的なのがあった気がするが（今見直しても見つけられなかったが）、それは言葉の通り達成出来ていると思う。
これは習得しておくに値するスキルだと思った。

またGrammarという言葉から想定されるように、
構成要素に分解して組み合わせる事で実現「出来ない」グラフもある事が分かる。
そしてそれらがなぜ出来ないのかも構成要素を理解していると理解出来て、
結果としてなぜそのグラフが「作ってはいけない」グラフなのかが理屈で理解出来るようになる。
文章の文法的な誤りが分かるようになるようなものだ。
それはGoGを使わなくてもグラフを書く時に役に立つ事と思う。

さらに構成要素に分けて考える時に、前述した各構成要素の研究の話が頭をよぎってそれぞれ適切な選択をする助けになってくれる。
グラフを書くという事について、GoGを通す事でよりそのグラフに対する理解が深まり、
またGoGの周りに展開された議論がさらに書くべきグラフについての知識を補ってくれる。
だからこの本を読み終えるとグラフに対する理解はすごく深まる。

だからグラフを書くのにggplot2なんて使わんがな、という人でもGoGを学ぶ意義はあると思った。
ただGoGを学んだら、GoGで書かれたライブラリ使いたくなるよなぁ、とは思う。

## 難解なこの本の攻略の仕方

さて、挫折２回を経て無事克服した自分の思う、この難解な本の読み方について。
[【書籍】TheGrammarOfGraphics](https://karino2.github.io/RandomThoughts/【書籍】TheGrammarOfGraphics)にもダラダラ書いた事ではあるが。

### 先にggplot2を軽く学ぶ方が良い

まず、[【書籍】ggplot2、ElegantGraphicsForDataAnalysis](https://karino2.github.io/RandomThoughts/【書籍】ggplot2、ElegantGraphicsForDataAnalysis)は先に読んだ方が良いだろう。
ただ細かい指定を全部追う必要は無いので、4〜6章が理解出来る程度に2〜3章は流して読んで良いし、
7, 8章は眺める程度で十分に思う。

次に[A Layered Grammar of Graphics](http://vita.had.co.nz/papers/layered-grammar.pdf)も軽く見ておく価値はあると思う。
こちらは軽く眺める程度でいいと思うけれど。

どちらも本書で得られるものはあまり得られないのだけれど、具体例をある程度頭に入れたあとの方が読みやすいので、
具体例をなめる意味で見ておくのがいい。

### 各章は、前半より後半に力を入れて読む

先にも述べたように、各章は、

1. 論理的、数学的な話
2. 心理学的な話
3. GoGの話

と構成されていて、1が一番読みづらく難しく、しかもそれらは3を理解するのにはほとんど必要では無い、という構成になっている。
だから毎回1で細部に苦戦してしまうとなんの話をしているかもわからなくなって、すぐに挫折してしまう。

だから読む時は3から読みたい所なのだけれど、3だけ読むといまいちなんの話をしているか分からないとも思うので、

- まず1とか2でどういう話をしていているかを把握して、どこらへんが分からないのかを意識しながらサラサラ読み進める
- その内容を踏まえて3を読む
- 3を読んで関連する1とか2の場所が分かる所にあたったら1とか2に戻って突き合わせて少し考えてみる

みたいに読むのが良いと思う。
1と2を、3を理解する為の補助教材と割り切って適当に読むのが良い。

### varsetやnestなどのあたりは具体例の方を考える

この本を読んでいて挫折するのはvarsetでデータの所が書かれていて、それが良く分からなくて挫折するのが最初のポイントに思う。
記述は数学的に書いてあるが、それをすべて数学的に厳密に理解しようとするよりは、
ggplot2でのdataframeでの同じような物について考える方が良い。

5.1.5まで行くとSQLでの例も出てくる（がnestはこれでは分からない…）ので、これも少し見てみると良いかもしれない。

とにかく、説明は集合論の言葉で書かれているが、これはかなり難解なので、
それよりも具体的にテーブルを考えて出力が何かを考える方が良い。

nestもかなり何を言っているか分からないと思うので、具体例が出てきた所で実際に出力されるであろう物に集中して考える方が良い。

### 分からない時は少し先を見てみる

各章の読み方でも触れたように、この本は先に難しい記述があってあとに具体例がある事が多い。
だから分からない事にぶつかった時にはそこで考えすぎるのではなく、少し先を探してみるのが良い。

この本の最初の挫折ポイントはたぶん3章だろう。
今読み直してもこりゃ分からんわ、という書き方になっている。
一方である程度進んだあとに該当箇所を見直しながら突き合わせると、もっとずっと分かりやすい。
だから先に4章とか5章あたりまで進んでしまう方が良い。

別の例としては、例えば5.1のあたりは何を言っているか分からない部分も多いと思うが、5.1.5ではSQLで同じ事を書いた例が出てきて、こちらを見てから読む方が分かりやすい人も多いだろう。

### 3章の克服の仕方

先に述べた通り、この本の最初の挫折ポイントはたぶん3章だろう。
で、読み飛ばすと次の4章も意味が分からず、さらに5章の冒頭もさっぱり意味が分からなくて挫折する。
だが、5.2まで進むと一気に分かるようになるので、どうにか5.2までたどり着く、というのが最初の目標になる。
まずその事を理解しておくべきだろう。

また、先程も述べた通り、先に進んで具体的に使われる所まで来てから3章に戻る方が分かりやすい。
だからなんの話をしているかだけ把握したら先に進んでしまうのが良いかもしれない。

さて、先に進んだあとに戻ってきて突き合わせても、reshape.triとかが具体的にどう動くかをちゃんと理解しているとは言い難い状態だと思う。
そこで重要になるのは  
**「この辺の内容は理解出来ていなくても最終的にどういうdataframeになるかが想像できれば問題無い」**  
という事実。
だから、最終的にどういうdataframeになるかを想像するのが大切となる。
この辺はggplot2本の内容を思い出せばかなり想像出来ると思う。

### 未定義の変数はだいたいテーブルのカラム名

序盤に未定義の変数がいっぱい出てきてわけが解らなくなる、というのが一つの挫折のパターンと思う。
未定義の変数はいろいろあって、最後まで何なのか分からないものもちょくちょく残るが、
大多数はテーブルのカラム名。
これが分かっているだけでだいぶ気が楽になる。

あと地図データはlongitudeとlatitudeはなんか特別な意味があるっぽい（アメリカの州の境界線のデータか？）。lonとlatがテーブルのカラム名。

具体的なテーブルの形が分からないまま想像しなきゃいけないのが辛い所だが、
「まぁたぶんこんなカラム名のテーブルがあって、適当にjoinしたりする事で目的のdataframeが出来るんだろう」
くらいに思って眺めれば割と納得出来る所は多いと思うし、
その位の理解で先に進むべきと思う。
むしろ目的のdataframeを具体的に想像する方が大切。

だいたいの場所で、その辺の話は本題じゃなくて、目的のdataframeが得られたその次の行が本題のはずなので、
本題の方が理解出来ていれば手前はどうでも良い、と考えるのが大切。
実際読み終わってみると、書いている側もそういうノリで書いているんじゃないか。

本題の手前の関係ない所で詰まるように書かれているのは、この本がそういうものなので仕方ない、と割り切って、
どこが本題かを意識して読む必要がある。
「本題じゃない所が未定義で理解不能にかかれている事は良くある」と思っておいて、そこを理解しようとせずに本題の方を理解しようと意識して読む必要がある。

最後まで読み終わってみると理解不能にかかれていると思った所も割と理解出来ると気づくが、
無意味にわかりにくく書かれているのは間違いないので、そこで脳を浪費しない方がいいのは間違いない。

### 開幕のオブジェクト指向の話はすべて無視して良い

最初にあるモチベーションのかなりの部分を削ると思われる序盤のオブジェクト指向語りだが、
全く関係ないので読まなくても良いし、読む時もあまり考えて読む必要は無い。
ここでモチベーションを消滅させないように注意する必要がある。

1章がこれって罠だよなぁ…

イントロはグラフについて語れよ！グラフの本なんだから！と思ってしまう。

### こんな事をしておいたら学びやすいのでは無いか

これは自分が試した事じゃなくて完全に想像で適当な事を書くが。

まず集合論の訓練は必要だろう。
位相幾何の記述が長いが、それが理解出来なくてもそれが良くある位相の話であると識別出来る程度の理解は必要に思う。

さらに具体的にdataframeの変形をいろいろやるべく、ggplot2を触るのがいいんじゃないか。
自分は実際にggplot2を触るという事をやらなかったが、RStudioインストールして実際にggplot2本の例とか試しながらいろいろ試してみると、
もうちょっと3章のあたりを感覚的に理解出来るかもしれない。

この２つの条件くらいなら割と意欲的な学生なら満たせるし、プログラマでも満たす事は可能なんじゃないか。

## まとめ：めちゃ読みづらいがグラフを描く人は読むに値する素晴らしい本である

グラフを描くという事について深い理解を与えてくれる。
グラフを描く人はたぶん学ぶべき本なんだろうな、とは思える。
本来はすべての大学の一年生が学ぶべき内容に思う。
コンピュータリテラシ的な授業で。

一方でこの不要な学びにくさがあまりにも酷いので、大学一年生に勧める気は全く起こらない。
集合論の訓練を積んだ経験が無いと読むのは辛いだろうし、
またdataframeとかSQLをある程度触った経験が無いと必要な想像が出来ず読み解け無いと思う。
これらの条件を満たす大学一年生は居ないだろうし、
平均的なプロフェッショナルのプログラマもたぶんこの条件は満たしていないだろう。
少なくとも自分は２回挫折した訳で。

という事で、この本は「読んだ方が良い人々」と「読み解く事が出来る人々」の間にものすごいギャップがある。
ただ「グラフを描く、人の描いたグラフを見る」という機会の多さを思うと、
人生のどこかで時間をかけてこの本を理解しておく意義はあるのでは無いか、と思った。

最初に述べた大風呂敷に見える大きな目標がすべて見事に達成されているのは、すごいと認めざるをえない。

また自分の日々の仕事をこういうレベルに昇華するのは、一つのお仕事プログラマの目標として素晴らしいよなぁ、とも思う。