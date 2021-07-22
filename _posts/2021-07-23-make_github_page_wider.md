---
title: GItHub Pagesのminimaのサイトの幅を広くする
layout: page
---
[c-lessonのサイト](https://karino2.github.io/c-lesson/arm_asm.html)がMacBookとか横幅の広い環境で見ると横が無駄にスペースがあいていて、
テーブルとかが見づらい。

ググるといくつか方法が引っかかるが、うまく行ったのが以下。

[StackOverflow: How to make maximum utilization of the screen space in my web page generated from Jekyll?](https://stackoverflow.com/questions/53874469/how-to-make-maximum-utilization-of-the-screen-space-in-my-web-page-generated-fro)

`assets/main.scss`というファイルを作って、

```
---
# Only the main Sass file needs front matter (the dashes are enough)
---
$content-width: 100%;

@import "minima";
```

とすれば良さそう。100%はあまり見栄えが良くないので80%とかで。