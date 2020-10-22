---
title: Halideコード読み その5：lowerとschedule_functions、IRの生成の中核
layout: page
---

- [Halideコード読み その1： realizeからlowerまで](https://karino2.github.io/2020/10/14/halide_reading_1.html)
- [Halideコード読み その2：Funcの組み立て](https://karino2.github.io/2020/10/14/halide_reading_2.html)
- [Halideコード読み その3：lowerとIRの組み立て](https://karino2.github.io/2020/10/15/halide_reading_3.html)
- [Halideコード読み その4：lowerとrealization_order](https://karino2.github.io/2020/10/19/halide_reading_4.html)


### lower＞schedule_functions

realization_orderはなんとなく雰囲気は分かったので、lowerに戻ろう。

この後にはいろいろ興味深そうなものが呼ばれている。見てみたいのだけ抜き出すと以下。

1. schedule_functions
2. compute_function_value_bounds
3. bounds_inference
4. sliding_window
5. storage_folding

ここでは中間表現を作った後にさまざまなoptimizeが走っている模様。
個々のoptmizeの結果なにが出来たかはデバッグ出力されているので、何か設定すれば見れそう。
ある程度読んだらデバッグ出力の方も見てみたいな。

基本的な出力と、どれか一つ最適化を理解すればこの時点ではいいかな。という事でそれっぽいのを読んでいこう。

まずはschedule_functions。

```
    string root_var = LoopLevel::root().lock().to_string();
    Stmt s = For::make(root_var, 0, 1, ForType::Serial, DeviceAPI::Host, Evaluate::make(0));
```

一行目は正確には分からないが、for文のループ変数になる何かを作ってるのはわかる。

次がメインのforループ。forの所は以下のようになっている。


```
    for (size_t i = fused_groups.size(); i > 0; --i) {
        const vector<string> &group = fused_groups[i - 1];
        vector<Function> funcs;
        vector<bool> is_output_list;

        for (const string &name : group) {
            Function f = env.find(name)->second;
```

fused_groupsは前回見たように、以下みたいなのが入っている。

```
fused_groups = {"_fg$1": [fn1A, fn1B, fn1C, ...], "_fg$2": [fn2A, fn2B, fn2C, ...], "_fg$3": [fn3A, fn3B, fn3C,...], ....};
```

fusedなモノが無ければベクトルは要素1でfn1とかだけが入っている。

最初のfor文はこのキーを逆順に回している。

で、２つ目のfor文はこのグループ内のfnを順番にまわしている。この中にはnameが入っているのでenvから関数を復元してfと呼んでいる。

内側のfor文の本体は以下。

```
    // The way in which the function was referred to in the
    // function DAG might not actually result in a use in the
    // code. This can happen if you inline a Tuple function,
    // ignoring one of the Tuple elements, and that Tuple
    // element is the sole call to a function with an update
    // definition.
    if (validate_schedule(f, s, target, is_output, env)) {
        any_memoized = any_memoized || f.schedule().memoized();
        funcs.push_back(f);
        is_output_list.push_back(is_output);
    }
```

validate_scheduleはなかなかごつい関数だが、呼び出している側のコードを理解するには深入りしなくてもなんとかなりそうなのでなるべく読まないで済ましたい。
コメントにも書いてあるが、なんとなくvalidate_scheduleの中を見ると、outputから呼ばれる範囲にあればtrue、どこからも呼ばれていなければfalseを返すっぽい。
コメントと合わせると、どこからも参照されてなければfalseを返して参照されてればtrueを返すっぽい。

で、ifの中を見るとfuncsに入れている。

ここまでを踏まえて元のfor文全体の構造を、重要な所だけ抜き出すと以下のようになっている。

```
for (size_t i = fused_groups.size(); i > 0; --i) {
    for (const string &name : group) {
        if (validate_schedule(f, s, target, is_output, env)) {
            ... (さっき見た部分) ...
        }
    }

    if (funcs.empty()) {
        continue;
    }

    if (group_should_be_inlined(funcs)) {
        debug(1) << "Inlining " << funcs[0].name() << "\n";
        s = inline_function(s, funcs[0]);
    } else {
        debug(1) << "Injecting realization of " << funcs << "\n";
        InjectFunctionRealization injector(funcs, is_output_list, target, env);
        s = injector.mutate(s);
        internal_assert(injector.found_store_level() && injector.found_compute_level());
    }
}
```

つまり一つのグループに対してoutputsから辿れる関数をfuncsに詰めて、inline可能ならinlineして、不可能ならFunction Realizationをinjectする。

この２つはどちらも興味深い所なのでなんとか追いたいな。

このfor文のあとは大した事はしてない。
ここまでをまとめると、schedule_functionsは、

1. ダミーとなる（？）root_varについてのforのstmtを作りsと呼ぶ
2. 各fused_groupに対し、outputから辿れるモノだけを抜き出す
3. 抜き出した関数群がinline可能ならinline化しsにつなげる
4. inline化出来なければ関数のrealizationをsにinjectする
5. sから外側のダミーとか要らないループを取り出し、残ったsを返す

という事をやる。

### InjectFunctionRealization周辺を読もうとする（がひとまず撤退）

まずはinline化出来ない方、つまりInjectFunctionRealizationを読もう。こっちが本体だろうから。

InjectFunctionRealizationクラスはIRMutatorを継承してvisitを実装している。
IRMutatorのmutateを呼ぶとvisitが呼ばれていくらしい。

本体はForのvisitっぽい。この中から呼ばれる`build_pipeline_group`と`build_realize_function_from_group`が重要そうだが、
この２つがまたごつい。読んでて辛い。

という事でこのまま読み進めるのはひとまずやめて、いろいろ適当なコードをビルドしてデバッグログつけて動かしてみる事にする。
いろいろ周辺知識が増えたらまた戻ってきて読もう。

### OS XでHalideを動かす

ソースコードはgithubからクローンしたが、バイナリ自体はbrewで入れてしまう。

```
% brew install halide
```

そしてクローンしたコードのtutorial下でlesson_01_basic.cppの冒頭のコメントを見ると以下のように書いてある。

```
// On os x:
// g++ lesson_01*.cpp -g -I <path/to/Halide.h> -L <path/to/libHalide.so> -lHalide -o lesson_01 -std=c++11
// DYLD_LIBRARY_PATH=<path/to/libHalide.dylib> ./lesson_01
```

`<path/to/Halide.h>`とかってどこやねん、と/usr/local/includeを`ls -l`してみると、`/usr/local/Cellar/halide/10.0.0_1/`にhalide関連のモノがあるっぽいので、以下のようにしてみた。

```
% g++ lesson_01*.cpp -g -I /usr/local/Cellar/halide/10.0.0_1/include -L /usr/local/Cellar/halide/10.0.0_1/lib -lHalide -o lesson_01 -std=c++11
```

ビルド出来た。

```
% DYLD_LIBRARY_PATH=/usr/local/Cellar/halide/10.0.0_1/lib ./lesson_01
```

実行出来た。次にデバッグログの出力。最大は3らしいので、以下のように環境変数を設定。

```
% export HL_DEBUG_CODEGEN=3
```

その後上記のコードを動かすといろいろログが出た。ちょこちょこ書き換えて、読んでる所との対応を眺めたりする。
ただ、期待したほど目的のあたりの情報は得られないなぁ。

ただその後の段階でなにが出力されるかは見れたので、ゴールまでの距離は分かってやる気は出た。


### InjectFunctionRealizationのbuild_pipeline_groupを読む

さて、気合を入れてbuild_pipeline_groupの解読に戻る。

前半はなかなか難解だが、コメントにトポロジカルオーダーを求めると書いてあってコードでもupdate等を見ながら依存関係を調べているようなので、
fuse絡みのfor文の順序の解決みたいな事をやっている、とふんわりと予想して後半の`Build the loops.`とコメントのある所から真面目に読む。

なかなかごついが、最初のfor文は、outputsから参照されている関数に関してのfor文っぽい。
中では`build_produce_definition`した後に`inject_stmt`している。
どうもproducerというのを作っているようだな。

`build_produce_definition`を読んでみよう。まずは呼び出し。

```
const Stmt &produceDef = build_produce_definition(f, def_prefix, def, func_stage.second > 0,
                                                    replacements, add_lets);
```

fは呼ばれている関数、`func_stage.second > 0`のsecondはfのステージっぽい？
defはfのdefinitionかupdate（のdefinitionか）のどちら、つまり現在呼び出し先の関数のdefinitionなのだろう。

呼ばれているfに対応するステージというモノがあるのか？updateの途中で他に代入するとか出来るって事なのだろうか。難しい。

次に`build_produce_definition`の定義に移る。

最初の方はfuseについての処理なので飛ばす。
すると本体は以下。

```
Stmt produce = build_provide_loop_nest(env, prefix, f, def, (int)(start_fuse), is_update);
```

という事で`build_provide_loop_nest`を読む。

先頭にValueとSiteについてのデバッグ出力があるな。これは見覚えがある。
簡単なサンプルで出力した時は以下が出力されていた。

例えば以下みたいなコードを実行すると、

```
    Halide::Func sFun, avgFun;
    Halide::Var x, y;

    sFun( x, y ) = sin( x*y );
    avgFun(x, y) = (sFun(x, y) +
                          sFun(x, y + 1) +
                          sFun(x + 1, y) +
                          sFun(x + 1, y + 1)) / 4;

    sFun.compute_root();
```

以下のような出力がされていた。

```
Value 0 = (((((float32)f0(f1.s0.v0, f1.s0.v1) + (float32)f0(f1.s0.v0, f1.s0.v1 + 1)) + (float32)f0(f1.s0.v0 + 1, f1.s0.v1)) + (float32)f0(f1.s0.v0 + 1, f1.s0.v1 + 1))/4.000000f)
Site 0 = f1.s0.v0
Site 1 = f1.s0.v1
... 中略 ...
Value 0 = (float32)sin_f32(float32((f0.s0.v0*f0.s0.v1)))
Site 0 = f0.s0.v0
Site 1 = f0.s0.v1
```

Valueの所は関数の式だな。Siteは依存している変数っぽいか？
出力しているコードは以下。

```
    for (size_t i = 0; i < def.args().size(); i++) {
        Expr s = def.args()[i];
        s = qualify(prefix, s);
        site[i] = s;
        debug(3) << "Site " << i << " = " << s << "\n";
    }
```

argsを順番に出力しているっぽいな。今定義している関数の引数、という所か。

その後は、間のspecializationとかの処理を無視すると以下みたいになっている。

```
// Make the (multi-dimensional multi-valued) store node.
Stmt body = Provide::make(func.name(), values, site);

Stmt stmt = build_loop_nest(body, prefix, start_fuse, func, def, is_update);
```

このbodyがループの本体になるっぽいが、それを作るProvideとはなんだろう？
ヘッダのコメントを見ると以下のように書いてある。

```
/** This defines the value of a function at a multi-dimensional
 * location. You should think of it as a store to a multi-dimensional
 * array. It gets lowered to a conventional Store node. The name must
 * correspond to an output buffer or the name of an enclosing Realize
 * node. */
```

よく分からないが、結果を入れる多次元配列と思えば良いのか？
makeの引数を見ると、関数名、values, siteとなっている。
引数と中身を持った何かなのだな。
デバッグ出力と見比べると、たぶんforの中の以下の部分か？

```
f1(f1.s0.v0, f1.s0.v1) = ((((float32)f0(f1.s0.v0, f1.s0.v1) + (float32)f0(f1.s0.v0, f1.s0.v1 + 1)) + (float32)f0(f1.s0.v0 + 1, f1.s0.v1)) + (float32)f0(f1.s0.v0 + 1, f1.s0.v1 + 1))/4.000000f
```

siteが左辺の引数、valuesが右辺。IRPrinterのProvideの所見てもそうっぽいな。
先に進もう。

次の`build_loop_nest`がループを作る本体っぽくて中身もごつい。
頑張って中身を見ていく。

### InjectFunctionRealization＞＞＞build_loop_nest

まず先頭のローカル変数の定義。

```
    const auto &dims = func.args();
    const auto &func_s = func.schedule();
    const auto &stage_s = def.schedule();
    const auto &predicates = def.split_predicate();
```

どうもfuncのscheduleとdefのscheduleは別物らしい。そうなの？
defの方がステージと呼んでいるものっぽいな。
func_sはなんだろう。

とりあえず進めていく。

bodyを最初のstmtとして先に進んでいく。

その後しばらくsplitの処理が続く。これはsplitが無いとなにもしないっぽいので読み飛ばして次へ。

その次はnestというvectorを作っていく。

```
    vector<Container> nest;
```

Containerはここだけで一時的に使う、コンテナっぽい要素をとりあえず持っておく為の構造体。
持つのはFor, If, Let, IfInnerのどれか。IfInnerが何なのかはよく分からんが。

nestはソートしたりしているが、コード読んだ感じだと、だいたい以下になるのかな。

```
nest = [stageのfor1, stageのfor2, ..., stageのforN, (fuse関連のIfとLetがあれば幾つか), fuseのIfInner1, fuseのIfInner2, ..., fuseのIfInnerM, predのIf1, predのIf2, ..., predのIfK];
```

IfInnerはminとmaxの２つを持つから本当は２つずつ入る。

IfInnerとIfを、参照関係でソートしているっぽいがよく分からない。

ただとにかく、こうやってnestを作って並べ替えた後に、このnestを使ってstmtを作っていく。それが以下。

```
for (int i = (int)nest.size() - 1; i >= 0; i--) {
    if (nest[i].type == Container::Let) {
        internal_assert(nest[i].value.defined());
        stmt = LetStmt::make(nest[i].name, nest[i].value, stmt);
    } else if ((nest[i].type == Container::If) || (nest[i].type == Container::IfInner)) {
        internal_assert(nest[i].value.defined());
        stmt = IfThenElse::make(nest[i].value, stmt, Stmt());
    } else {
        internal_assert(nest[i].type == Container::For);
        const Dim &dim = stage_s.dims()[nest[i].dim_idx];
        Expr min = Variable::make(Int(32), nest[i].name + ".loop_min");
        Expr extent = Variable::make(Int(32), nest[i].name + ".loop_extent");
        stmt = For::make(nest[i].name, min, extent, dim.for_type, dim.device_api, stmt);
    }
}
```

これでもともとのFunctionのvaluesとsiteを持ったbody(型はProvide)の回りに、stageをForに変換したモノでラップしていったstmtが出来る。
デバッグのダンプと比較すると以下の部分か。（Provideのvalueの所は略してある）

```
  for (f1.s0.__outermost, f1.s0.__outermost.loop_min, f1.s0.__outermost.loop_extent) {
   for (f1.s0.v1, f1.s0.v1.loop_min, f1.s0.v1.loop_extent) {
    for (f1.s0.v0, f1.s0.v0.loop_min, f1.s0.v0.loop_extent) {
     f1(f1.s0.v0, f1.s0.v1) = ((((float32)f0(f1.s0.v0, f1.s0.v1) + ...))/4.000000f
    }
   }
  }
```

そのあと、なにに使うのか分からないoutermostのダミーノードを作っている。

```
// Define the bounds on the outermost dummy dimension.
{
    string o = prefix + Var::outermost().name();
    stmt = LetStmt::make(o + ".loop_min", 0, stmt);
    stmt = LetStmt::make(o + ".loop_max", 0, stmt);
    stmt = LetStmt::make(o + ".loop_extent", 1, stmt);
}
```

ダンプと比較すると以下のforの手前の所だな。

```
  let f1.s0.__outermost.loop_extent = 1
  let f1.s0.__outermost.loop_max = 0
  let f1.s0.__outermost.loop_min = 0
  for (f1.s0.__outermost, f1.s0.__outermost.loop_min, f1.s0.__outermost.loop_extent) {
```

で、次はargsからループ変数みたいなの作っている。

```
// Define the loop mins and extents in terms of the mins and maxs produced by bounds inference
for (const std::string &i : dims) {
    string var = prefix + i;
    Expr max = Variable::make(Int(32), var + ".max");
    Expr min = Variable::make(Int(32), var + ".min");  // Inject instance name here? (compute instance names during lowering)
    stmt = LetStmt::make(var + ".loop_extent",
                            (max + 1) - min,
                            stmt);
    stmt = LetStmt::make(var + ".loop_min", min, stmt);
    stmt = LetStmt::make(var + ".loop_max", max, stmt);
}
```

dimsは`func.args()`だった。で、ダンプと比較すると以下を作っている。

```
  let f1.s0.v1.loop_max = f1.s0.v1.max
  let f1.s0.v1.loop_min = f1.s0.v1.min
  let f1.s0.v1.loop_extent = (f1.s0.v1.max + 1) - f1.s0.v1.min
  let f1.s0.v0.loop_max = f1.s0.v0.max
  let f1.s0.v0.loop_min = f1.s0.v0.min
  let f1.s0.v0.loop_extent = (f1.s0.v0.max + 1) - f1.s0.v0.min
```

この辺は中間コードと一対一に対応しているのでわかりやすいね。
ここで作っている変数が先程見たfor文の範囲として使われていた。

```
   for (f1.s0.v1, f1.s0.v1.loop_min, f1.s0.v1.loop_extent) {
    for (f1.s0.v0, f1.s0.v0.loop_min, f1.s0.v0.loop_extent) {
```

最後にRDom用のboundを吐いている。

```
// Define the loop mins and extents for the reduction domain (if there is any)
// in terms of the mins and maxs produced by bounds inference
for (const ReductionVariable &rv : stage_s.rvars()) {
    string p = prefix + rv.var;
    Expr rmin = Variable::make(Int(32), p + ".min");
    Expr rmax = Variable::make(Int(32), p + ".max");
    stmt = LetStmt::make(p + ".loop_min", rmin, stmt);
    stmt = LetStmt::make(p + ".loop_max", rmax, stmt);
    stmt = LetStmt::make(p + ".loop_extent", rmax - rmin + 1, stmt);
}
```

これで`build_loop_nest`が読み終わり。
この時点でのダンプの対応する所をまとめて載せておく。

```
  let f1.s0.v1.loop_max = f1.s0.v1.max
  let f1.s0.v1.loop_min = f1.s0.v1.min
  let f1.s0.v1.loop_extent = (f1.s0.v1.max + 1) - f1.s0.v1.min
  let f1.s0.v0.loop_max = f1.s0.v0.max
  let f1.s0.v0.loop_min = f1.s0.v0.min
  let f1.s0.v0.loop_extent = (f1.s0.v0.max + 1) - f1.s0.v0.min
  let f1.s0.__outermost.loop_extent = 1
  let f1.s0.__outermost.loop_max = 0
  let f1.s0.__outermost.loop_min = 0
  for (f1.s0.__outermost, f1.s0.__outermost.loop_min, f1.s0.__outermost.loop_extent) {
   for (f1.s0.v1, f1.s0.v1.loop_min, f1.s0.v1.loop_extent) {
    for (f1.s0.v0, f1.s0.v0.loop_min, f1.s0.v0.loop_extent) {
     f1(f1.s0.v0, f1.s0.v1) = ((((float32)f0(f1.s0.v0, f1.s0.v1) + (float32)f0(f1.s0.v0, f1.s0.v1 + 1)) + (float32)f0(f1.s0.v0 + 1, f1.s0.v1)) + (float32)f0(f1.s0.v0 + 1, f1.s0.v1 + 1))/4.000000f
    }
   }
  }
```

内側からこれらを組み立てていたのが分かる。

outermostはまだ残ったまま。

ここまでで、以下のような呼び出し階層になっている。

InjectFunctionRealization＞build_pipeline_group＞build_produce_definition＞build_provide_loop_nest＞build_loop_nest

build_produce_definitionまではだいたい今見たのが返っているので、build_pipeline_groupに戻ろう。

### build_pipeline_groupの続き

build_pipeline_groupのbuild_produce_definitionから先に戻ろう。

producerの中身のstmtを作った後は、boundsからのshiftを求めてそれを適用したり、substitute_fused_bounds、replace_parent_bound_with_union_boundといった変形をstmtに対して行っていく。
これらの詳細は知らないが、まぁいいだろう。

で、最後にstmtからproducerを作る。

```
// Add the producer nodes.
for (const auto &i : funcs) {
    producer = ProducerConsumer::make_produce(i.name(), producer);
}
```

このProducerConsumerが一番外の`producer`というダンプを行っているのはIRPrinterで確認出来た。
この後、consumerを作り、結果をreturnする。

```
// Add the consumer nodes.
for (size_t i = 0; i < funcs.size(); i++) {
    if (!is_output_list[i]) {
        consumer = ProducerConsumer::make_consume(funcs[i].name(), consumer);
    }
}

if (is_no_op(consumer)) {
    // For the very first output to be scheduled, the consumer
    // Stmt can be a no-op. No point in preserving it.
    return producer;
} else {
    return Block::make(producer, consumer);
}
```

make_consumeの引数に渡ってくるconsumerは最初のbuild_pipeline_groupの引数で、これはInjectFunctionRealizationのForのvisitのbody。

つまりbuild_pipeline_groupにconsumerとなるbodyを渡すと、それのproducerを構築してくっつけたブロックにして返す、という事か。

これでbuild_pipeline_groupも読み終わった。
この後はたいした事はせずにInjectFunctionRealizationのvisit、つまりmutateが終了する。

### schedule_functionsのその後

InjectFunctionRealizationのmutateをだいたい理解したので呼び出し元のschedule_functionsのその後の処理も眺めておこう。

まず、ここまで見てきたデバッグダンプは以下の場所で出力している模様。

```
if (group_should_be_inlined(funcs)) {
    debug(1) << "Inlining " << funcs[0].name() << "\n";
    s = inline_function(s, funcs[0]);
} else {
    debug(1) << "Injecting realization of " << funcs << "\n";
    InjectFunctionRealization injector(funcs, is_output_list, target, env);
    s = injector.mutate(s);
    internal_assert(injector.found_store_level() && injector.found_compute_level());
}

debug(2) << s << "\n";
```

その後は一番外側のダミーのfor文などを取り除いてreturnしている。

```
// We can remove the loop over root now
const For *root_loop = s.as<For>();
internal_assert(root_loop);
s = root_loop->body;

// We can also remove all the loops over __outermost now.
s = RemoveLoopsOverOutermost().mutate(s);

return s;
```

outermostとかのダミーのノードがなんで必要なのかはいまいち理解出来ていないが、ダンプの結果も確かに取り除かれているのは確認出来る。

これでだいたいschedule_functionsは理解出来た。
