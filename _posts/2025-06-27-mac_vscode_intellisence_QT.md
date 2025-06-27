---
title: MacでQtのヘッダをVSCodeのインテリセンスに認識させる
layout: page
---
Qtのヘッダをincludeしているとインテリセンスが効かなくなる問題を重い腰をあげて対応。
ただどう対応するかいまいちよくわからない。

まずqt-cmakeとか使うため、Qtのbinにはパスを通しているとする。

するとqmakeが使えて、`qmake -query`でそれっぽいパスの一覧が出る。

とりあえず試行錯誤の説明のため、`~/Qt/6.8.3`にQtがあるとすると、以下みたいなアウトプットになる。（実際はフルパスだけど）


```
$ qake -query
いろいろ
QT_INSTALL_HEADERS:~/Qt/6.8.3/macos/include
QT_INSTALL_LIBS:~/Qt/6.8.3/macos/lib
```

includeという名前なのでこれを指定すればいいかな？とc_cpp_properties.jsonに書いたが駄目っぽい。
findで探すと、どうもQT_INSTALL_LIBSの下の `QtWidgets.framework/Headers/` とかの下にあるっぽい。

これを通したら、今度は `QtWidget/qtwidgetsglobal.h` が無いとか言われる。QtWidgetsがプレフィクスについているのでどこに通せばいいのかなぁ、
と少し試行錯誤したが、どうもQT_INSTALL_LIBSの直下を足せば解決出来そう。

さて、c_cpp_properties.jsonでqmake使うとかはいかにも出来なさそうなので、
VSCodeを立ち上げる前にqmakeの結果をexportするようにしよう（もっと良い解決策知っていたら教えて）。
queryと同じ名前を使っていると混乱を招きそうなので、
適当な名前、`MY_QT_LIB_PATH`でexportするとするか。

今開発しているプロジェクトがMFGStudioという名前なので、そのワークスペースを開くのは以下みたいなシェルスクリプトになる。

```
#!/bin/sh

export MY_QT_LIB_PATH=`qmake -query QT_INSTALL_LIBS`
code MFGStudio.code-workspace
```

これでQtのbinにPATHを通してあれば動くようになった。

次はc_cpp_properties.jsonに書く。
環境変数は `${env:HOGEHOGE}`と書くらしいので、

以下みたいな感じに。

```
{
    "configurations": [
        {
            "name": "Mac",
            "includePath": [
                // 本当はここに以下系列が挟まる "${workspaceFolder}/XXX",
                ...
                "${env:MY_QT_LIB_PATH}/",
                "${env:MY_QT_LIB_PATH}/QtWidgets.framework/Headers/",
                "${env:MY_QT_LIB_PATH}/QtCore.framework/Headers/",
                "${env:MY_QT_LIB_PATH}/QtNetwork.framework/Headers/",
                "${env:MY_QT_LIB_PATH}/QtConcurrent.framework/Headers/",
                "${env:MY_QT_LIB_PATH}/QtGui.framework/Headers/"
            ],
        }
        ...
    ]
    ...
}
```

いかにももっといいやり方がありそうだが、とりあえず動いてはいる。