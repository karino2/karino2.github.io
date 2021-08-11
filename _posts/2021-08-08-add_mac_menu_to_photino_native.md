---
title: Photino.NativeにMacのメニューを足すローカルforkを作る
layout: page
---
guashでコピペなどが動かないのが不便なので、Photino.NativeにMacのメニューを足そう、と決意する。
ただちゃんとやるのは面倒そうなので、とりあえずローカルのforkで。

### golangのwebviewの類似のPR

[Create edit menu with Copy/Cut/Paste/Select All support #237](https://github.com/webview/webview/pull/237)

というのを発見する。やりたい事とだいたい一緒なので参考になりそう。
ただacceptされずにcloseされている。切ない。

# 作業記録

上記PRを見るとwebview.hでsetMainMenuというのを呼ぶ前にいろいろやっている。
という事でPhotino.Nativeでも同じコードを探すと、Photino.Mac.mmの`Photino::Register`でやっている。

とりあえずこれをいじって、F#から呼んでちゃんと結果が変わる手順を確立するのが第一歩かな。

READMEにはビルドのコマンドラインが載っているが、makefileを眺めると、make mac-devで同じ事をやってそう？という事でmakeしてみる。

特にエラーは出ない。好印象。
結果は lib/dev/Photino.Native.dylib かな。

guashのかつてのコードを見ていると、Photino.Netのnugetパッケージをロードしている。だからPhotino.Netもビルドしてこのdylibを使うように変えないといけないのかな。

何も考えずにphotino.NETのレポジトリをローカルに持ってきて、msbuildを実行してみよう。

```
/usr/local/Cellar/mono/6.12.0.122/lib/mono/msbuild/Current/bin/Sdks/Microsoft.NET.Sdk/targets/Microsoft.NET.Sdk.FrameworkReferenceResolution.targets(283,5): error NETSDK1073: FrameworkReference 'NETStandard.Library' は認識されませんでした
```

ふむ、なんでmonoが使われるんだっけ？といろいろ見ていて、dotnetコマンドだとcore SDK見てるなぁ、と思い、
そういえばdotnetコマンドでビルドしてたな、とdotnet buildしてみたらビルド出来た。

次にローカルのdylybを指定する方法だな。

### 方針を考える

別に手でdllをロードしてdllmapを書けばたぶんロードは出来るんだろうが、Photino.NETの変更量が無駄に多い気もするな。
バリバリ開発するならローカルでプロジェクト参照作る方がいいんだろうが、
そんなに長期間開発する訳でも無いしなぁ。

ローカルでも本家と同様の構成でnugetパッケージ作って別のidにするかな。
nugetのその辺あまり詳しくないが、きっと出来るだろう。


### ビルド手順を確立する

まずはPhotino.Nativeのnuget packageを作る所から。

最初は同じnuspecを使ってパッケージのidだけ変えればいいかな、と思ったが、windowsとかlinux用のdllもパックしようとするので、
mac用だけのdynlibだけ残したバージョンを新しく作る。
Photino.Native.osxfork.nuspecと命名。パッケージ名もPhotino.Native.osxforkにしょう。

これってどうビルドしたらいいのかなぁ。azureのCIのパイプラインっぽいものがあるが、
いまいちフォルダ指定とかが良くわからないので、dynlibと同じフォルダにコピーしてパックする事にする。

```
cd lib/dev
cp ../../Photino.Native/Photino.Native.osxfork.nuspec ./
nuget pack Photino.Native.osxfork.nuspec -Version 1.0.0 -NonInteractive -Properties version=1.0.0
```

パック出来た。

次はローカルのnugetパッケージを追加する方法を調べよう。
ググったら以下のSOが引っかかる。

[SO: Add a package with a local package file in 'dotnet'](https://stackoverflow.com/questions/43400069/add-a-package-with-a-local-package-file-in-dotnet)

ふむふむ、csprojを書き換えるだけで良さそうだな。


```
   <RestoreSources>$(RestoreSources);../../localnugetpkg;https://api.nuget.org/v3/index.json</RestoreSources>
...
  <ItemGroup>
    <PackageReference Include="Photino.Native.osxfork" Version="1.0.0" />
  </ItemGroup>

```

ビルド出来た。ちゃんと拾えているかはまだわからないが。
どうやってためそう？HelloPhotino.NETで呼ぶのが良さそうか。
そのためにはPhotino.NETも違う名前にする必要があるな。PackageIdだけ変えてdotnet packすればいいか？やってみよう。

よさそう。

サンプルのHello PhotinoのcsprojもHelloPhotino.NET.osxforkに変更してビルドしてみる。
ビルドは通った。

では変更がちゃんと反映されるかをためそう。
まず、QuitのラベルををQuit2にしてみる。

ビルド番号を変えてもいいが、ローカルキャッシュを以下のようにクリアすれば良いらしいのでこちらも試す。

```
dotnet nuget locals all --clear
dotnet restore
```

で一通り手順を繰り返し、ラベルがQuit2になる事を確認。

手続きをシェルスクリプト化して変更したものが実行一発で反映されるようになる。よしよし。

### Undoを持ったeditメニューをつける

photino.NativeのPhotino.Mac.mmの`Photino::Register()`に、golangの方の上記PRから予想されるものをへろへろつける。

以下みたいなのを足してUndoが足される事を確認。

```
    NSMenu* editMenu = [[[NSMenu new] autorelease] initWithTitle:@"Edit"];

    [editMenu 
        addItem: [[
            [NSMenuItem alloc]
            initWithTitle: @"Undo"
            action: @selector(undo:)
            keyEquivalent: @"z"
        ] autorelease]
    ];

    NSMenuItem *editItem = [[[NSMenuItem alloc] initWithTitle:@"Edit" action:NULL keyEquivalent:@""] autorelease];
    [editItem setSubmenu: editMenu];

    [mainMenu addItem: editItem];
```

本来はPhotinoオブジェクトになにかセットされてたらオンにするべきなのだろうが、とりあえずはいつもオンにしておこう。


### guashに組み込む

サンプルでそれっぽくカットとか全選択が動いたのでguashに組み込む。＞起動しない

今回の変更関係なく、カスタムビルドのPhotino.Nativeに対して.NET Callすると落ちているっぽい。

さらに調べると、どうもphotino.Nativeのmainブランチで追加された引数に、photino.NETのdebugブランチの途中のバージョンで対応してあるっぽい…
なんじゃそりゃ。

という事でdebugブランチの途中のコミットから独自ブランチを作った所、無事呼べるようになる。
とりあえず自分のローカルはこれでいいか。

今は凄い開発途中っぽいのでPRとかは作らずにこのdebugブランチとやらがmainになるのを待つか…