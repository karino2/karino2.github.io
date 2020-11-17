---
title: OS X+VS CodeでHalideの中をステップ実行する
layout: page
---

Mac上のVS CodeでHalideのステップ実行をしたかったので適当にやってみた。
いろいろ正しいやり方が分からずに適当にごまかしているので、
ちゃんとした手順分かる人いたらブログ書いてくれたらリンクします。（たぶん）

### 前準備

1. Halideのソースコードをgitから取ってくる
2. VSCodeのExtentionはCMake ToolsとCode LLDBを入れる（なんか普通のC++ toolsのデバッガが最近 OS Xで動かないので）
3. brew install llvm
4. VSCodeでHalideのソースコドのフォルダを開く＞CMake Toolsが何か聞いてくるので適当に答えるとコードブラウズ出来るようになった気がする（うろ覚え、下のステータスバーみたいな所なんかいじったかも）

以上が前準備。

### 5 dependencies/CMakeLists.txtにLLVM_DIRを足す

dependencies/CMakeLists.txtに以下を足す。

`set(LLVM_DIR /usr/local/Cellar/llvm/11.0.0/lib/cmake/llvm/)`

これは`brew list llvm | grep LLVMConfig.cmake`した時のディレクトリ。
VS CodeのCMake Toolsに環境変数とか渡す方法を調べるのが面倒だったので。

### 6 tutorialsに自分用のファイルを足す（optional)

lesson_01_basics.cppとかをいじっても良いのだが、
mytest.cppというファイルを作って自分用のコードはそこに置く事に。

1. tutorials/mytest.cppをlesson_01_basics.cppを参考に適当に書く
2. tutorials/CMakeLists.txtに以下を足す

`add_tutorial(mytest.cpp)`

### 7 ビルド

当初はVS Codeからビルドする気だったのだが、デバッグビルドの指定方法が分からなかったので、コマンドラインからビルドしている。（やり方知ってる人居たら教えて）

Halideのソースコードのあるディレクトリから以下を実行

```
$ mkdir halide_build
$ cd halide_build
$ cmake -DCMAKE_BUILD_TYPE=Debug ../
$ cmake --build . -j 20
```

jオプションが効いているかは良く知らない。（効いてそう？）

### 8 デバッグ実行の環境を準備

VS CodeでF5を押すとlaunch.jsonが立ち上がるが、前述の通りなんか最近 OS Xでcppdbgがうまく動かないのでCode LLDBを使う。

具体的にはtypeをlldbにしてprogoramを指定する。

```
  "type":"lldb",
  "program": "${workspaceFolder}/halide_build/tutorial/mytest",
```

これでブレークポイントを貼ってF5でステップ実行が出来るようになった。

