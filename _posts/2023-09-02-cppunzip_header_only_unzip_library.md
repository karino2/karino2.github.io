---
title: CppUnzip ヘッダーオンリーでzlibだけで動くunzipライブラリを作った
layout: page
---
ちょっとzipをバラす必要が出てきて、zipなんて大抵のシステムで今どきあるだろう、と思ったのだが、C++だと意外と手頃なのが無い。
MacとWindowsとiOSとQtで動けばいいくらいなんだがなぁ。
zlibは割と手軽に使えるのだけれど、zipをバラすのは意外と面倒。

という事でヘッダオンリーでzipをバラしてzlibにしか依存しないライブラリを作りました。CppUnzipと名付けました。

[karino2/cppunzip: Header only unzip library only depend on zlib and STL.](https://github.com/karino2/cppunzip)

zlibが使える環境ならcppunzip.hppをincludeするだけで使えます。
ファイルには書き出さずメモリ上に必要に応じて読み込みます（std::vectorに読み込む）。

## 大雑把な使い方

`cppunzip::File`のインターフェースをUnZipperに渡してlistFilesするとFileEntryのイテレータを返すものが返ってきます。
FileEntryは名前やサイズが分かり、またreadContentメソッドで解凍されたファイルのバイナリがvectorで取り出せます。

Fileのインターフェースはistreamを渡すIStreamFileというクラスも提供されています。

以下READMEのサンプルを引用。

```
#include "cppunzip.hpp"

// ...

  using namespace cppunzip;

  std::ifstream is("test.zip");
  IStreamFile f(is);

  UnZipper unzipper(f);

  for(auto& fileEntry: unzipper.listFiles()) {
    std::string fileName = fileEntry.fileName();

    if (!fileEntry.isDir()) {
      std::vector<uint8_t> content = fileEntry.readContent();
      // use content as you want.
    }
  }
```

Javaとかによくある標準的なインターフェースだと思う。

## 想定している使い方、していない使い方

想定しているのは以下のようなケースです。

- アプリに組み込んでプラグインなど用途が分かっているzipをロードしたい
- いろいろな環境でビルドするので環境ごとにライブラリを入れるようなのは辛い
- 変な使い方をする事もあるので簡単にいじれるような小さなコードが良い

想定していないのは以下のようなケースです。

- メモリに乗らないようなバカでかいファイルを展開する
- ファイルの展開にすごく時間が掛かるのでブロッキングで一気にやられると困るケース
- 変なアーカイバの作った普通じゃないzipファイルも開いて欲しいような、汎用のzipアーカイバのようなものを作るのに使う用途

ようするにアーカイバを作るような用途は想定してません。
それよりはプラグインのような自分たちが作る用途が限定されているzipを開いて使うための用途を考えています。

## 開発動機

C++ではzipを扱うライブラリが幾つかあるのだけれど、ビルドが必要な上に、多くはzlibのcontrib下のminizipのコードを叩く形になっている。
このminizipのコードはいかにもC言語という感じのコードで、パッケージインストーラーで簡単に入る感じでもなく、
unzipのコマンドとして実装されていて、アプリに組み込んで使うコードという感じにもなっていない。
zlibは簡単に使えるのにこれはいかにも大げさであまりメンテナンスをしたいとも思えない形態だった。

一方でzlib自体は大抵の環境にはもとから入っているか簡単に入れられるので、zlibへの依存くらいはあってもいい。

昔、無圧縮zipをバラすコードは書いた事があって大したこと無い事は知っていたので、自分で書こうと思った。
作る前にググっていた段階で結構Stackoverflowなどで同じようなのを求めている人はそれなりに見かけたので、
オープンソースとして公開する事にした。