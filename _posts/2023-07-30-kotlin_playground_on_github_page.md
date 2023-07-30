---
title: Github Pages上でkotlin playgroundを使ってみる
layout: page
---
以前やった、[github pagesでブロックのスタイルを指定したい](https://karino2.github.io/2021/01/17/block_style_on_githubpages.html)みたいな感じでやってみたい。

`_inlcuces`に以下のように作る。

```
 % cat _includes/kotlin_quote.html
<div class="kotlin-quote">
{% raw %}{{ include.body | xml_escape }}{% endraw %}
</div>
```

次に`_layouts`の下にpageでkotlin playgroundのsrcなどを指定。

```
% cat _layouts/page.html
---
layout: default
---
<article class="post" itemscope itemtype="http://schema.org/BlogPosting">
  <script src="https://unpkg.com/kotlin-playground@1" data-selector=".kotlin-quote"></script>

  <div class="post-content" itemprop="articleBody">
      {% raw %}{{ content }}{% endraw %}
  </div>

  {% raw %}{% if site.disqus.shortname %}
    {% include disqus_comments.html %}
  {% endif %}{% endraw %}
</article>
```

これで、あとは本文を以下のように書くと動いた。

```
---
title: "サンドボックス"
layout: page
---

kotlin playgroundのサンプルです。

{% raw %}{% capture code1 %}{% endraw %}
class Contact(val id: Int, var email: String)

fun main(args: Array<String>) {
    val contact = Contact(1, "mary@gmail.com")
    println(contact.id)
}
{% raw %}{% endcapture %}
{% include kotlin_quote.html body=code1 %}{% endraw %}
```

captureでくくってincludeすれば間のコードが実行出来る。

結果はこんな感じ。

[サンドボックス](https://karino2.github.io/kotlin-lesson/sandbox.html)

簡単に出来ていい感じだね。