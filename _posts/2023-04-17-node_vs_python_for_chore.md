---
title: 最近雑用はpythonよりnodeが増えた
layout: page
---
以前は雑用にはシェルスクリプトを超えた時はPythonを選んでいて、さらに大きくなったらF#を使っていた。
でも最近はこのPythonの所がnodeになっている。
そんなに凄くnodeの方が良いと思っている訳でも無くて割とどっちでも良いと思っているのだが、
どっちでもいいんならなんでnode使っているのかなぁ、と思って、このエントリを書いている。

まずElectronとコードが共有出来るのが良い気がする。
Electronのアプリで似たような事をしている時に、
そこから適当にコードを持ってきて自動化する、みたいな感じに進めると、
nodeが一番便利、となる。
そうして雑用のnodeのスクリプトが増えてくると、
似たような雑用をする時に、そういえば前に似たような、
けどちょっと違う事やったな〜とnodeのスクリプトを持ってきて適当に変更したりするので、
Electronと関係ないものもnodeになる。

npmの方がホストの環境を汚しにくい気もしている。
これは自分の場合web開発の仕事をしている訳では無いのでnpmが雑用以外で重要になる事はあまり無いのに対し、
Pythonは機械学習などの仕事で割と面倒を生んだりする事があるので、
あまりPythonで日常的な事をやりたくないという気持ちがあるせいな部分は大きい。
ちゃんとやれば別に汚さない事は知っているのだが、
汚さないようにやるのはnpmの方が楽に思う。

ライブラリを含めた言語的にも、まぁJSでもいいか、という思いもある。
雑用スクリプトでasync awaitするのも無駄だなぁ、とは思っているが、
そこまで面倒がある訳でも無い。
htmlとかjsonを操作する事が多いと、JavaScriptである事の便利さも結構ある。
自分の最近の雑用はgithub pagesに何かを出すパターンが多いので、htmlやjsonに特化しているのは利点だ。
べつにPythonでもいいのだけれど、
html周辺のライブラリはnodeの方が学習が容易な事が多い気がする。

ただ、なんかこのエントリを書こうと思う程度にはnodeを雑用に使うのが良いという事にはあまり納得できていなくて、
でも理屈は置いといて実態としてnodeで雑用を書いているのだから、
そういう事なのだろうなぁ、というような感覚でいる。

なんか面倒が無いんだよね。
そんなに快適と思っている訳じゃないんだが。