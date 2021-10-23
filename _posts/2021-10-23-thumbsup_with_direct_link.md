---
title: thumbsupで各画像へのリンクを貼れるようにする
layout: page
---
PngNoteのノートを公開するのに使っている[gautamkrishnar/github-pages-gallery](https://github.com/gautamkrishnar/github-pages-gallery)で、各ページにリンクが貼りたくなったので調べて作業した。
画像自体へのリンクは貼れるのだが、「16ページから19ページに該当するノートがある」みたいな時にはギャラリーを16ページを選ばれた状態で開きたい。

github pages galleryは、[thumbsup · Static gallery generator](https://thumbsup.github.io/)というのを使って[sachinchoolur/lightGallery](https://github.com/sachinchoolur/lightGallery)というjsライブラリを使ったページを生成する。
このlightGalleryにはhashというプラグインがあって、それを有効にすると各ページへのurlが作れるようになって、このurlを使えば望む挙動をさせられる。
これをthumbsupのテーマで実現する。

### 作業手順

まず普段使っているテーマがcardsなので、[thumbsup/theme-cards: Thumbsup cards theme](https://github.com/thumbsup/theme-cards)をダウンロード。
themeというフォルダをほってそこに展開したtheme下を置く。

次にalbum.hbsで、

```
    <!-- LightGallery -->
    <script src="{{relative 'public/lightgallery/js/lightgallery-all.min.js'}}"></script>
    <script src="{{relative 'public/lightgallery/js/lg-exif.min.js'}}"></script>
```

となっている所にlg-hashを追加する。

```
    <!-- LightGallery -->
    <script src="{{relative 'public/lightgallery/js/lightgallery-all.min.js'}}"></script>
    <script src="{{relative 'public/lightgallery/js/lg-exif.min.js'}}"></script>
    <script src="{{relative 'public/lightgallery/js/lg-hash.min.js'}}"></script>
```

最後にconfig.jsonで

```
{
...
  "theme": "cards",
...
}
```

となっている所を、

```
{
...
  "theme-path": "./theme",
...
}
```

とtheme-pathに変更すれば良い。

ドキュメントにはlightGallery呼び出しの所でpluginsのプロパティを追加する必要があると書いてあるが、どうもこれは古い情報っぽくて、
現在はscriptタグを追加するだけでプラグインは有効になっている模様。

参考: [RandomThoughts/GithubPagesGallery](https://karino2.github.io/RandomThoughts/GithubPagesGallery)