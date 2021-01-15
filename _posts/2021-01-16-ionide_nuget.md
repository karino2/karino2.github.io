---
title: F#でNuGetのライブラリを使う
layout: page
---
コマンドラインオプションとかをサポートしよう、という事でライブラリを探して、ArguというNuGetパッケージを見つけた。
これをVS CodeのIonideからどんな感じで使うか、というメモ。
全然分かってないですが、あまり興味も無いので困るまでは適当に進めていきます。

### step1: nugetのページでバージョンとか調べる。

https://www.nuget.org/packages/Argu

Package Referenceを見ると`<PackageReference Include="Argu" Version="6.1.1" />`と書いてあった。

### step2: fsprojにPackageReferenceを追加

fsporjにそのまま追加したら怒られたので、ItemGroupを作ってその下に追加する。

```
  <ItemGroup>
    <PackageReference Include="Argu" Version="6.1.1" />
  </ItemGroup>
```

### step3: Progam.fsに`open Argu`を足す。

ちゃんとreferenceできてるか確認する為にProgram.fsに何かコードを足す。とりあえずopen Arguだけ。


### step4: コマンドラインからdotnet buildする＞通る

ただインテリセンス上は怒られている。Solution ExplorerにはArguが追加されている。

### step5: Ctrl-Shift-Pして`>Developer: Reload Window`する

インテリセンスも怒らなくなったヽ(´ー｀)ノ


----

## Paketを使うのはうまく行かなかった

Paketを使おうとしたがうまく行かなかった。以下、うまく行かなかった手順を残しておく。

----

まずパッケージのdependency managerとしてPaketという物があるらしい。
これはNuGetパッケージの依存関係を管理出来るっぽい。とにかくPaketを使えば良さそう。

step1: VSCode上のInoide-PaketというExtentionを入れる。

step2: そのあとPaketも入れろ、と言われたのでコマンドラインから、`dotnet tool install --global Paket`を実行。globalでいいでしょう。

これでIonide-Paketが使えるようになったっぽい。

step3: 有効にする為にはワークスペースで、Ctrl-Shift-Pで`>Paket: Init`する。

step4: パッケージの追加はまたCtrl-Shift-Pして`>Paket: Add NuGet Package`して、聞かれた所にArguと入れてEnter押す。なんか追加された風味。

ただまだ`open Argu`ってしてもインテリセンスが認識してくれないな。fsprojにリファレンスを加える必要がある気がする。
どうやるんだろ？

step5: fsprojファイルを開き、そこでCtrl-Shift-Pして`>Packet: Add NuGet Package (to Current Project)`を選び、`Argu`と入れてEnter。

Importが追加されたが、相変わらずopen Arguの所でエラーになる。dotnet buildしても怒られるので何かおかしいっぽい。

.paketの下とか覗いてみたが面倒そうなので、使わない方針に変更する。