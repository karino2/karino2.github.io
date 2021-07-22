---
title: github pagesでブロックのスタイルを指定したい
layout: page
---
message passingで、記事の最後にコメントとして、ブロックを追加出来るようになっているのだが、これが便利だなぁ、と思う。
あれはhugoを使っているらしいが、github pagesで似た事出来ないかな？

c-lessonではパラグラフの最後に`{: .column}`とかつけていたのだが、
これだとブロックの中に空行が使えない。全角空白とか入れてたのだけどさすがにかったるい。
（例： [forth_modoki.mdの「パーサーとトークナイザ」のあたり](https://raw.githubusercontent.com/karino2/c-lesson/master/forth_modoki.md)）

もっと囲んだブロックにそのままスタイルをつけたい。

### 目指す形

includeでcaptureを使う事で以下みたいに出来そう、と[jekyllのincludeのドキュメント](https://jekyllrb.com/docs/includes/)を見てて思いつく。

```
{% raw %}{% capture comment1 %}{% endraw %}
**タイトル**
これは何か囲み記事

空行も使える
{% raw %}{% endcapture %}
{% include myquote.html body=comment1 %}{% endraw %}
```

最後にincludeを手で足すのはださいが、この位なら許容範囲か。
とりあえずこれを実現してみよう。

### 実装

まず`_includes`というフォルダを掘って、以下のようなファイルを置く。

```
% cat _includes/myquote.html
<div class="myquote">
{% raw %}{{ include.body | markdownify }}{% endraw %}
</div>
```

次にmyquoteのクラスを作る。
これは`_layouts/page.html`に置く。


```
% cat _layouts/page.html
---
layout: default
---
<article class="post" itemscope itemtype="http://schema.org/BlogPosting">
  <style>
    .myquote{
         padding: 0em 1em;
         margin: 2em 0;
         color: #5d627b;
         background: white;
         border-top: solid 5px #5d627b;
         box-shadow: 0 3px 5px rgba(0, 0, 0, 0.22);
     }
  </style>  
...
```

これでOK。

### 動作テスト

以下が動くだろうか？

{% capture comment1 %}
**タイトル**  
これは何か囲み記事

空行も使える
{% endcapture %}
{% include myquote.html body=comment1 %}

動いている模様。


### 余談: 調べた事や試行錯誤

github pagesを調べていると、すぐ「詳しくはjekyllのドキュメントを読む事」と飛ばすくせに、
jekyllではプラグインを前提にしている所がgithub pagesでは使えない、
みたいなのになりがちで、やりたい事を調べにくい。
そんな苦労の跡も一応お残しておく。

適当にググってたらjekyllでブロックを扱うなら[公式ドキュメントのTags](https://jekyllrb.com/docs/plugins/tags/)を読め、的に言われていて、ここでtag blockというのがそれっぽいな、と思う。

でもこれはPluginという扱いで、[stackoverflowを見る限り](https://stackoverflow.com/questions/53215356/jekyll-how-to-use-custom-plugins-with-github-pages)github pagesではカスタムのプラグインは使え無さそう。

で、適当にスタイルを当てられるタグブロックが提供されてないかしら？
とgithub pagesで使えるプラグインの一覧を探したら、[about-github-pages-and-jekyll](https://docs.github.com/en/github/working-with-github-pages/about-github-pages-and-jekyll)に書いてあったが、それっぽいものは無さそう。

上記stackoverflowからリンクのあった[Jekyll without plugins](https://jekyllcodex.org/without-plugins/)というのを見ると、だいたいincludeで頑張ってるんだよなぁ、
と思って[jekyllのincludeのドキュメント](https://jekyllrb.com/docs/includes/)を眺めていてcaptureという物を理解した結果、冒頭の形式に至る。

適当なブロックにスタイル当てたい、ってめっさ普通にあるユースケースだと思うんだけど、本当にこんな事やらないといけないの？というのは良く分かっていないが、
もう動いたからいいや、という気分。

### 余談2: Jekyllのローカル環境

この手の作業をするにあたり、重い腰をあげてローカルのjekyll環境を作った。＞ [Mac OS X上のdockerでjekyll環境を作ってgithub pagesのテストをする](http://karino2.github.io/2021/01/17/jekyll_on_mac.html)

この手の作業効率は劇的に改善した。最初からやっとけ、という話ではある。
