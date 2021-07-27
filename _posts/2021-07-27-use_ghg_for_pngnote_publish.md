---
title: PngNoteのノートの公開にはGithub Pages Galleryを使う事にした
layout: page
---
The Secret of Lifeのノートは自作アプリ、[PngNote for BOOX](https://karino2.github.io/2021/07/23/pngnote_for_boox.html)でテストがてら取っている。
これはフォルダにpngの生データが連番で入る、というもの。

これをブログで公開したいなぁ、と思って良い方法が無いかいろいろ考えた結果、[github: gautamkrishnar/github-pages-gallery](https://github.com/gautamkrishnar/github-pages-gallery/)を使う事にした。

- [karino2's Image Gallery](https://karino2.github.io/ImageGallery/)
   - [The Secret of Lifeのノート](https://karino2.github.io/ImageGallery/TheSecretOfLife_PngNote.html) 

最初は端末間の共有に使っているGoogle Driveのフォルダをそのまま共有すればいいか？と思ったのだが、
Google Driveは整理とかでフォルダ移動したりいろいろしたい。この時にいちいちリンクが有効かとか考えたくないので、
やはりブログ関連はGoogle Driveとは別管理がいいな、と結論づける。
そうするとgithubのどこかだろうな、と思った。

最初はブログの適当なブランチにpushしたらActionsで適当なマークダウンでも吐こうかなぁ、
と思っていたが、いまいちやる気が出ない。
もうちょっと手抜きで、画像の一覧が順番に見れればいいんだよなぁ、とググっていたが、手頃なのが無い。
別に本格的なヤツでも楽ならいいか、と心を入れ替えて（？）、上記のリンクのヤツを試してみたら、
意外と始めるのに手間は無い割に出来上がったページはいい感じなので、
レポジトリは別になったがこれでいいや、という気になった。

やはり公開するかどうかはgitのpushで明示的に操作する方がいいな、と思う。