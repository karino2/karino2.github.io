---
title: Halideコード読み その4：lowerとrealization_order
layout: page
---

- [Halideコード読み その1： realizeからlowerまで](https://karino2.github.io/2020/10/14/halide_reading_1.html)
- [Halideコード読み その2：Funcの組み立て](https://karino2.github.io/2020/10/14/halide_reading_2.html)
- [Halideコード読み その3：lowerとIRの組み立て](https://karino2.github.io/2020/10/15/halide_reading_3.html)



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

[Halideコード読み その5：lowerとschedule_functions、IRの生成の中核](https://karino2.github.io/2020/10/19/halide_reading_5.html)へ続く
