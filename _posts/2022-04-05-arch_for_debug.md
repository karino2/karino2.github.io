---
title: デバッグが簡単になる変更
layout: page
---

最近仕事で仕様を変える事で構造を大きく変える、という変更をやっている。
その副作用として、デバッグが簡単になった。たまにこういう事ってあるよなぁ、という話をしてみたい。

現象としてはこれまでステップ実行を何百回もしないと目的の場所にたどり着けなかったのが、
数回のステップ実行で問題の場所のそばまで行けるようになった、という感じ。
こういう、問題の場所までの距離を短くする類の変更ってあるよなぁ。
こういう時はたどり着くのが簡単になっただけじゃなくて、再現も簡単になっている事が多い。

大きな処理がずーっと動かないと再現出来ない、みたいな構造はデバッグがやりにくい。
一方トップレベルに抜ける奴は再現しやすい事が多いが、抜ければ良いというものでもない。
例えば何も考えずにただ途中の状態をダンプしてトップに抜けるだけだと、
結局その途中の状態を作るのに全部走らせないといけない、
となって、あまり改善が得られない。
なんか意味的に意味のある形で、そんなに大量じゃないデータで切れるとか、
大量のデータでも何かこう、定常的な所から簡単につくれるようなデータの場合には再現が容易になると思う。

こういうのってデータ分析でもクラウドの仕事でも、全然見た目は違うが同じような事はあった。
今回はC++のタブレットアプリで結構違う分野なので、割といろんな分野で見られるまぁまぁ普遍的な話なのかもしれない。
しかもどのケースでも、結構大きな構造の変更をしないとそうは変えられない。

この手の改善は、だいたいはバグは減らさない。バグ自体は全く同じバグが発生する。
速度も品質も、この変更自体では変わらない。
だが、開発効率が変わるし、その結果品質を上げたり速度を上げる作業が行えるようになるので、
長期的には速度も品質も上げる。

いつもこの手の大変更は躊躇しがちだけれど、
やって失敗だった事は一度も無い気がする。
たぶん開発がある程度続くならいつでもやって良い。
終わりそうな時にはやらないで凌ぐ方が良い事もありそうだけれど。

なんかよしぞう先生のこの記事を見た時も同じような事考えたんだよな。[オートモーティブの大規模データ処理を支える技術 前編: クラウドアーキテクチャ - BLOG - DeNA Engineering](https://engineering.dena.com/blog/2020/03/automotive-big-data-processing/)

