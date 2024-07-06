---
title: 最近iOSアプリ開発をしている
layout: page
---
お仕事で一ヶ月くらいずっとSwiftを書いている。
ほとんどAV FoundationとかAudio Toolboxのコードだけれど、その周辺でactorを使ったりUIとつなげるためにUIKit（SwiftUIでは無い）のコードを書いたりもしていて、
だいぶこの辺の事情にも慣れてきた。

Objective-Cは時代とともに結構大きな変更が入っていて、けれど末期はSwiftへの移行があって最新のプロパティ周りなどの情報がまとまっている信頼出来るソースがあまり無い。
もうちょっと最終的な安定版Objective-Cの時代が続いてくれれば、そのバージョンの書籍なども揃っただろうに。
Javaはかったるさはあっても素直な言語なのでAndroidの方がだいぶ状況はいいなぁ、と思う。

一方、Swiftはなかなかいい言語だな、と思う。ARC的な事に気を使わなきゃいけない所にはかったるさはあるし、
Objective-CのAPIとSwiftのAPIが微妙に対応関係がわかりにくくて（C-API的なフリースタンディングの関数だったものがメソッドになっていたりして、C側の名前が推測しづらくてググりにくかったりする）、
間の所をやるのはかったるさもあるけれど、
Swiftの中でコードを書いている分にはObjective-Cよりも気をつけなくてはいけない事はずっと少ないし、
書きたい事がそのまま書ける良さがある。

XcodeもSwiftのコードを書いている分にはかなり快適に書ける。
Objective-Cだと参照の検索だとかがうまく引っかからない事も多くてファイルブラウズも微妙でうんざりする事も多いが、
Swiftならちゃんと定義に飛べるし、インテリセンスも早い。
ヘッダと実装を行ったり来たりもしなくていいのでだいぶ快適に作業出来る。

最近は頑張ってXcodeのキーボードショートカットを覚えて快適度合いを増しているが、
こういうIDEへの適応は持っていると便利なスキルだよな。
自分はかなり適応度高い方だと思う。

Android開発者として隣の芝生的に見ていた時はAppleの方がドキュメントがしっかりしている印象があったし、
実際かつてはかなりいい感じだったと思うのだが、
最近は古くなった情報が多くてこれならAndroidの方がいいなぁ、と思う事も多い。

まず世の中のブログなどからの公式へのリンクがほとんど全部リンク切れになっていて厳しい。
けれど、それでは公式だけで生きていこう、と思っても、最新の公式ドキュメントには、十分な情報が無いものも多い。
Androidも昔の流儀が引っかかって現在の正しいやり方は全然わからん、
みたいな事は多いので、この辺はその分野を長くウォッチしてきたから分かるというだけかもしれないが。

時代の変化とともにドキュメントが各時代に作られたキメラみたいになってしまうのは両者に見られる困った現状だと思うが、
そういう時にAOSPのソースコードが各時代ごとに完全に残っているというのは強いよなぁ。
末端の開発者にソース読ませるとかひどくね？という気持ちも分からないでも無いが、
長期で見るとメリットは大きいな、と思うようにもなった。

MSはWin32 API時代は言語の進歩がほとんど無いので情報がそれほど古くはならず（APIの追加で変わる事は多いが古いものも動きはするし）、
.NET時代は公式のドキュメントだけで十分なので公式ドキュメントのアップデートがあれば生きていけるので、だいぶ状況はいい。
あれはMSが頑張っていたのだろうな。

AV Foundationより下側はドキュメントが無くてひどいもんだなぁ、と思う。
Stackoverflowでも解決してないタスクがたくさんあっていくつかは自力で解決したりしているが、
こういうのは大変だよな。
いろいろなレイヤーがあって、それぞれバッファの型が違ったりしてコンセプトからしてずれていたりするので単純にマッピング出来るものでもなく、
途中の制御が何も出来ない簡単APIみたいなのがアドホックにいろいろあって、それで出来ないものが突然全然別のコードが必要になってしまったりする。
Audio Toolboxは別物なの！？みたいな。
これはAppleがひどいというよりも、メディア系はどこもこんな感じだよなぁ。
もうちょっと整理してモダンメディアAPIみたいなのを作ってくれたらいいのになぁ。

SwiftでiOS開発はなかなか楽しいな、とは思う。
Swiftは言語としては相当複雑だとは思うが、
普段のコーディングはgolang的というかシンプルなOOPって感じのノリで書けつつ面倒さが無くて、
意図を明確にできてコンパイラも助けてくれて、いい感じのプログラム体験だなぁ、と思う。
extensionでインターフェースが定義出来るのがいいよな。

Kotlinはだいぶ関数型っぽさが全面に出てしまうので、Swiftっぽい読みやすさにはならないんだよねぇ。
その分書く時には頭を使って楽に書けるのだけれど。

下がObjective-CなSwiftと下がJavaなKotlinの違いも結構面白い。
こういう最初の選択の違いが長い時間たったあとにどうなったか、
というのは技術的にも面白いよな。