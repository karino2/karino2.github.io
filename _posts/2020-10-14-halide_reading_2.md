---
title: Halideコード読み その2：Funcの組み立て
layout: page
---

[Halideコード読み その1： realizeからlowerまで](https://karino2.github.io/2020/10/14/halide_reading_1.html)の続き。

今度は組み立て側から追いたい。DefinitionContentsのpredicateが何者でどうやって出来るのか、と、valuesはどうやって出来ているのかあたりから始めたい。

DefinitionContentsは以下の流れでたどり着く。
スマートポインタとかを適当に読み飛ばすと以下みたいな感じ。

```
Func
  - pipeline_(Pipeline)
    - contents(PipelineContents)
      - outputs(Function)
        - contents(FunctionPtr ＞ FunctionContents)
          - init_def (Definition)
             - contents (DefinitionContents)
                - Expr predicate;
                - std::vector<Expr> values, args;
                - StageSchedule stage_schedule;
```

今日はこの最後の、predicate、values、argsがどうやって出来るかと、余裕があればstage_scheduleがどうやって出来るかも追いたい。

例えば以下のようなケースを考える。

```
Func hoge;
Var x;
Var y;

hoge( x, y ) = x+y;
```

イコールの右辺はExprらしいので、VarはExprのサブクラスだろうか？＞違った。右辺はVarとExprの両方のオーバーロードがあった。まじか。

`hoge( x, y )`はargsにxとyが入るのだろう。

Funcの演算子のオーバーロードの`()`は何を返すのかな？Funcかな？＞FuncRefだった。
この引数をargsとしてFuncRefのコンストラクタに渡している。
これがきっとDefinitionContentsのargsになるんだろうな。

FuncRefの`=`の演算子のオーバーロードはどうなってるのだろう？

```
    Stage operator=(const Expr &);
```

ステージが返るのか。へー。
この中の本体は以下。

```
   func.define(expanded_args_str, e.as_vector());
```

funcはFuncの中のFunctionが渡ってきたもの。
expanded_args_strは、気分的にはargsの各要素のnameを入れたもの。文字列を渡すのか。へー、ちょっと意外。
intのidじゃダメなのかしらね？この辺はなにか理解出来てない事がありそうだな。

さて、Functionのdefineを見る。まずは宣言のところ。

```
void Function::define(const vector<string> &args, vector<Expr> values) {
```

お、これがargsとvaluesの起源っぽいな。
つらつらと読んでいくと、ちょっと脱線するが以下みたいなのがあった。

```
    for (auto &value : values) {
        value = common_subexpression_elimination(value);
    }
```

common_subexpression_eliminationとかどうやってるんだろう？と実装を軽く見たがなかなか難しそう。
ただ同じExprがあったら、それの変数名を持った変数に差し替えるっぽい。へぇ。

defineに戻って続きを読んでいくと、以下に行き当たる。

```
    ReductionDomain rdom;
    contents->init_def = Definition(init_def_args, values, rdom, true);
```

contentsはFunctionPtr型で、init_defまでは冒頭に書いた流れと同じ。ようやく知りたかった事にたどり着いた気がするが、なんでここでrdomを作るのか？
むしろ普通にRDom作ったケースではどうやってそれが渡るのか？うーむ、謎だな。
普通に考えればargsかvaluesにRDom依存な変数が入っていたらそのRDomが渡されそうなもんだが、そういった処理は見当たらない。
まぁいい、先に進もう。

Definitionのコンストラクタを見てみよう。

```
Definition::Definition(const std::vector<Expr> &args, const std::vector<Expr> &values,
                       const ReductionDomain &rdom, bool is_init)
    : contents(new DefinitionContents) {
    contents->is_init = is_init;
    contents->values = values;
    contents->args = args;
    contents->source_location = Introspection::get_source_location();
    if (rdom.defined()) {
        contents->predicate = rdom.predicate();
        for (size_t i = 0; i < rdom.domain().size(); i++) {
            contents->stage_schedule.rvars().push_back(rdom.domain()[i]);
        }
    }
}
```

お、謎だったpredicateが登場するな。rdom関連なのか。

Funcionのdefineに戻る。Definitionを作った後はdim関連をなんかやってる。

```
    for (size_t i = 0; i < args.size(); i++) {
        Dim d = {args[i], ForType::Serial, DeviceAPI::None, DimType::PureVar};
        contents->init_def.schedule().dims().push_back(d);
        StorageDim sd = {args[i]};
        contents->func_schedule.storage_dims().push_back(sd);
    }
```

`init_def.schedule()`と`func_schedule`の違いはよく分からないが、片方がfor文のindexを、もう片方は配列のサイズを割り出す為の情報を詰めているのだろう。
名前からして、init_defのスケジュールはinit_defの時にしか効いてこないが、配列のサイズはupdateも含めた全unionを取る必要があるだろうからぶら下げる所が違うのは自然ではある。
この２つからどうやって配列のサイズとかを出すかはそのうち追いたいな。

その後はoutputsの型とoutput_buffersに関する設定をしている。

```
    for (size_t i = 0; i < contents->output_types.size(); i++) {
        contents->output_types[i] = values[i].type();
    }

    for (size_t i = 0; i < values.size(); i++) {
        string buffer_name = name();
        if (values.size() > 1) {
            buffer_name += '.' + std::to_string((int)i);
        }
        Parameter output(values[i].type(), true, args.size(), buffer_name);
        contents->output_buffers.push_back(output);
    }
```

valuesとoutputsは一対一に対応するのか。Tupleじゃなければoutputsは一つなのかね。
その場合はvaluesも一つなんだろうか。そう思っておこう。

まだ分からない所もあるが、大分全体の流れはつかめてきたかな。

分からない所、Pipelineが出てこない。RDom回り。ただそれよりは次は中間コード生成を見たい気もする。

[Halideコード読み その3：lowerとIRの組み立て](https://karino2.github.io/2020/10/15/halide_reading_3.html)へ続く。