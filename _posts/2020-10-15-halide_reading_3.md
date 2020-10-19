---
title: Halideコード読み その3
layout: page
---

- [Halideコード読み その1](https://karino2.github.io/2020/10/14/halide_reading_1.html)
- [Halideコード読み その2](https://karino2.github.io/2020/10/14/halide_reading_2.html)

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
う、ちょっと辛い感じだ。その前にStmt周辺を見てみるか。

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

### lower＞realization_orderを追う

IRがどういう感じかは理解が深まったので、組み立ての方に戻る。lowerの続きを読もう。

まず以下のfused_groupとはなにかを理解したい。

```
    vector<string> order;
    vector<vector<string>> fused_groups;
    std::tie(order, fused_groups) = realization_order(outputs, env);
```

という事でrealization_orderを見てみよう。
まずヘッダのコメントを読む。

どうもいろんな呼び出し関係にある関数を引数にとって、スケジューリングをする順番を返すっぽいな。

realization_orderのコードを見ていこう。

最初になにかやってるように見えるのは以下の部分。

```
    for (auto &iter : env) {
        ...
        populate_fused_pairs_list(iter.first, iter.second.definition(), 0, env);
```

なにも返さないのでFunctionの中になにかぶら下げるぽいか。
populate_fused_pairs_listを見てみよう。

```
void populate_fused_pairs_list(...) {
    const LoopLevel &fuse_level = def.schedule().fuse_level().level;
    if (fuse_level.is_inlined() || fuse_level.is_root()) {
        // 'func' is not fused with anyone.
        return;
    }

    auto iter = env.find(fuse_level.func());
```

まず`def.schedule().fuse_level().level`というのが大切ぽいな。defはEnvの関数のDefinition。
fuse_levelってなんぞや？と適当に検索していると、どうもcompute_withというのでだけ設定されているように見える。
fuse_levelもヘッダの方見るとcompute_withを読め、とか書いてある。

compute_withはヘッダのコメントを読むと、なんかcompute_atとかと同じような物に見えるが、依存が無い物同士をくっつけるらしい。
なにそれ？なんに使うんだ？

せっかくなのでLoopLevelもヘッダのコメントを読んでおこう。
なんかsiteというよく分からん単語が使われているが、ループの先頭のstatementを指しているっぽい？
コードの方を眺めていると、UnlockとLockの状態があって、Unlockは自由に変更出来るが中を見る事は出来ず、Lockは変更は出来ないが中を見ても良いという状態らしい。
lockは何度か見かけていたがそういう意味だったか。

ここまで見てきて、なんかfuseはあんま重要じゃない気がしてきた。
ループの同じ場所で実行するというへんてこな機能の為のもので、普段は使わないっぽいから。

ではorderの方に着目してrealization_orderを見直そう。

なかなか軽く読むだけだと内容は理解出来ず、`populate_fused_pairs_list`とか`find_transitive_calls`とか`find_fused_groups`を眺めていたらなんとなく理解する。
ただきっちりとは分からない。

あとを理解する為には、ここから返るfused_groupになにが入っているかが重要になる。
compute_withはそんなに興味無いのでfuseが無い状態ではなにが入るかを理解しておけば十分だろう。
その辺だけ軽く追っておく。

fused_groupとして上に返っているのは、この関数内ではgroup_orderと呼ばれていて、詰められているのは以下。

```
    vector<vector<string>> group_order;
    for (const auto &fn : temp) {
        const auto &iter = fused_groups.find(fn);
        if (iter != fused_groups.end()) {
            group_order.push_back(iter->second);
        }
    }
```

tempとfused_groupsがポイントとなる。

fused_groupはfind_fused_groupsという関数の返ってくる結果。

```
    map<string, vector<string>> fused_groups;
    map<string, string> group_name;
    std::tie(fused_groups, group_name) = find_fused_groups(env, fuse_adjacency_list);
```

find_fused_groupsはちょっと追うのは難しい。コードは以下。

```
pair<map<string, vector<string>>, map<string, string>>
find_fused_groups(const map<string, Function> &env,
                  const map<string, set<string>> &fuse_adjacency_list) {
    set<string> visited;
    map<string, vector<string>> fused_groups;
    map<string, string> group_name;

    for (const auto &iter : env) {
        const string &fn = iter.first;
        if (visited.find(fn) == visited.end()) {
            vector<string> group;
            find_fused_groups_dfs(fn, fuse_adjacency_list, visited, group);

            // Create a unique name for the fused group.
            string rename = unique_name("_fg");
            fused_groups.emplace(rename, group);
            for (const auto &m : group) {
                group_name.emplace(m, rename);
            }
        }
    }
    return {fused_groups, group_name};
}
```

find_fused_groups_dfsを理解するにはfuse_adjacency_listが何なのかとか知る必要がある。
ただ、compute_withが無ければ以下が実行されるのと同じっぽい。

```
    visited.insert(fn);
    group.push_back(fn);
```

つまりgroupはfnだけ入ったvectorになる。

その後のコードは簡易的に書くと以下みたいになる。

```
group = [fn];

string rename = unique_name("_fg");
fused_groups[rename] = group;
group_name[fn] = rename;
```

これが全envの関数に対して実行される。
だから大雑把には以下みたいな感じの物がそれぞれに入る。

```
fused_groups = {"_fg$1": [fn1], "_fg$2": [fn2], "_fg$3": [fn3], ....};
group_name = {fn1:"_fg$1", fn2:"_fg$2", fn3:"_fg$3", ...};
```

これを踏まえてこの先を読んでいく。

次はgraphというのを作っている。

graphはfuseが無い場合は以下のような疑似コードになる。

```
foreach( key, fn : group_name )
{
    graph[fn] = key
    graph[key].addAll(find_direct_calles(fn));
}
```

find_direct_callsは名前から推測すると直接呼び出しだけを集めるのかな。

つまり、fn1からのdirect callをfn1A, fn1Bとかで表すと以下のようなモノになる。

```
graph = {fn1: "_fg$1", "_fg$1":[fn1A, fn1B, fn1C], fn2: "_fg$2", "_fg$2":[fn2, fn2A, fn2B, fn2C, fn2D], ... }
```

これをなんに使うのかはよく分からんなぁ。fn1をキーとしてグループ名を引くのはなんなのだろう？
しかもdirect callだけでは間接呼び出しは集めていない事になるからこの時点ではDAGとしては不完全だ、、、っていや、envを回してるからそんな事は無いか。
envはoutputsから呼ばれる全関数が入っているのだから、graphにはおのおのの関数をキーに、それから呼ばれる全関数が入るんだな。

fused_groupというのを単位にDAGが作られるんだな。理解した。

次に進む。次はfused groupのrealization orderを計算する、とコメントに書いてある以下のコード。

```
    // Compute the realization order of the fused groups (i.e. the dummy nodes)
    // and also the realization order of the functions within a fused group.
    vector<string> temp;
    set<string> result_set;
    set<string> visited;
    for (Function f : outputs) {
        if (visited.find(f.name()) == visited.end()) {
            realization_order_dfs(f.name(), graph, visited, result_set, temp);
        }
    }
```

その後を読むと、このtempにrealizationの順番に全関数が入るっぽいかな。
その後はtempからfused_groupを引いて並べたのと、fused_groupの中身をtempでソートしたものを作って、それをpairで返しているな。
なお、result_setは使われてない模様。中で使われるだけか？

順番にソートされたものとして、最終的には以下の２つが出来る。

```
group_order = {"_fg$3": [fn3], "_fg$1": [fn1], "_fg$2": [fn2], ....};
order = [fn3, fn1, fn2];
```

fusedなモノがある場合はgroup_orderのベクトルの中に幾つかの関数が入り、orderはそれがflattenされたモノが入るんだろう。

という事でtempの作り方、つまりrealization_order_dfsを読んでいこう。

### lower＞realization_order＞realization_order_dfsを読む

まずrealization_order_dfsに渡される最初の引数を前述の呼び出しの所から見てみると、outputsの各要素になっている。

それを踏まえてrealization_order_dfsを読むと以下。

```
void realization_order_dfs(const string &current,
                           const map<string, vector<string>> &graph,
                           set<string> &visited,
                           set<string> &result_set,
                           vector<string> &order) {
    visited.insert(current);

    const auto &iter = graph.find(current);

    for (const string &fn : iter->second) {
        internal_assert(fn != current);
        if (visited.find(fn) == visited.end()) {
            realization_order_dfs(fn, graph, visited, result_set, order);
        } else {
            internal_assert(result_set.find(fn) != result_set.end())
                << "Stuck in a loop computing a realization order. "
                << "Perhaps this pipeline has a loop involving " << current << "?\n";
        }
    }

    result_set.insert(current);
    order.push_back(current);
}
```

graphでfused_groupを取り出す。その中身でforeach回して再帰呼び出しし、その後自身をorderに加える。
orderが上で言う所のtemp。つまり呼び出し先の一番下から順番にorderに加えていくんだな。
この順番にrealizationすれば、ある関数をrealizationする時にはその依存先がすべてrealizeされている、という状態に出来る。

なるほど。

これでだいたいrealization_orderは理解出来たな。lowerに戻ろう。

[Halideコード読み その4](https://karino2.github.io/2020/10/19/halide_reading_4.html)へ続く
