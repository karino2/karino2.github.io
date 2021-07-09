---
title: ReactNative for macOSを触ってみた雑感
layout: page
---

Electronは快適なんだがいちいちバイナリが100MBとかになる。
ReactNativeとかどうなんだろう？と思って見てみた。

Getting startedの通りに作業をするとpodが無いとかxcodeのコマンドラインツールが無いとか、アプリの名前がXCode側のアプリの名前と違うとかいろいろトラブルがあったが、
頑張ってトラブルシュートしながら進んでいったらなんとか動かせて、その過程でだいぶ理解が進んだ。

その後ドキュメントを見るか、と眺めていると、Macのプラットフォーム周りのドキュメントがすっからかんでこれでは何も出来ないのでは？と思ったが、
XCodeのプロジェクトを立ち上げたら完全に理解した。
なるほど、単なるアプリなんだな。
だからここからは通常のMacアプリの開発の知識で良い、と。

react-native-webviewを追加して表示してみて、Releaseビルドを作ってサイズを見たら12.6MB。まぁこのくらいなら我慢出来る気もする。

一方で、Electronよりもだいぶ普通のMacアプリ開発っぽくなってしまう。
XCodeで作業する感じだし。
これなら普通にSwiftUIで書くのとどれだけ違うのか？というのは考えてしまう。

App.jsより先はポータブルにはなる訳だ。
ただそれは普通のReact開発で、html+jsの手軽さはだいぶ失われる。

もちろんwebviewで普通のhtmlとjsをロードして開発していく事は出来るんだろうけれど、
ReactNativeはそういう風なもの、という訳では無いので、
ipcとかの支援は非常に原始的だし、
node_modules下から適切なcssを持っていってもらう方法とかもいまいち良く分からない（やり方はありそうだが、普通の開発スタイルじゃないので情報が少ない）。

React開発をしたいのならこれでいいんだけれど、html+jsをやるのは結構たいへん。
なのでElectronとは別物になりそうだなぁ、という気がする。
少なくとも自分がここまで作ってきたElectronのアプリを持ってくるのはちょっと苦労がありそう。

一回その辺のやり方を一通り確立してしまえば、React Native for macOSをElectronの代わりとして使う、というのは出来そうな気はするけれど、一回確立するまでは大変だなぁ、と思う。

html+jsとしてでは無く、Natvieアプリを作るポータブルの環境としてはどうかね？
hot reloadでサクサク書いていけそうで、それは悪くないかもしれない。
React開発者なら特にだいぶ違和感無く適応出来そう。

一方で一度作ったら他でも使い回せる、という度合いが結構低い。
そのネイティブのアプリ開発の経験は要るよなぁ、という感じ。
ただネイティブのアプリ開発の経験があれば共有資産は使えそう。

結論、雑用ツールという視点では、Electronの方がだいぶ楽だが、サイズが許せないならReactNativeで頑張るのはアリかもしれない。