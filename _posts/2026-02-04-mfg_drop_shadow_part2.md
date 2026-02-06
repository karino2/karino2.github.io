---
title: MFG：ドロップシャドウフィルターを作る（その2）
layout: page
---
前回: [MFG：ドロップシャドウフィルターを作る（その1） ](https://karino2.github.io/2025/12/10/mfg_drop_shadow_part1.html)

## エッジをぼかす

前回まででとりあえずハードエッジのドロップシャドウは動きました。
ですがドロップシャドウというからにはエッジはもう少しソフトにしたいので、次はそれをやります。

前回単純に実装しても思ったよりもちゃんと動いたので、エッジをぼかすのもまずは単純に実装してみます。

### 単純な1パスのガウスぼかしで実装

blur_widthの範囲をガウスぼかしで足し合わせてみます。

アルファ値のみなのでガンマ補正も考えずに単純に足してしまって良いでしょう。

ガウスぼかしに関しては、MFGのドキュメントのケーススタディで色々やっています。＞[ガウスぼかし - MFGドキュメント](https://karino2.github.io/MFG/ja/study/GaussBlur.html)

最終的には2パスにした方が良さそうですが、まずは1パス版で動作がどうかを見てみましょう。

まずは、ガウスぼかしのコードから使えそうな所を持ってきます。

```mfg

@param_i32 ar(SLIDER, label="ぼかし幅", min=1, max=30, init=7)

let sigma = f32(ar)
let WR = 3*ar
let mWR = -(WR-1)

@bounds(WR, WR)
def weight |x, y| {
  exp(- f32(x^2+y^2)/(2.0*sigma^2) )
}

let coeff = rsum(mWR..<WR, mWR..<WR) |rx, ry| { weight(abs(rx), abs(ry)) }
```

そして、これまで影があるか無いかのゼロかイチのどちらかとして処理していましたが、
どうせ平均をとるなら小数になるので、上のアルファ値も0.0〜1.0の範囲で処理をしましょう。

アルファをto_ncolorにして、結果はそこまでの最大値とのmaxにすればいいでしょうか。
以下のようなコードになりますか。

```mfg
let ocu = reduce(init=0.0, 0..<range) | index, accm | {
    let vi = v + i32(dir*index)
    let cur = upper(*vi) |> to_ncolor(...).w

    max(cur, accm)
}
```

あとはこれにweightを掛けて和をとって、coeffで割れば良いでしょう。

```mfg
let shadowSum = rsum(mWR..<WR, mWR..<WR) |rx, ry| {
  let v = [x, y] + [rx, ry]
  let ocu = reduce(init=0.0, 0..<range) | index, accm | {
    let vi = v + i32(dir*index)
    let cur = upper(*vi) |> to_ncolor(...).w

    max(cur, accm)
  }
  ocu*weight(*abs([rx, ry]))
}
u8[0, 0, 0, clamp(0.0, 255.0, 255.0*shadowSum/coeff)]
```

全体としては以下のような感じになりました。

```mfg

@title "ドロップシャドウ（ガウスぼかし）"

@param_i32 range(SLIDER, label="影のサイズ", min=5, max=50, init=15)
@param_i32 ar(SLIDER, label="ぼかし幅", min=1, max=30, init=7)
@param_f32 angle(DIRECTION, init=-0.5)

let sigma = f32(ar)
let WR = 3*ar
let mWR = -(WR-1)

@bounds(WR, WR)
def weight |x, y| {
  exp(- f32(x^2+y^2)/(2.0*sigma^2) )
}

let coeff = rsum(mWR..<WR, mWR..<WR) |rx, ry| { weight(abs(rx), abs(ry)) }

let upper = sampler<input_u8[1]>(address=.ClampToEdge)

def result_u8 |x, y| {
  let dir = [cos(angle), sin(angle)]*1.415

  let shadowSum = rsum(mWR..<WR, mWR..<WR) |rx, ry| {
    let v = [x, y] + [rx, ry]
    let ocu = reduce(init=0.0, 0..<range) | index, accm | {
      let vi = v + i32(dir*index)
      let cur = upper(*vi) |> to_ncolor(...).w

      max(cur, accm)
    }
    ocu*weight(*abs([rx, ry]))
  }
  u8[0, 0, 0, clamp(0.0, 255.0, 255.0*shadowSum/coeff)]
}
```

このようにしたい所、以下のようになりました。

![images/DropShadow/2026_0204_161526.png]({{"/assets/images/DropShadow/2026_0204_161526.png" | absolute_url}})

結果は綺麗にソフトにできていて、挙動自体は良さそうです。

### パフォーマンス評価： 少し遅いか

1024x1024のキャンバスに影のサイズ25, ぼかし幅7で以下

```
InputSetup: 1 [ms]
Kernel: 1132 [ms]
ResultCopy: 5 [ms]
Total: 1138 [ms]
```

ぼかし幅が小さければ思ったよりも遅くはないけれど、少し待つのは体感でも分かる。
この計測している影のサイズとぼかし幅は普通に使う時にはまぁこのくらい、という範囲。

これでも実用にはなるけれど、ガウスぼかしはもう少し早くした方がいいかもしれない。

### ガウスぼかしを2パスに

ガウスぼかしは縦で足してそれを横に足す方がずっと計算が少なくなるのは[ガウスぼかし - MFGドキュメント](https://karino2.github.io/MFG/ja/study/GaussBlur.html)にある通りなので、同じ最適化をしてみます。

weightを1次元にして、そのほか前計算を上記ドキュメントから持ってきて以下。

```mfg
@bounds(WR)
def weight |x| {
  exp(- f32(x^2)/(2.0*sigma^2) )
}

let coeff = rsum(mWR..<WR) |rx| { weight(abs(rx)) }
let dir = [cos(angle), sin(angle)]*1.415
let [W, H] = input_u8.extent()
```

そしてx方向の加重和をshadow_x0という中間テンソルにする（0は後でsampler指定した方をxにしたいので）。
x方向の和は、元々rxとryに対して和をとっていたrsumをx方向に変えるだけで良さそうかしら。以下のようにしてみる。

```mfg
@bounds(W, H)
def shadow_x0 |x, y| {
  rsum(mWR..<WR) |rx| {
    let v = [x, y] + [rx, 0]
    let ocu = reduce(init=0.0, 0..<range) | index, accm | {
      let vi = v + i32(dir*index)
      let cur = upper(*vi) |> to_ncolor(...).w

      max(cur, accm)
    }
    ocu*weight(abs(rx))
  }
}
```

そしてこの結果をy方向に足す。

```mfg
let shadow_x = sampler<shadow_x0>(address=.ClampToEdge)

def result_u8 |x, y| {
   let shadowSum = rsum(mWR..<WR) |ry| {
      shadow_x( x, y+ry)  * weight(abs(ry))
   }
  u8[0, 0, 0, clamp(0.0, 255.0, 255.0*shadowSum/(coeff^2))]
}
```

結果は以下。

```
InputSetup: 2 [ms]
Kernel: 123 [ms]
ResultCopy: 3 [ms]
Total: 128 [ms]
```

9倍くらい早くなりました。触ってる感じでもこれで十分に思えます。

全体のコードは以下。

```mfg
@title "ドロップシャドウ（ガウスぼかし2パス）"

@param_i32 range(SLIDER, label="影のサイズ", min=5, max=50, init=15)
@param_i32 ar(SLIDER, label="ぼかし幅", min=1, max=30, init=7)
@param_f32 angle(DIRECTION, init=-0.5)

let sigma = f32(ar)
let WR = 3*ar
let mWR = -(WR-1)

@bounds(WR)
def weight |x| {
  exp(- f32(x^2)/(2.0*sigma^2) )
}

let coeff = rsum(mWR..<WR) |rx| { weight(abs(rx)) }

let upper = sampler<input_u8[1]>(address=.ClampToEdge)
let dir = [cos(angle), sin(angle)]*1.415
let [W, H] = input_u8.extent()

@bounds(W, H)
def shadow_x0 |x, y| {
  rsum(mWR..<WR) |rx| {
    let v = [x, y] + [rx, 0]
    let ocu = reduce(init=0.0, 0..<range) | index, accm | {
      let vi = v + i32(dir*index)
      let cur = upper(*vi) |> to_ncolor(...).w

      max(cur, accm)
    }
    ocu*weight(abs(rx))
  }
}

let shadow_x = sampler<shadow_x0>(address=.ClampToEdge)

def result_u8 |x, y| {
   let shadowSum = rsum(mWR..<WR) |ry| {
      shadow_x( x, y+ry)  * weight(abs(ry))
   }
  u8[0, 0, 0, clamp(0.0, 255.0, 255.0*shadowSum/(coeff^2))]
}
```

## ターゲットのレイヤーを切り替えられるようにする

ハードエッジ版を同僚に試してもらった所、上のレイヤーの影を作る、というフィルターはこれまで存在しなかったので最初戸惑った、という指摘をもらいました。

最初に試してみたら何をしているか分からないフィルタ、というのは、第一印象が良くありませんし、
最初に試して良く分からないと削除されて２度と使ってもらえないかもしれません。

やはり最初は同じレイヤーに影をつける方が分かりやすいと思います。

一方で影が別のレイヤーに出来る方が、機能的には優れています（レイヤーをマージすれば同じレイヤーに出来るのと同じ挙動になるが逆は無理）。
現時点ではMFGはテキストレイヤーの対応はしていませんが、将来的にテキストレイヤーの対応も出来たら、影は別のレイヤーに描画する必要もあります。

という訳で、影の元となるレイヤーを現在のレイヤーか一つ上のレイヤーかを選べるようにし、デフォルトでは現在のレイヤーに対して動くようにしましょう。

### 入力の切り替え

こういう二択では、チェックボックスを使うのがいいでしょう。

[アトリビュートと入力ウィジェット#チェックボックス](https://karino2.github.io/MFG/ja/Reference/AttrWidget.html#checkbox)

```mfg
@param_i32 is_target_upper(CHECKBOX, label="上のレイヤーの影にする", init=0)
```

デフォルトは現在のレイヤーになるようにしておく事で、初めて触る人にわかりやすいようにします。

これを用いて、入力テンソルをtargetという関数でラップする事にします。

```mfg
let upper = sampler<input_u8[1]>(address=.ClampToEdge)
let current = sampler<input_u8>(address=.ClampToEdge)

fn target |x: i32, y:i32| {
    ifel(is_target_upper, upper(x, y), current(x, y))
}
```

これでupperを触っていたところをtargetにすれば良さそうです。

### 結果の出力を元の色とブレンド

同じレイヤーにする場合、元々の色は影より優先されて欲しい所です。
アルファ値がある時の振る舞いをどうするべきかは自明ではありませんが、単純にアルファブレンドする事にしましょう。

双方にアルファ値がある時のブレンドはあまり本などには載ってませんが、以前書きました＞[MFG#半透明同士のアルファブレンド - RandomThoughts](https://karino2.github.io/RandomThoughts/MFG.html#%E5%8D%8A%E9%80%8F%E6%98%8E%E5%90%8C%E5%A3%AB%E3%81%AE%E3%82%A2%E3%83%AB%E3%83%95%E3%82%A1%E3%83%95%E3%82%99%E3%83%AC%E3%83%B3%E3%83%88%E3%82%99)

```mfg
fn blend | dest: f32v4, cur: f32v4 | {
  let resA = mix(dest.w, 1.0, cur.w)
  let resBGR = mix(dest.w*dest.xyz, cur.xyz, cur.w)/resA
  ifel(cur.w < 0.0001,
        dest,
        [*resBGR, resA])
}
```

destが背景、curが上書きする色ですが、この場合は影を背景にする方がいいでしょうか。（destとcurの入れ替えには対称かしら？）

アルファブレンドするなら一応ガンマ補正した方がいいような気がするのでlrgbで計算しましょう。
なお、上のレイヤーの影にする場合は現在のレイヤーの色は無視して上書きする方が良さそうなので、そのように処理します。

パイプライン演算子も使って以下のようになりますか。

```mfg
def result_u8 |x, y| {
   let shadowSum = rsum(mWR..<WR) |ry| {
      shadow_x( x, y+ry)  * weight(abs(ry))
   }
   let shadow = [0.0, 0.0, 0.0, shadowSum/(coeff^2)]
   let org = input_u8(x, y) |> to_lbgra(...)
   ifel(is_target_upper, shadow, blend(shadow, org))
     |> lbgra_to_u8color(...)
}
```

良さそうです。

## 色を前景色に

影の色は変えられる方が良いのではないか、というフィードバックをもらいました。
色はピッカーで選べるようにするか、「選ばれている現在の色」を使うかのどちらかです。

今回は選ばれている現在の色、つまりFireAlpacaの現在のブラシの色にしましょう。これはfore_colorで取れます。
これはガンマ補正されてないのでgamma2linearでガンマ補正して使います。

```mfg
   let shadowBGR = fore_color().xyz |> gamma2linear(...)
   let shadow = [*shadowBGR, shadowSum/(coeff^2)]
```

最後に全体のコードを載せておきます。

```mfg
@title "ドロップシャドウ"

@param_i32 range(SLIDER, label="影のサイズ", min=5, max=50, init=15)
@param_i32 ar(SLIDER, label="ぼかし幅", min=1, max=30, init=7)
@param_i32 is_target_upper(CHECKBOX, label="上のレイヤーの影にする", init=0)
@param_f32 angle(DIRECTION, init=-0.5)

let sigma = f32(ar)
let WR = 3*ar
let mWR = -(WR-1)

@bounds(WR)
def weight |x| {
  exp(- f32(x^2)/(2.0*sigma^2) )
}

let coeff = rsum(mWR..<WR) |rx| { weight(abs(rx)) }

let dir = [cos(angle), sin(angle)]*1.415
let [W, H] = input_u8.extent()

let upper = sampler<input_u8[1]>(address=.ClampToEdge)
let current = sampler<input_u8>(address=.ClampToEdge)

fn target |x: i32, y:i32| {
    ifel(is_target_upper, upper(x, y), current(x, y))
}


@bounds(W, H)
def shadow_x0 |x, y| {
  rsum(mWR..<WR) |rx| {
    let v = [x, y] + [rx, 0]
    let ocu = reduce(init=0.0, 0..<range) | index, accm | {
      let vi = v + i32(dir*index)
      let cur = target(*vi) |> to_ncolor(...).w

      max(cur, accm)
    }
    ocu*weight(abs(rx))
  }
}

let shadow_x = sampler<shadow_x0>(address=.ClampToEdge)

fn blend | dest: f32v4, cur: f32v4 | {
  let resA = mix(dest.w, 1.0, cur.w)
  let resBGR = mix(dest.w*dest.xyz, cur.xyz, cur.w)/resA
  ifel(cur.w < 0.0001,
        dest,
        [*resBGR, resA])
}

def result_u8 |x, y| {
   let shadowSum = rsum(mWR..<WR) |ry| {
      shadow_x( x, y+ry)  * weight(abs(ry))
   }
   let shadowBGR = fore_color().xyz |> gamma2linear(...)
   let shadow = [*shadowBGR, shadowSum/(coeff^2)]
   let org = input_u8(x, y) |> to_lbgra(...)
   ifel(is_target_upper, shadow, blend(shadow, org))
     |> lbgra_to_u8color(...)
}
```

## 雑感

ぼかしが意外と綺麗で使ってみると割と満足度の高いフィルタになりました。

FireAlpacaのテキスト装飾は、現時点ではあまり高機能ではないので、
MFGで色々強化するのも面白いかもしれません。

このようなシンプルなフィルタでも、ガウスぼかしの高速化などは意外と違いが出てくるなぁ、という印象で、
実用的なものを作ろうとすると、中間テンソルが使えるというMFGのメリットは意外と大きい、と思いました。