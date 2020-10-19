---
title: Halideコード読み その4
layout: page
---

- [Halideコード読み その1](https://karino2.github.io/2020/10/14/halide_reading_1.html)
- [Halideコード読み その2](https://karino2.github.io/2020/10/14/halide_reading_2.html)
- [Halideコード読み その3](https://karino2.github.io/2020/10/15/halide_reading_3.html)


### lowerを追う、その2

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