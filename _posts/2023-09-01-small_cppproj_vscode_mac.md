---
title: MacでVSCodeとclangで小規模のC++開発（コンソールアプリ）をする手順
layout: page
---
以前[MacでVSCodeとclangで中規模のC++開発（コンソールアプリ）をする](https://karino2.github.io/2020/04/13/mid_cppproj_vscode_mac.html)というブログ記事を書いたのだが、
これは中規模向けなのでファイル数個の時にはあまり参考にならない。しかも微妙に古い。

毎回適当にセットアップしては忘れて次回また適当にセットアップするのだが、いい加減メモを残そうと思い立つ。
前提としては全部毎回フルコンパイルで別に構わないような規模のファイル数個の開発。

VSCodeはディレクトリを開く。

## tasks.json

- 適当なcppファイルを作ってF5を押す
- Select Debuggerというのが出るので「C++(GDB/LLDB)」という奴を選ぶ
- 構成の選択というのが出るので「C/C++: clang++アクティブファイルのビルドとデバッグ」を選ぶ

これでtasks.jsonが生成される。

次にこのファイルのlabelを適当な名前に変更し、コンパイルも全cppファイルをコンパイルするように変えて、
実行ファイルも適当な名前にする。

```
        "${workspaceFolder}/*.cpp",
        "-o",
        "${workspaceFolder}/sample_test"
```

## launch.json

次にlaunch.jsonを書く。
左側のツールバーのデバッグのアイコンを押すとTo customize Run and Debug create a launch.json file. とかいう所で青くリンクになってる所を押すと
Select Debuggerというのが聞かれて「C++(GDB/LLDB)」という奴を選ぶと、
それが無視されてほぼ空っぽのlaunch.jsonが作られる。（なんで？）

仕方ないので以下のような感じに書く。

```
  "configurations": [
    {
      "name": "C++ launch",
      "type":"cppdbg",
      "request": "launch",
      "program":"${workspaceFolder}/sample_test",
      "cwd": "${workspaceFolder}",
      "MIMode": "lldb",
      "preLaunchTask": "C/C++: clang++ テストのビルド" 
    }
  ]
```

幾つかポイント

- programの所はtasks.jsonで指定した生成ファイル名
- preLaunchTaskはtasks.jsonで変更したlabelの所の何か

これでファイル5個くらいまでの小さなプログラムを作るならまぁまぁの環境となった。

なんか以前のMacではcppdbgのcwdがうまく動いていなかったが、今は直っている模様。
なんでlaunch.jsonが空っぽで生成されてしまうのかはよくわからないが、大した事は無いのでまぁいいか、という感じ。