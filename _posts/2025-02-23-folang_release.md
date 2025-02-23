---
title: F#ライクな関数型言語のGoへのトランスパイラ、Folangを開発した
layout: page
---
ここ一ヶ月くらいF# みたいな言語をGo言語にトランスパイルするトランスパイラを作っていて、
セルフホストも出来て小物ツールを書けるくらいまでは出来たので公開する事にした。
F# 互換にはせずにGo向けにいろいろ変えたので、別言語としてFolangとして呼ぶようにした。

- [github: karino2/folang](https://github.com/karino2/Folang/)
   - [日本語版README_ja.md]([folang/README_ja.md at main · karino2/folang](https://github.com/karino2/folang/blob/main/README_ja.md))
- [Folang: Transpiler for F#-like functional languages ​​to Go : r/golang](https://www.reddit.com/r/golang/comments/1iw3tz7/folang_transpiler_for_flike_functional_languages/) redditのポスト

トランスパイラなので生成結果は.goファイルになります。go instlalでインストールしていけるのが良い。

## 簡単な例

READMEから抜粋。

```
package main
import frt

import slice
import strings

let main () =
  [1; 2; 3]
  |> slice.Map (frt.Sprintf1 "This is %d")
  |> strings.Concat ", "
  |> frt.Println

```

=>

```golang
package main

import "github.com/karino2/folang/pkg/frt"
import "github.com/karino2/folang/pkg/slice"
import "github.com/karino2/folang/pkg/strings"

func main() {
	frt.PipeUnit(
    frt.Pipe(
      frt.Pipe(
        ([]int{1, 2, 3}),
        (func(_r0 []int) []string {
		      return slice.Map((func(_r0 int) string { return frt.Sprintf1("This is %d", _r0) }), _r0)
	  })),
    (func(_r0 []string) string {
       return strings.Concat(", ", _r0)
    })), frt.Println)
}
```

```
package main

import frt

let ApplyL fn tup =
  let nl = frt.Fst tup |> fn
  (nl, frt.Snd tup)


let add (a:int) b = 
  a+b

let main () =
  (123, "hoge")
  |> ApplyL (add 456)
  |> frt.Printf1 "%v\n" 
```

=>

```golang
package main

import "github.com/karino2/folang/pkg/frt"

func ApplyL[T0 any, T1 any, T2 any](fn func(T0) T1, tup frt.Tuple2[T0, T2]) frt.Tuple2[T1, T2] {
	nl := frt.Pipe(frt.Fst(tup), fn)
	return frt.NewTuple2(nl, frt.Snd(tup))
}

func add(a int, b int) int {
	return (a + b)
}

func main() {
	frt.PipeUnit(
    frt.Pipe(
      frt.NewTuple2(123, "hoge"),
      (func(_r0 frt.Tuple2[int, string]) frt.Tuple2[int, string] {
    		return ApplyL((func(_r0 int) int { return add(456, _r0) }), _r0)
	 })),
   (func(_r0 frt.Tuple2[int, string]) { frt.Printf1("%v\n", _r0) }))
}
```


## 開発背景

もともとF# でシングルバイナリでいろいろ雑用のコマンドを作っていたのだけれど、
この前homebrewのアップデートだかupgradeだかをしたらdotnetのランタイムが上がって全部のコマンドが使えなくなり、
やっぱりGolangで書かれている方がいいよなぁ、と思ったのがそもそものきっかけ。

ただGoはちょっと自分の用途では低水準過ぎて、
もうちょっと遅くていいから簡単に書けて、
けどバイナリは小さくていろいろなマシンに生成物を持っていくのが楽な言語が欲しいなぁ、
とも思っていた。この辺の話は[RandomThoughts: コマンドラインツールを書くための言語](https://karino2.github.io/RandomThoughts/%E3%82%B3%E3%83%9E%E3%83%B3%E3%83%89%E3%83%A9%E3%82%A4%E3%83%B3%E3%83%84%E3%83%BC%E3%83%AB%E3%82%92%E6%9B%B8%E3%81%8F%E3%81%9F%E3%82%81%E3%81%AE%E8%A8%80%E8%AA%9E)に書いた。

いろいろと評価したが、やはりGolangのランタイムがいいな、と思い、
Golangへのトランスパイラがあればいいんじゃないかな〜、と思うようになった。

ちょっと実験的な最初のバージョンを作って見た所、意外と動いたので、
セルフホストを目指して開発をする事にした。

一ヶ月くらいで無事セルフホスト出来るくらいまでは完成して、
これが3000〜4000行のプログラムとなったので、
これより小さな雑用ツールなら十分実用出来るだろう、
と思い公開する事に。

## 大きなToDo

まだまだ実装してない機能はたくさんあって、リストアップをしてもすぐに古くなってメンテ出来るとも思えないので大きなものだけ。

- 関数リテラル
- レコードのジェネリクス対応
- type parameterのconstraintsのinference

ここまで出来たらResult型やOptional型が欲しいなぁ、
と思うようになったので、このくらいまではやりたいな、と思う。

なお、inner関数はあったら欲しいのだけれど、アルゴリズムWの論文見たらわかりませんでした(´・ω・｀)