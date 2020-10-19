---
title: Halideコード読み その5：lowerとschedule_functions
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

### InjectFunctionRealization周辺を読む

まずはinline化出来ない方を読もう。こっちが本体だろうから。

続く。




