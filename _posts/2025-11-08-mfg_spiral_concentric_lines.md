---
title: MFG： 渦巻き状の集中線
layout: page
---
中心からの距離に応じて渦を巻くような集中線を書きたい。

集中線については前回読み直した。＞[MFG： 集中線の解説](https://karino2.github.io/2025/11/06/mfg_line_concent.html)
渦巻きは素朴には距離に応じて位相を増やした回転で良さそう。

という事でこの二つを組み合わせてやってみる。

## fxyの座標だけ回転して他はコードをいじらないで試してみる

ちゃんと考える前に、fxyのところだけ中心からの距離に応じて回転させて、ほかのコードは一切いじらない、というのを試してみよう。

回転は中心からの距離でthetaを作って、中心からのベクトルを回転させた後にグローバルなベクトルに戻せばいいので、前回の集中線のコードを以下に変える。

```mfg
    let b_fxy = fxy0 - [0.33, 0.33] + 0.33*f32[xi, yi]
    let b_rxy = b_fxy - fo
    let d = length(b_rxy)
    let theta_g = d * 0.001
    let a_rxy = [dot([cos(theta_g), -sin(theta_g)], b_rxy), dot([sin(theta_g), cos(theta_g)], b_rxy)]
    let fxy = a_rxy+fo
```

theta_gのところのスケールは適当に調整したもの。結果は以下。

![images/RadialConcent/2025_1108_164100.png]({{"/assets/images/RadialConcent/2025_1108_164100.png" | absolute_url}})

何も考えずに6行直しただけにしては動いているな、と思う。

## アンチエイリアスの効きを見てみる

ちゃんと計算をしないと広がった分が綺麗にならない可能性があるのでは？とと思い、拡大してアンチエイリアスが効いているかをみる。

![images/RadialConcent/2025_1108_164217.png]({{"/assets/images/RadialConcent/2025_1108_164217.png" | absolute_url}})

うーん、効いてはいるがあんまり綺麗じゃない気もするな。
現状は回転を戻した所でスーパーサンプリングされているような気がする。

fxy0だけを回転してみるとどうだろう？

```mfg
    let b_fxy0 = f32[x_0, y_0]
    let b_rxy0 = b_fxy0 - fo
    let d = length(b_rxy0)
    let theta_g = d * 0.001
    let a_rxy0 = [dot([cos(theta_g), -sin(theta_g)], b_rxy0), dot([sin(theta_g), cos(theta_g)], b_rxy0)]
    let fxy0 = a_rxy0+fo
```

結果は以下

![images/RadialConcent/2025_1108_164818.png]({{"/assets/images/RadialConcent/2025_1108_164818.png" | absolute_url}})

多少綺麗にはなったが、微妙に先が切れているなぁ。

そもそも前回の集中線の先っぽはどうなっているんだろう？と試したら以下。

![images/RadialConcent/2025_1108_165102.png]({{"/assets/images/RadialConcent/2025_1108_165102.png" | absolute_url}})

この時点で汚いな。今回のと比較してもクオリティは大差無いので、ここからは渦巻き集中線というよりは集中線のアンチエイリアスの問題、という事かな。

ちなみにFireAlpacaの集中線は以下。

![images/RadialConcent/2025_1108_165200.png]({{"/assets/images/RadialConcent/2025_1108_165200.png" | absolute_url}})

流石に全然綺麗だな。

## まとめ

- 座標の回転だけで渦巻き集中線は描けた
- クオリティに関してはそもそもの集中線のコードと同程度にはなったので、これ以上の改善は集中線の改善になりそう

という事で集中線のアンチエイリアスの改善はページを分けて行おう。