---
title: MFG： prims.jsのシンタックスハイライトを実装しました
layout: page
---
このブログやリファレンスなどで使うためにprism.jsのシンタックスハイライトが欲しかったので、
実装してみました。

以下においてあります。

[MFG/tools/prism-mfg at main · karino2/MFG](https://github.com/karino2/MFG/tree/main/tools/prism-mfg)

適用結果は以下のような感じになっています。

[MFGで基本図形を描いてみよう（後編）](https://karino2.github.io/2025/08/01/draw_shape_on_MFG_part2.html)

まだまだ基本的な所だけですし、samplerとか名前付き引数とか対応していない要素もたくさんあるのですが、
思ったよりもいい感じに表示されていると思うのですがどうでしょう？

## Github Pagesのjekyllにprismjsのシンタクスハイライトを適用する手順

Github Pagesのデフォルトのjekyllはプラグインなどが使えないので、クライアントサイドで適用するようにします。

コミットとしては、[prismjsとそのmfg拡張をシンタックスハイライトに · karino2/karino2.github.io@0682571](https://github.com/karino2/karino2.github.io/commit/06825714a969d663b563bca993a08d9d832a0f61)のコミットと、
そのさきのいくつかの修正（モジュール化対応など）で行っています。

### 1. 一応config.ymlでnoneを指定

まず、効いているかどうかわからないけれど、`_config.yml`でhighligherをnoneにします。

```
highlighter: none
```

こう書いてもなんかRogueが動いてしまっているように見えるけれど、こう書け、という記述をちょくちょく見かけるので一応書いておく。

### 2. head.htmlにprism.cssを追加

以下のような記述を追加しました。

```html
	<link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.30.0/themes/prism.css" rel="stylesheet" />
```

### 3. assets下にprism-mfg.jsを置く

上記のgithubからファイルをコピーして置いています。

### 4. page.htmlに以下を追加

ブログはpage.htmlのレイアウトを使っているのでそこに以下を書きました。

```html
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.30.0/components/prism-core.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.30.0/plugins/autoloader/prism-autoloader.min.js"></script>
  <script type="module">
    import prismMfg from '{{ "/assets/prism-mfg.js" | relative_url }}'
    Prism.languages.mfg = prismMfg.grammar
  </script>
```

importしたオブジェクトのフィールドは公式の言語ごとのjsを参考にしているのだけれど、
これは組み込まないとあまり意味はないかもしれない。

### 5. コードブロックにmfgをつける

以下のようなコードブロックを書くと、

```
\```mfg
@title "特に意味のないフィルタ"

def result_u8 |x, y| {
  let [b, g, r, a] = input_u8(x, y)
  ifel(a == 0, u8[0, 0, 255, 255], u8[0, 255, 0, 255])
}
\```
```

以下のようになります。

```mfg
@title "特に意味のないフィルタ"

def result_u8 |x, y| {
  let [b, g, r, a] = input_u8(x, y)
  ifel(a == 0, u8[0, 0, 255, 255], u8[0, 255, 0, 255])
}
```

## 雑感など

当初はとりあえず動かしてからもうちょっといろいろちゃんと文法項目を増やして、それからアナウンスしようと思っていたのだけれど、
思ったよりも基本的なのだけでもいい感じだったので、現時点でアナウンスする事にしました。

これまではswiftとかrustとかを使っていたのだけれど、コメントとか縦棒のテンソルの仮引数定義とか、微妙にどちらかを選ぶとどちらかが立たず、
みたいな要素があったので、このくらいの対応でもずっと良いなぁ、と思っています。

今後ももうちょっと改善はしていくつもりですが、prismjs自体ほかの言語でも結構コスパ重視というか、
だいたい正しく動けば良い、という記述が多いので、
mfgの文法定義も同じ思想に則って、細かいのをいろいろ対応しすぎずに、
費用対効果の良い部分だけを対応していこうと思っています。

本家へのマージなどはもう少し落ち着いて使われる度合いを見てから判断でいいかな、と思っています。

prismjsは、Androidなどに組み込む時にファイルが小さいのが便利でよく使っていて、
結果にも満足しているので、今回はprismjsで実装する事にしました。
むしろ言語定義を今回いろいろ見たら、こんな手抜きでもあんないい感じになってるのか〜と逆に驚いた。

JSにしておけばサーバーサイドでサイトジェネレータで処理する時はサーバーサイドにしたりも出来そうだし、
シンタックスハイライトはJSが強いですね。