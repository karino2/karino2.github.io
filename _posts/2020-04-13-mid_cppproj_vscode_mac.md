---
title: "MacでVSCodeとclangで中規模のC++開発（コンソールアプリ）をする"
layout: page
---
Mac上でのVSCodeでの開発が、入門的なのばかりで実際にやっていく感じのが少なかったので少し書いてみたい。
といってもこの手のはケースバイケースなので、一例として。

結論としては、clang++とMakefileとVSCodeに拡張としてはC/C++拡張とCodeLLDB拡張で開発する、とう結論になった。
今更Makefileかよ、という気は自分もするのだが、その理由の話も後述する。

### 中規模とはどういう意味か

中規模という言葉に込めたい事としては、

1. フォルダは複数ある
2. プロジェクト独自のマスタービルドシステム的な物は無い
3. まぁまぁいろんな環境で開発する（世の中の様々なIDEを使う必要があるし、swiftから呼んだりndk越しにKotlinから呼んだりする）

という前提。

大規模になるとビルド自体が大きな作業になるのは不可避で、そういう所では独自の化け物ビルドシステムみたいなのがあって、
新たな環境というのはそこに組み込む、という形になると思う。
中規模という言葉には「そういう独自化け物ビルドシステムは無い」という意味を込めたかった。

で、そうは言ってもイマドキC++で開発する以上、幾つかの環境で動かしたい、という事が多い。そうでない場合もあるが、今回はそういう前提。
C++は多様なので、いつでも自分のケースの話しか出来ないものです。

### よくあるVSCodeでのC++開発のやり方の問題点

適当にぐぐってみたら、VSCode上のC++開発では

1. tasks.jsonにビルド方法を書いて
2. launch.jsonでデバッグ実行とかを書け

という風に書いてある事が多い。
だが、このtasks.jsonでは依存関係とか記述出来ず、毎回全ビルドになる。そりゃ無いよ。
しかも割と素のjsonなのでこの中でプログラム的な事が書けない。
ある程度高機能に宣言的に書けるのを期待したかったのだが、そういうのは無い。

という事で1ファイルとか数ファイルならこれで良いのだろうけれど、たくさんのファイルの場合はいまいちだな、という結論になった。

### なぜMakefileか

中規模プロジェクトなので、VSCodeのコンソールアプリ以外の所でも動かす。
XCodeとかVisual StudioとかAndroidStudioのndkとかQt Creatorとか。
で、これらはそれぞれ結構独自のやり方でいろいろ管理していて、
いちいちその環境のやり方に習熟したくない。

どの環境でも入門的なチュートリアルみたいなのは充実しているのでちょっとしたプロジェクトはすぐに作れるようになるものだ（たまにC++まで呼ばれない、とかで苦戦する事はあるが）。
だがこのチュートリアル的なのからあんまり離れた事をやるには結構ちゃんとそのIDEなり環境のやり方なりを理解する必要がある。
いっぱいあるといちいちそんな事はやりたくない。

という事で、なるべく他のプロジェクトも原始的にビルド出来るようになっている。
あまりビルドシステムの途中でなにかを自動生成したりはせずに、生成した物をレポジトリには突っ込んで、
ビルド側はなるべく原始的になっている。
新しくファイルを追加する時には心を無にして全環境に追加する（必要があれば）。

という事で新しくMac上でのコンソールアプリでも、それ以外のビルドとの共通化とかそういうのはせずに、なるべく原始的にビルド環境を作りたい。

という事で、いろいろ凝った事をするよりも原始的なMakefileでお茶を濁そう、となった。そりゃ無いよ…とは思うのだけど。

# 実際に作った環境について

最初に言った通り「clang++とMakefileとVSCodeに拡張としてはC/C++拡張とCodeLLDB拡張」という体制になった。
それについての具体的な話を簡単にしたい。

### 例としてのファイル構成

例として、

- dir1/
  - file1_1.cpp
  - file1_1.h
  - file1_2.cpp
- dir2/
  - file2_1.cpp
  - file2_1.h
  - file2_2.cpp
  - file2_2.h
