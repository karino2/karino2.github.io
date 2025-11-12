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


## 追記: アンチエイリアスの改善を行いました

先っぽの品質が気になったので、より真面目なアンチエイリアスの実装を以下で行いました。

[MFG： 集中線のアンチエイリアス改善](https://karino2.github.io/2025/11/12/mfg_concent_aa.html)

これを反映させると、最終的なコードは以下のようになりました。

```mfg
@title "渦巻き集中線"

# Specify width by ratio of I.
@param_f32 PHASE_R(SLIDER, label="巻き具合",  init=0.5, min=-1.0, max=1.0)
@param_f32 LENGTH_R(SLIDER, label="長さ",  init=0.85, min=0.1, max=1.0)
@param_f32 TR(SLIDER, label="幅",  init=0.6, min=0.1, max=1.0)
@param_f32 WRR(SLIDER, label="幅ランダム",  init=0.2, min=0.0, max=1.0)
@param_f32 DR(SLIDER, label="密度", init=0.3, min=0.01, max=1.0)
@param_f32 LR(SLIDER, label="長さランダム",  init=0.3, min=0.0, max=1.0)
@param_pos ORIGIN(POINTER, label="中心")

let PI = 3.141592
let N_MAX = 400
# Number of lines. Interval is 2PI/N
let N = f32(N_MAX)*DR
let I = 2.0*PI/N


# Shorter edge of canvas (width or height).
let SIDE = min(*input_u8.extentf())

# Start line from about half of shorter edge.
let OFFSET = SIDE*(1.0-LENGTH_R)

# N random number, but N is not known  in advance, so create N_MAX.
@bounds(N_MAX, 2)
def RAND_TABLE |x, y| { rand() }

# return positive region theta. arg order is x, y for spread usage
fn atan2xy |x: f32, y: f32| {
  let theta = atan2(y, x)
  ifel(theta > 0.0, theta, 2.0*PI+theta)
}

# Adding offset if rad is near 0.0.
# offset is either 0.0 or 2.0*PI.
# This make "2*PI-eps" to "eps" to be "2*PI-eps" to "2*PI + eps", which is continous.
# offset is first for better pipelining.
fn continuise |  offset: f32, rad: f32 | {
  ifel(rad > PI, rad, rad+offset)
}

def result_u8 |x_0, y_0| {
  # ORIGIN to pixel pos.
  let fo = ORIGIN*f32(input_u8.extent())

  let b_fxy0 = f32[x_0, y_0]
    let b_rxy0 = b_fxy0 - fo
    let d = length(b_rxy0)
    let theta_g = d * 0.00005*(5.0*PHASE_R)^3.0
    let a_rxy0 = [dot([cos(theta_g), -sin(theta_g)], b_rxy0), dot([sin(theta_g), cos(theta_g)], b_rxy0)]
    let fxy0 = a_rxy0+fo

  let tt_center_0 = atan2xy( *(fxy0-fo) )
  let A0 = round(tt_center_0/I)
  let ATheta0 = A0*I

  let offset = ifel(ATheta0-I/2.0 < 0.0 || ATheta0+I/2.0 > 2.0*PI, 2*PI, 0.0)
  let tt_center = continuise(offset, tt_center_0)

  # Index of I.
  let A = round(tt_center/I)
  # Basic angle of this pos.
  let ATheta = A*I
  let AI = i32(A)

  # Width of line, stands for the angle of triangle. Randomness is added for each A.
  let T = TR*(1.0-WRR*RAND_TABLE(AI, 0))*I

  # Length of origin. Away from OFFSET+random.
  let RO = OFFSET*(1.0+2.0*LR*RAND_TABLE(AI, 1))

  # to: Origin of triangle
  let to =  fo + RO* [cos(ATheta), sin(ATheta)]

  let AT_min = ATheta-T/2.0 |> continuise(offset, ...)
  let AT_max = ATheta+T/2.0 |> continuise(offset, ...)

  let [tt_min, tt_max] = reduce(init=[-1.0, -1.0], 0..<2, 0..<2) |i, j, accm| {
    # (x-0.5, y-0.5), (x+0.5, y-0.5), (x-0.5, y+0.5), (x+0.5, y+0.5)
    let fxy = fxy0 -[0.5, 0.5] + f32[i, j]   
    let theta = atan2xy(*(fxy-to)) |> continuise(offset, ...)


    ifel( accm < -0.5, vec2(theta), [min(accm.x, theta), max(accm.y, theta)])
  }

  let tt_w = tt_max - tt_min

  let r_over = clamp(AT_min-tt_min, 0.0, tt_w)
  let l_over = clamp(tt_max - AT_max, 0.0, tt_w)

  let overwrap = tt_w - r_over - l_over
  let avg_occupy = overwrap / tt_w  

  u8[0x0, 0x0, 0x0, round(255.0*avg_occupy)]
}
```