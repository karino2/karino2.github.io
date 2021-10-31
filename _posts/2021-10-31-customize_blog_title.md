---
title: このブログのタイトルをカスタマイズする（縦棒からハイフンに）
layout: page
---
ブログのタイトルが、「ページタイトル | サイト名」となっていたのだが、
これは一部のマークダウンパーサーでテーブル記号と混同されてパースが失敗する。
テーブル記号自体独自拡張だと思うのでどちらが正しいかは良く知らないが、
テーブルは良く使うのでこの縦棒では無くハイフンにしたい。

ちょうど以前git-wikiではこの辺のカスタマイズをしたので、だいたい想像はつく。やってみよう。

[Overriding the SEO Title Tag · Issue #366 · jekyll/jekyll-seo-tag](https://github.com/jekyll/jekyll-seo-tag/issues/366)

これを見ると、seoには`title=false`という指定が出来るらしい。上記issueではdefault.htmlでtitleを書いているというが、
今default.htmlを見るとheadタグはhead.html側に入っているっぽいので、head.htmlを持ってきて以下のように修正。

```
  {%- seo title=false -%}
  <title>{{ page.title | append: " - " | append: site.title | strip_html }}</title>
```

最新のhead.htmlは新しすぎるようで一部ファイルが無いとか言われたのでちょっと古いのに戻して動いた。
これでブログのリンクをブラウザ拡張で自動で生成するのを使うと、以下みたいになる。

[最近の外出とデジタルライフスタイル - なーんだ、ただの水たまりじゃないか](https://karino2.github.io/2021/10/25/digital_lifestyle_thesedays.html)

うんうん、いいんじゃないか？