- macConsole
  - main.cpp
  - Makefile

みたいな感じの構成を前提とする。 ディレクトリやファイルは実際はもっとたくさんある（10ディレクトリで各30ファイルずつくらい、とか）という前提。
macConsoleの所はmac依存の割と自分が好きにして良いディレクトリで、一方のdir1とかdir2とかはいろんな環境でビルドするのに使われる、みたいな感じ。

一つ上になんか置くとか、各ディレクトリにMacのコンソールアプリ用にMakefile置くとかはやりたくない(少なくともレポジトリには入れたくない)。

### コンパイラ(clang++)とかExtensionとか

コンパイラはxcode-selectで普通に入れたclang。[公式のVSCodeのドキュメント](https://code.visualstudio.com/docs/cpp/config-clang-mac)と同様。
ExtensionはC/C++拡張を最初は入れていたが、うまくデバッグ実行出来ず、
[MacのCatallina上でデバッグ実行出来ないというissue](https://github.com/microsoft/vscode-cpptools/issues/3829)を見つけてそこで推薦されていたようにデバッグ実行時にはCodeLLDBを入れる事にした。

### Makefile

もうmake depとか真面目にやる気は起こらないが、
複数のフォルダにまたがった.cppを適当に.oにしたい。
ファイルは以下みたいにした。

```
SOURCES = ../dir1/file1_1.cpp \
../dir1/file1_2.cpp \
../dir2/file2_1.cpp \
../dir2/file2_2.cpp \
main.cpp
```

dir1の中にはこの環境ではビルドしたくないcppなども入っているので全部列挙する事にする。
この手のファイルは既存のビルドシステムからキーボードマクロなどで作れるのでまぁまぁ作るのは楽（メンテはかったるいが中規模なので一応手動でメンテ出来る）。

ただこのsourcesからオブジェクトファイル作るルールをどうしたらいいか良くわからなかったので、
適当に覚えてる知識と試行錯誤で以下のようにした。

気分的にはmacConsole/buildとかに全部入れたかったのだが、.oから.cppを導き出せるようなルールになってないと自分のmake力では書き方良く分からない。

という事で、以下のようにmacConsole/buildの下に元のディレクトリ構造を移すようにした。

- macConsole/build/
  - dir1/
    - file1_1.o
    - file1_2.o
  - dir2/
    - file2_1.o

ルール的には以下のようになれば良くて、

```
build/dir1/file1_1.o: ../dir1/file1_1.cpp
```

これをsourcesから作りたかったのだが、あまり普段使わないコマンドとか使ってもあとで困るので、原始的な範囲で収めるべく、

```
build/dummy/../dir1/file1_1.o
```

を作る事にした。

```
DIRS=dir1 dir2

BUILD_DIRS=$(addprefix build/dummy/../, $(DIRS))
OBJECTS=$(addprefix build/dummy/,$(addsuffix .o,$(basename $(SOURCES))))

$(OBJECTS): | $(BUILD_DIRS)

build/dummy/%.o: %.cpp
	$(CPP) $(INCLUDES) $(CXXFLAGS) $(CPPFLAGS) -c $< -o $@
```

あとは普通。ただ、自分が良く変更するファイル関連のオブジェクトファイルだけを消すというやる気無いアクションも追加したりしている（この辺の雑さが中規模）。

### tasks.json、launch.json、ワークスペース

まず、tasks.json, launch.jsonの２つは
macConsoleの下の.vscode下に置く。

tasks.jsonは以下。とりあえず`-j 16`してるが、MacBook Proだと幾つくらいがいいんですかね？
20くらい？

```
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Build with make",
            "type": "shell",
            "command": "make",
            "args": [
                "-j",
                "16"
            ],
            "group": {
                "kind": "build",
                "isDefault": true
            }
        }
    ]
}
```

で、launch.jsonはCodeLLDBを使うように以下のように書く。

```
{
    // Use IntelliSense to learn about possible attributes.
    // Hover to view descriptions of existing attributes.
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "name": "launch unittest with lldb",
            "type":"lldb",
            "request": "launch",
            "program": "${workspaceFolder}/unit_test",
            "args": [],
            "cwd": "${workspaceFolder}",
            "preLaunchTask": "Build with make"
        }
    ]
}
```

まず`Build with make`を実行してから、`./unit_test`というコマンドを実行する（これはMakefileで生成している実行ファイル）。

これでF5でデバッグ実行して普通に操作出来るが、ウォッチ式はなんかGUIからhex表示したりする方法が良く分からない。
Cmd+Shift+Pで`LLDB: Display Format`というのを指定するとたまにHexになるのだが、この辺は良くわかってない。

いまいちだけど、最低限はなんとか出来ている。

ワークスペースとしてはmacConsole/macConsole.code-workspace という感じの場所に置いて、
中には

```
	"folders": [
		{
			"path": "."
		},
		{
			"path": "../dir1"
		},
		{
			"path": "../dir2"
		}
    ...
```

みたいな感じでディレクトリを追加している。
これでCmd+Pでファイル開いたりワークスペース検索で加えている物はだいたい見える。

### インテリセンスとc_cpp_properties.json

いまいち良く理解していないが、各ディレクトリ下のファイルを開いた時に、インテリセンスを効かせるにはどうも各ディレクトリ下にc_cpp_properties.jsonを置かないといけないように見える。

具体的には

- dir1/.vscode/c_cpp_properties.json
- dir2/.vscode/c_cpp_properties.json
- macConsole/.vscode/c_cpp_properties.json

と別々に必要っぽい？
中身としては全部同じ内容で、
includePathとかmacのフレームワークパスとかcppStandardのバージョンを指定しているくらい。

```
{
    "configurations": [
        {
            "name": "Mac",
            "includePath": [
                "${workspaceFolder}/**",
                "${workspaceFolder}/../dir1",
                "${workspaceFolder}/../dir2"
            ],
            "defines": [],
            "macFrameworkPath": [
                "/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk/System/Library/Frameworks",
                "/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk/usr/include"
            ],
            "compilerPath": "/usr/bin/clang++",
            "cStandard": "c11",
            "cppStandard": "c++17",
            "intelliSenseMode": "clang-x64",
            "compilerArgs": [
                "-std=c++14"
            ]
        }
    ],
    "version": 4
}
```

各ディレクトリに置くの嫌なんだけど…避け方が良く分からない。

という事でこのファイルはコミットしてない。
他の人が必要になったらどうするか協議しないとなぁ。

インテリセンスはだいたい効くのだが、なんかたまに反映されなくなる。
そういう時はShift+Cmd+Bでビルドすると何故か反映される事が多い。

あと、たまにShift+Cmd+Pで`C/C++: Reset Intellisence Database`すると反映されるようになる事もある。
この辺は謎も多い。

### codingスタイルの設定（が良く分からない）

ワークスペース単位で設定出来るはずだしドキュメントにもそう書いてあったのだが、いろいろ試行錯誤しても出来なかった。
何をやったのかもう覚えてない。

最終的には諦めてユーザー設定で設定している。
メニューの

Code＞Preferences＞Settingsからsettings.jsonを開いて

```
    "C_Cpp.default.cppStandard": "c++14",
    "C_Cpp.default.cStandard": "c99",
    "files.associations": {
        "*.hpp": "cpp"
    },
    "[cpp]": {
        "editor.defaultFormatter": "ms-vscode.cpptools"
    },
    "C_Cpp.clang_format_fallbackStyle": "{ BasedOnStyle: Microsoft, IndentWidth: 2, ColumnLimit: 0}"
```

とか書いた。
これで期待通りに動いているのだけど、本当はワークスペースローカルに設定したいなぁ。

なお、スタイルはプロジェクトの既存コードがそうなってたという話なので2タブの是非とかMSスタイルが良いかとか議論する気は無いです。


## まとめ

MacでMakefileでVSCodeでF9してF5してF10, F10, F10,...F11、みたいなのが出来るようになった。