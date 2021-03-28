---
title: CMake+Ninjaの組み合わせが素晴らしい
layout: page
---
以前、[MacでVSCodeとclangで中規模のC++開発（コンソールアプリ）をする](https://karino2.github.io/2020/04/13/mid_cppproj_vscode_mac.html)で、Makefileとか書いてます、
という話をしたが、当時は依存は見ずにアドホックに良く触るファイルに関わるオブジェクトファイルだけ消す、とかやっていた。

その後触るファイルが増えてきて依存をちゃんと見て欲しい、という気分になり、
でも今更Makefile頑張るのもなぁ、と思っていた所、ninjaを偶然何かで見かけて、
そういえばninjaってどうなのだろう？と試したら、これが凄く良かった。

CMakeがninjaに対応してて、ninjaがインストールされてると勝手にninjaが使われる。
だからCMakeを書いて普通に実行するだけでninjaが使われて、
しかもこのルールがちゃんとdepを見てくれる奴で、どこ変更してもちゃんとビルドされる。
しかも速い！
毎回F5で走らせてもいいや、と思うくらい速い。

CMakeToolsの出来は微妙で、現在開いているファイルに依存した場所とかのCMakeLists.txtを探し始めるので、
tasks.jsonのtype: shellで普通にコマンドラインからビルドするコマンドを書いて、
launch.jsonのpreLaunchTaskで普通に呼ぶようにした。これでいいやん、という感じ。

という事でずっと決定版が無いと思っていた中規模のコンソールアプリ作るMake的なもの、
CMake+Ninjaで良いという結論になった。素晴らしいね！