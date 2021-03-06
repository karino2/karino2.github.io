---
title: F#が雑用言語に良い。
layout: page
---
以前[MacとWindowsの両方で使う雑用コマンドライン言語にF#はどうだろう？](https://karino2.github.io/2020/11/15/how_about_fsharp.html)などと書いたように、F#を使ってみているが、なかなか良くて気に入った。

### VS Codeでの開発環境が良い

まずVS Code+Ionideが良く出来ている。
インテリセンスは早いし書いてる途中のエラーもガンガン見つけてくれる。
文法的な間違いもツールチップでだいたい解決していけて、
使いながら学習していける感じがある。
以前試したgolangのLSより断然良く出来ている（最近のgolangは良くなってるかもしれないが）。

.NET Coreのインストールも特に手間取らずあっさり出来るし、
環境設定もハマらない。良い。
MacでもWindowsでも特に問題なく使える。
こういうのはMSは良い仕事をするね。Javaよりずっとわかりやすい。

環境が割と成熟していてセットアップとかのストレスが無いのが良い。

### 言語周辺の問題が良く解決されている

それなりに枯れているというかかゆい所に手が届くような、
出来たての言語には無い細かい部分の問題を地道に解決してきたような快適さがある。
元の言語は割と固い言語だと思うのだが、
fsharp scriptというスクリプト用の亜種があってこれが
Alt+Enterで実行していく感じで開発出来る。
scratchバッファ感覚でサクサク動いて良い。

コマンドラインのツールとしてもNuGet packageに出来て、
ちゃんとツールとして使いやすくなっている。
詳細は以下のブログを参照の事[Writing .NET Core Global Tools with F#](https://gregshackles.com/writing-net-core-global-tools-with-fsharp/)

### ドキュメントも良い

[F# for Fun and Profie](https://swlaschin.gitbooks.io/fsharpforfunandprofit/content/)が素晴らしい。
何故かe-pubのダウンロードは出来なくなっているっぽいが、最近BOOXを買ったのでそれで読んでいれば特に不満も無い。
F#のバージョンはちょっと古いか？関数の型の定義でvalとか使っているが今はtypeになっているっぽい？良くわからないがこちらではコンパイルは通らなかった（typeにしたら通った）。＜ 追記: これは勘違いでシグニチャファイルに書くものらしい。後述。

このドキュメントは技術ブログの中でも最高ランクの出来では無いか。
最初はどこから読んだらいいか少し途方に暮れるが、慣れてくるとそれぞれのトピックがいい感じの長さでまとまっていて、楽しく気楽に読めながら勉強になる。
読んでいると「俺も関数型言語やるぜ〜」という気分になって、
実際にVS Codeでへこへこ試して行くとやりたい事がどんどん出来る、
という感じで自然に興味を持って学んでいけるのが良い。
こういうモチベーションを与える文書って素晴らしいよなぁ。F#への愛を感じる。
こういう素晴らしい技術ブログを自分も書きたいものだ。

あとMSDNもまぁまぁ良く書かれている。
必要な事が全部分かるという程では無いが、それなりに良く整備されているので疑問のかなりの部分は片付く。
Fun and Profitと両方を使い分けて、たまにググってstackoverflowとかを眺めていればだいたい知りたい事は分かるようになっている。

----

訂正: 上記のvalでは関数の型が定義出来なかった、というのは、.fsiというファイルに書く物だと[twitterで @matarillo氏に教えてもらった。](https://twitter.com/matarillo/status/1337066397466320896?s=20)

typeではType Abbreviationsという別の機能になっているとの事

- [MSDN: Signatures](https://docs.microsoft.com/en-us/dotnet/fsharp/language-reference/signature-files)
- [MSDN: Type Abbreviations](https://docs.microsoft.com/en-us/dotnet/fsharp/language-reference/type-abbreviations)

ただ、type firstにfsxで開発したい場合にはtype abbreviationsを使えば良さそう。これはFun and Profitの[Calculatorの所のコードのgistを見ると](https://gist.github.com/swlaschin/0e954cbdc383d1f5d9d3#file-calculator_v2-fsx)そうなっている。

### F#という言語が良い

F#はいいね。シンタックスが簡潔で、ライトウェイトに書けてしっかり型がつく。
Discriminated Unionとかで豊富な型の世界を構築出来て、
カリー化で簡単に関数を生成する関数が書けて、
パイプとかでつなげて気分良く書ける。

理論的に面白いだけじゃなくて普段の雑用とかに便利に使える。
インデントでpythonっぽくブロックを表せたりして、
凄い簡潔に書けるようになってた。ちょっとした事やりたい時に楽でいい。

小さな雑用を小さく片付けつつ、
そのままIDEの力を借りてどんどん大きい所までやっていける。
こういう雑用言語を求めていた。

個人的な話になるがなんだかんだでC#で飯食ってた時代が長いので、FCLは手が覚えているのも良い。
ドキュメント読まなくてもだいたいメソッドが出てくる。
そしてマイナー言語にありがちな実際何かやろうと思った時にライブラリが無くて困るという問題も無い。
SetでもSHA2のハッシュでもなんでも必要そうなものが一通りある。
こういう実際に使おうと思った時に必要な物が揃ってる、
というのも自分ポイント高い。

### 今後はコマンドラインの雑用はF#メインで行こうと思う

という訳でこれまでgolangでやってたような、
環境を越えて使いまわしたいちょっと複雑だがそこまででも無いくらいのコマンドラインツール的な物は、以後はF#でやっていこうかなぁ、と思っている。

.NET Coreの登場でUnix系の環境の雑用にF#が良い言語になっていた、
というのは盲点だったなぁ。
ずっとkotlinみたいな言語でコマンドラインのツール書きたいなぁ、と思ってたが、
VS Code + F# はかなりその欲求を満たしてくれた。よしよし。