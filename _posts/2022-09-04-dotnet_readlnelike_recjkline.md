---
title: .NET用の日本語の扱えるreadlineっぽいライブラリ、ReCJKLineを作りました
layout: page
---
[fsharp-lesson](https://karino2.github.io/fsharp-lesson/toyrel.html) でRelational Algebraの処理系を作っていて、
日本語の使えるreplを作りたかったのだけれど、手頃なreadline系のライブラリが無かったので、
簡単なものを作ってみました。
ReCJKLineという名前にしました。

- [karino2/ReCJKLine: Readline like dotnet library which support CJK (fullwidth).](https://github.com/karino2/ReCJKLine)
- [NuGet Gallery - ReCJKLine.karino2](https://www.nuget.org/packages/ReCJKLine.karino2/)

使い方としては、以下みたいな感じです。

```
using ReCJKLine;

var reader = new ReCJKLine.ReCJKLine();
var result = reader.ReadLine("prompt>");
Console.WriteLine("result is: {0}", result);
```

ネームスペースとクラスの名前がかぶっててVSCodeのlsが混乱するのがいまいちだなぁ、と思っていますが、もう変えるのも面倒なのでこのままでいいかな、と思っています。

今回はじめてNuGetを作ってGalleryに登録しましたが、簡単に作れていいですね。

当初はエスケープシーケンス使って作る気だったのだけれど、カーソルの移動がConsoleのAPIにあったので、ConsoleのAPIだけ使って作る方針に変更しました。
クリアとか空白を上書きして実装したりしているので多少ダサいけれど、Pure C#な感じでいいんじゃないか。

今の所ヒストリとかは作ってません。どちらかと言えば現在は基礎機能がきっちり動く事を目指していて、機能追加は控えています。
また、そういうのは皆が勝手にforkして足せるような、コードベースの小ささを重視しています。
既存のものはどうも作りが大げさで、ちょっと日本語対応を足そうと思った時にも面倒が多かったので。
ただ気が向いたらヒストリくらいは足すかも。

少し触った感じでは原始的だけど割とこれで十分かな、と思っています。
既存のものや素のReadLineよりはだいぶ快適と思う。