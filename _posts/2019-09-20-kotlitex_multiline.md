---
title: kotlitexの複数行対応
layout: page
---
線形計画法は数式を複数縦に並べる必要がある。
これを手元のノートとweb上でいい感じに表示するには、素直に複数行対応する方が良さそうな気がする。

だが現状は数式はTextViewのSpanの一種として実装してあって、高さが可変な場合の扱いはあまり真面目に考えてない。
という事で結構大変なのだが、これを解決しないと線形計画法の教科書の続きを読む気が起きないので、この連休でやる事にする。雨が三日続くらしいし。

### 初日の進捗

とりあえずKaTeX移植部分から。

バックスラッシュ四つはマクロとして実装されているので、いい機会だからマクロも移植した。
もともと半分くらいはコードは残してあったので、完全に一から移植する訳でも無いが、それなりの分量である。
さらに改行周辺の処理はbuildExpressionより外側のbuildHTMLで行われていてこの辺は移植してなかったのでその周辺も移植した。
for文でのインデクスをこっそり中で進めたり戻したりするコードがあって、
kotlin的には非常に書きにくくて苦戦したが、心を無にしてwhile文化して先に進む。

そしてレンダリング回りの処理も追加して一応動いているのを確認。
ただこのままではSpanの高さがおかしくて下の行にめり込んでいる。
これは予想通りではあるがなんでかは良く分かってない所。
明日はここをちゃんと考え直す所からかなぁ。

残るTODOとしては、

- MathSpanの高さをちゃんと合わせる
- MarkdownView側のパーサーをちゃんと複数行対応する

の二つくらい。
どちらもそんなに重くは無いので、ここまでくれば明日中には終わるだろう。

### 移植のコードの良しあし

このコードをここまで本格的にいじるのは随分久しぶりだ。半年ぶりくらいか？
移植のプロジェクトで、短期で終わる類の物じゃない長いものの場合、
途中の様々な選択の功罪は、こういう少しあとになったシチュエーションで明らかになると思う。

久しぶりに触った時に把握するのに時間がかかるのは良く無い部分だ。
クラス名やファイル名、どこに何を置いたか、オリジナルのJSのコードとどこを変えてどこは揃えたのか、
こうした選択の結果が、ちゃんと時間があいて触る時の事を考えて、それを助けるものになっているのが良い選択だ。
オリジナルと変えた場合に対応関係は時間がたってもすぐに把握できるか？
移植元のコードで見ているものの該当箇所をすぐ移植先のコードで見つけられるか？反対も出来るか？
コメントで対応関係や変えた理由などを書いておくのは非常に助けになる。

一時的にダミーの実装にしておいた所が新しい処理を入れた時に根深い悪さをするようなのは悪い選択だ。
一方でダミーにしていた所が悪さをした時に、すぐにその事が分かるならそんなに悪くない。

コメントアウトした時に、それが一時的なコメントアウトであとで実装しなきゃいけないものなのか、
何かの理由でAndroid版では必要ないコードという事を表しているのか、
オリジナルのコードにあったコメントがコピペされただけなのか。
こうした区別がすぐにつくのは良いコメントアウトだ。

未実装の所を実装しよう、と思って実装を開始した時に、ぱっと見で実装しなきゃいけない所だけを実装して動くのは良い未実装の残し方だ。
逆にぱっと見はやらなくても良さそうに見える所に多く未実装が散らばっていて、それを把握するのが困難なら、
その残し方はあまりうまく無い。
この辺はとりあえず動くという最初の目標とトレードオフがあり、
その選択にはセンスが問われる。

ほかにもサンプルアプリやUnit TestやCIやlintがどのくらいこの久しぶりの作業を助けてくれるか、なども、
それらの選択が正解だったか良く無かったかを教えてくれる。

これらの結論は、一般に言われている正しい事よりも一段強い。なぜならよりプロジェクトにspecificだから。
よりspecificな結論の方がより実態に沿っている。
もっと言えばこれらspecificな良しあしの判断に合致しているかどうかで一般論の正しさを評価すべきくらいだ（もちろんどれか一つのプロジェクトじゃなくてそれらのspecificな成否を集約したもので）。

今回の移植は、JS+flow+HTMLからAndroid+Kotlinへの移植という相当難度の高いものであるが、
それを思えばかなりうまくやっているんじゃないか。