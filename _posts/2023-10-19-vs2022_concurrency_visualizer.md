---
title: VS2022の同期実行ビジュアライザーが動かない時の対処
layout: page
---
Visual Studio 2022で同期実行ビジュアライザーを「分析＞同期実行ビジュアライザー＞現在のプロジェクトで開始」を選んだ時に、
`The Concurrency Visualizer cannot start because ETW collection is currently in progress: See http://go.microsoft.fwlink/?LinkID=217390 for help.` と表示される問題に遭遇した。

基本的には以下のStack Overflowと同じ話だった。

[Cannot start Concurrency Visualizer in Visual Studio 2012. Got error "Unable to start the ETW collection" - Stack Overflow](https://stackoverflow.com/questions/16724041/cannot-start-concurrency-visualizer-in-visual-studio-2012-got-error-unable-to)

少しバージョンが古いので2022で同じかどうかページを見るだけだと分からなかったので、2022でも同じだったという事を書いておく。

自分の場合はAdminのターミナルで`logman -ets`と実行したらNT Kernel Loggerが居たので、
`logman stop "NT Kernel Logger" -ets`と実行したら、上記のエラーが消えた。

同期実行ビジュアライザーは非常に情報量が多くて必須であり使いやすい、良いツールだと思うので、
起動周りのトラブルの情報はもうちょっと増えたらいいのになぁ、と思った。