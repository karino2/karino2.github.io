---
title: C++でシンボリックなツリーを扱うライブラリとかは無いものか？
layout: page
---
今回仕事では計算グラフを作るにあたり、ツリーはライブラリ的な汎用の物を作ったのだが、
その中身は普通にクラスとかstructを作って入れている。
で、全ノードにequalityとか大小比較とかを実装しては居ないので、
mapに入れられなくて困ったりとかいまいちな事が結構ある。

一方でシンボリックなツリーって非常に汎用なもので外部への依存も全然無いので、
ライブラリ化できても良さそうな気もする。単なるS式プロセッサみたいなもんだし。
そう考えれば、JSONのライブラリというのはかなりそれに近い物だな。
あれは辞書型みたいなのが汎用になってしまうのでもう少しtypedな物であって欲しいけれど。

シンボリックなツリーやその扱いがいい感じにライブラリ化されていれば、
DSLを使ってシンボリックなツリーを作ってそれを操作して最後に解釈する、
という類の構造を実装するのはずっとお手軽になり、いろんな問題に適用出来るようになる気がする。
なんとかできんかなぁ。

ノードのequalityだとかを実装するのを自動化しようと思えば、tupleみたいなテンプレートライブラリになるよなぁ。
一方でツリーのノードは同じサイズである必要があるだろうから、
ツリーにはunique_ptrを入れるんだろうか。そうするとポリモルフィックにする必要あるよなぁ。
いやぁ、ポリモルフィックにしちゃうとtupleのequalityそのままは使えないよなぁ。
ここが一番良くわからない所だが、ここさえ乗り切れれば作れそうな気もする。
なんとかならんかなぁ。
tupleをCRTPすればどうにかなる？

シンボリックなツリーのノードとしては、自身のノードの種類を表すenum値かなんかがあって、文字列とか数値とかの基礎的なメンバが持てて、
あとはなんかuser_data的なのがぶら下げられれば十分かねぇ。

ツリーは副作用レスというか、作り直ししか出来ない、という形がいいのかなぁ。
サブツリーだけ変更したい事は結構あるんだが、なんかまずい事はあるだろうか。
あるノードが別のツリーへの参照を持っているとそれがstaleになる事があるんだけど、
そういう事はあるのかな？あるなら毎回作り直しと割り切ってしまう方がいいかもしれない。
だいたいこの手のシンボリックなツリーってだいたいは大したサイズじゃないんだよな。
だから毎回作り直しでもまぁ平気な気はする。

うーむ、なんかそんなに簡単では無いが、頑張れば実現出来そうな気もするなぁ。
少しググった感じでは見つからなかったが。
BoostのPropertyTreeとか近そうなので、これを良く理解していれば作れそうな気もするが。

----

追記: 寝起きに布団の中で考えたらいけそうな気がしてきたのでメモ。

ツリーの中のデータは、プリミティブ型のunionのようなもの（実際はanyか）で表す。(ツリーはコンテナとしてすでに実装がある)

とりあえずAtomと呼ぶ。

```
template<typename ENUMTYPE>
struct Atom_
{
   union
   {
       ENUMTYPE e;
       int64_t i;
       std::string s;
   };

   enum class Type{ Enum, Int, String };
   Type t;
};

using Atom = Atom_<AtomType>;

Tree<Atom> tree;

using Node = Tree<Atom>::Node;
```

ENUMTYPEはこのツリーのシンボルを表すenum classで、このライブラリを使う側から与える。例えば以下みたいな感じ。

```
enum class AtomType {
    INT_IMM,
    UINT_IMM,
    STRING,
    TYPE,
    VARIABLE,
    EXPR,
    EXPR_LIST,
    CALL,
    LET,
    DEF,
    ...
};
```

実際はさらに外からのユーザーデータ的なのをぶらさげたい気はするが、クローン時の寿命管理をどうすべきかは良くわからないな。

で、このツリーに対し、アクセサクラスを作る。
このアクセサを作る為の、tupleに似たテンプレートベースのライブラリを提供する。

```
template <class ...T>
Accessor
{
    ...
};
```

Accessorのテンプレートには、

1. 自身を表すenum
2. 子供の種類（複数）

を指定する。子供というのはメンバ変数的なもの。

例えば以下のような感じ。

```
using IntImm = Accessor<INT_IMM, int64_t>;
using StringImm = Accessor<STRING_IMM, string>;
using UIntImm = Accessor<UINT_IMM, int64_t>;
using TypeNode = Accessor<TYPE, int64_t, int64_t>; // signed, unsignedとかとビット長とか
using Variable = Accessor<VARIABLE, TypeNode, string>;
using Expr = Accessor<EXPR, int64_t, Node>;  // 真ん中はこのexprの種別を表すint値。
using ExprList = Accessor<EXPR_LIST, vector<Expr>>; // 最後の子がvectorだったらそれい以後の子供をコンストラクタで全部vectorにまとめる
using Call = Accessor<CALL, string, ExprList>;
using Let = Accessor<LET, Variable, Expr>;
using Def = Accessor<DEF, string, ExprList, Expr>; // somfunc(a, b, c) = value 的な定義
```

これらの型は、サブツリー（ASLのforest同様、ノードがサブツリーを表す）を渡してインスタンス化出来る。

```
Node someSubTree, anotherSubTree;

Let l(someSubTree);
ASSERT( LET == e.getType() );
Variable v = l.get<1>();
Expr e = e.get<2>();

Expr e2( anotherSubTree );

// ハッシュや比較演算子は自動生成出来ると思う、
e == e2
```

ようするにデータとしてはプリミティブ型のS式のような物として扱う事でハッシュとかequalityはサブツリー単位で自動生成出来て、レコード型のように扱える。

一方でツリーのDTD的な知識はAccessorとして表現して、テンプレートのライブラリとして提供する事で、
使う側は自分のドメインの専用の構造体のように扱える。
ビルダとしてもたぶん使えるよな。

Exprのようになにかのunionになってるケースでは、別のノードとして作って、子供の種別を表すintと子供の
オブジェクトを持たせて代用する。子供のNodeはキャストして使う。かっこ悪いが仕方ない。
Nodeはサブツリーになっていて、別のアクセサでラップして使う。

可変長のリストはvector型として表されて、vector型は最後の子供だけ許される。
vector型の子供はコンストラクタで子供をなめてvector的な構造に詰める、みたいな感じ。

ツリーを走査して新しいツリーを作るような関数などをいろいろ提供することで、
シンボリックなツリーを作ってそれをtransformしていくような事が出来る。

Accessor作る所がちょっと大変だが、tupleが出来るのだから実現可能なはず。
このライブラリがあれば仕事で書いたコードもたくさんのノードの定義のコードが自動生成になるのでだいぶ楽になるのになぁ。

うーむ、これは計算グラフ時代のC++ライブラリとしてはなかなかクールな気がするなぁ。

2ヶ月前に思いついていたら作っていたが、もうすでに手で書いてしまったあとなので、
次必要になるまではやらんかなぁ。Accessorさえできれば他は書き直してもいい気分ではあるが。
Exprのequality比較が自動で出来るのは嬉しい気がする（共通のsub expressionとか探すとO^2だが…いや、immutableならhashがキャッシュ出来るな）。