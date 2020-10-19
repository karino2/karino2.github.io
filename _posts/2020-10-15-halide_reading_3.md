---
title: Halideコード読み その3：lowerとIRの組み立て
layout: page
---

- [Halideコード読み その1： realizeからlowerまで](https://karino2.github.io/2020/10/14/halide_reading_1.html)
- [Halideコード読み その2：Funcの組み立て](https://karino2.github.io/2020/10/14/halide_reading_2.html)

### lowerを追う、その1

今日は中間コード生成のあたりを読みたい。

たぶんその1で途中まで見たLower.cppのlowerだと思うので、その続きから読んでみよう。

まずenvというのを作ってる

```
    // Compute an environment
    map<string, Function> env;
    for (Function f : output_funcs) {
        populate_environment(f, env);
    }
```

populate_environmentは前々回にちらっと見たが、ようするにrecursiveにFindCallsしたモノを足していく。
つまりenvはoutput_funcsから呼ばれている関数が（自身も含めて）入る。

次にcompute_rootとstore_rootしている。

```
for (Function f : outputs) {
    Func(f).compute_root().store_root();
}
```

コードを追うのは後回しにして、これらの関数のヘッダのコメントだけ読んでおく。
compute_rootは全範囲を最初に計算する、store_rootは配列の定義をrootに置く、という感じかしら。
これらの関数が具体的になにをするかは分からないいけれど、追うのは後回しにして先に進もう。

その後lock_loop_levels()というのをやっているがなんだろう。とりあえず無視して先に進もう。
その後realization_orderというのを呼んでfused_groupsというのを作っている。

```
    vector<string> order;
    vector<vector<string>> fused_groups;
    std::tie(order, fused_groups) = realization_order(outputs, env);
```

ここは理解する必要がありそうだが、一旦先に進んでから戻ってこよう。
そのまま少し読み進めるとschedule_functionというのでStmtというのを作っている。

```
Stmt s = schedule_functions(outputs, fused_groups, env, t, any_memoized);
```

このStmtが目的の中間コードっぽいな。schedule_functionsを読んでみよう。

う、ちょっと辛い感じだ。もうちょっと周辺知識を集めてからじゃないと理解出来なさそうだな。

schedule_functionsに挑む前に、Stmt周辺を見てみるか。

### StmtとIR周辺を追う

Expr.hにIRNodeTypeとか中間コードのニモニックっぽい物が定義されているので、このヘッダを眺めていこう。

コメントがそこそこあって、割とこのヘッダだけでも理解出来る。
大きくExprとStmt(ステートメントの略っぽい）があるのだな。

中間コードの使われ方を見るべく適当にIRNodeTypeのどれかでFind All Referenceすると、IR.hが引っかかった。
ExprやStmtのconcrete classはIR.hの方にあるっぽいな。

使っている側を探すとCodeGen_XXXとかが見つかる。visitorパターンになっててvist側しか無いのでたどる側を知りたいな。
このacceptは誰が持っているんだ？CodeGen_Cを見ると、IRPrinterのサブクラスになってる。

IRPrinterを直接触ってる子は見つからないな。
CodeGen_Cで使われてる所を見てみるとModule.cppの`Module::compile`で使われている。
compile関数の該当箇所を適当に抜き出すと以下。

```
    if (contains(output_files, Output::c_source)) {
        Internal::CodeGen_C cg(...);
        cg.compile(*this);
    }
```

つまりcompileメソッドがエントリポイントっぽいな。

軽く見ているとCのコードをいろいろ出力しているが、だいたいはプロローグというか目的の関数の外側の、utility関数とかの定義になっている。

本体は以下の所っぽいか？

```
    // Emit the body
    print(f.body);
```

bodyがどうやって出来るか追わないと意味が無さそうだな、、、いや、このf.bodyはStmtだな。
printはIRPrinterのメソッドだ。この中でacceptが呼ばれている。

```
void IRPrinter::print(const Stmt &ir) {
    ir.accept(this);
}
```

これがvisitorのエントリポイントだな。
acceptの中を軽く追うと`IRNode::accept`が呼ばれるっぽくて、これは以下とかが呼ばれるっぽいか？

```
template<>
void ExprNode<Add>::accept(IRVisitor *v) const {
    v->visit((const Add *)this);
}
```

引数が幾つかとかはどうなっているのだろう？
CodeGen_C側を見てみると以下。

```
void CodeGen_C::visit(const Add *op) {
    visit_binop(op->type, op->a, op->b, "+");
}
```

ふむ、Addはaとbを持つという事になっているのか。これがネストした構造になるのね。

ついでにこのAddを作る側も覗いておくか。
Exprの+のオーバーロードの定義を見ると以下

```
Expr operator+(Expr a, int b) {
    Type t = a.type();
    Internal::check_representable(t, b);
    return Internal::Add::make(std::move(a), Internal::make_const(t, b));
}
```

`Add::make`を見ると以下

```
Expr Add::make(Expr a, Expr b) {
    Add *node = new Add;
    node->type = a.type();
    node->a = std::move(a);
    node->b = std::move(b);
    return node;
}
```

AddはIRなのにExprをそのまま持つのは不思議な感じするね。visit側を見ていくとExprのacceptを呼ぶのでまぁそういうもんなのかもしれない。

なお、この辺追ってる時にIRPrinterのtestというメソッドを見つける。
Stmtを手で作ってて、なかなか参考になる。あとで似たようなのをビルドして動かせるようにしていろいろ試したいな。

ここまででIR側はまぁまぁ理解が進んだ。

[Halideコード読み その4：lowerとrealization_order](https://karino2.github.io/2020/10/19/halide_reading_4.html)へ続く
