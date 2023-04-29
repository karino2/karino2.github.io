---
title: RandomThoughtsのでスクリプトで生成しているリンクが切れている問題を直す
layout: page
---

RandomThoughtsでは[書籍](https://karino2.github.io/RandomThoughts/書籍)のページはスクリプトで作っているのだが、
どうもこれで作られるリンクがいくつかdead linkになっているので直したい。

書籍のページのリンクは以下の段階で生成される

1. 【書籍】の入っているファイルをgrepで探して、「書籍ページ」にWiki Linkの記法で並べる
2. 全mdのWiki Linkをシェルスクリプトで通常のmdのリンクに置換する

そして、手でファイル名のWiki Linkを書いている場合はリンクがたどれている。
書籍のページのリンクは辿れていない。
一見同じに見えるのだけれど、どうもファイル名とmdでIMEから入力するもので一部文字コードが違う事があるっぽい。

### URL Encodeしてみる

ステップ2でリンクの方をもう少しまともにハンドルしてみればいいんじゃないか。

元のシェルスクリプト

```
#!/usr/bin/env zsh

FNAME=`basename $1`
DST="../wiki/$FNAME"

sed 's/\[\[\([^]]*\)\]\]/\[\1\](\1.md)/g' $1 > $DST
```

このカッコの中だけURL Encodeしたりとかすればいいんだろうが、
シェルスクリプトだと微妙に難しい。

とりあえずPythonにしてみるか。

```
import sys
import re
import urllib.parse

pat = re.compile(r'\[\[([^]]*)\]\]')

def replace(m):
    original = m.group(1)
    encoded = urllib.parse.quote(original, safe='')
    return f"[{original}]({encoded})"

for line in sys.stdin:
    line = re.sub(pat, replace, line)
    print(line, end="")
```

これを上記sedと置き換える。
なんかめっちゃ遅くなったので上から呼んでるxargsに-Pをつけたりする。

### ユニコードの正規化

意図した通りには動いているが、リンクは切れたまま。
でもURL Encodeしたので文字コードの比較がテキストで見えるようになったので、
上手く行くケースと違うケースを見てみると、カタカナやひらがなの濁点が違うっぽいな。
リンクが切れているケースを見直してみると、確かに濁点があるのだけな事に気づく。

Macのファイルシステムのファイル名で使われているUnicodeの正規化となんか違うっぽいな。
良くわからないので適当な正規化を指定してみて合うのを探そう（ゆとり）

NFCにしたら同じになった。まぁこれでいいんじゃないか。

```
import sys
import re
import urllib.parse
import unicodedata

pat = re.compile(r'\[\[([^]]*)\]\]')

def replace(m):
    original = m.group(1)
    encoded = urllib.parse.quote(unicodedata.normalize('NFC', original), safe='')
    return f"[{original}]({encoded})"

for line in sys.stdin:
    line = re.sub(pat, replace, line)
    print(line, end="")
```