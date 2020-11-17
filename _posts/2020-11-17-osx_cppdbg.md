---
title: OS XでVS Codeのcppdbgを動かす
layout: page
---
Macで、前からなんかcppdbgが動かなくてCode LLDBを代わりに使っていたのだが、ウォッチが微妙なので重い腰を上げてデフォルトのcppdbgを動かすようにする。

正しいやり方は良く分からないが適当にやったら動いたのでやった事のメモ。

launch.jsonでmiDebuggerPathを指定したいのだが、lldb-miが最新のXCodeには入ってない。
で、VS Codeのissueに貼られているリンクも古いバージョンのllvmにリンクされていて最新版では動かないので、
自前でlldb-miをビルドした。

```
$ git clone https://github.com/lldb-tools/lldb-mi.git
$ cd lldb-mi
$ export LLVM_DIR=/usr/local/Cellar/llvm/11.0.0/lib/cmake/llvm/
$ mkdir buildspace
$ cd buildspace
$ cmake ../
$ cmake --build . -j 20
```

LLVM_DIRは`brew list llvm | grep LLVMConfig.cmake`のディレクトリ。

これで、buildspace/src/lldb-miというのが出来る。
なんでsrc下なのか良く分からない。
これをどこか適当な所に置いてもいいのだが、またなんかあったらリビルドしたりするかもしれないのでそのままえいっとlaunch.jsonに指定した。(パスは各自直して)

```
  "miDebuggerPath": "/Users/karino2/work/lldb-mi/buildspace/src/lldb-mi",
```

なんで最新版のMacでC++のデバッグというのに公式のドキュメントに正しいやり方が載ってないのかは良く分からないし、自分でビルドしないといけないのもなんか納得行かないが、
動いたので良しとする。

やはりcppdbgの方がウォッチはちゃんと動くね。