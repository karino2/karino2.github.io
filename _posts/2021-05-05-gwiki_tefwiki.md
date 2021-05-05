---
title: GitHubのWIkiでTeFWikiの一部を公開する
layout: page
---
TeFWikiには技術系の調査メモとかを結構書いているのだが、これは全く秘匿性が無いので公開して良い。
一方で個人情報の類は公開したくない。

という事で、公開しても良さそうなものを公開する環境を作ってみる。

まずgithubのWikiを用意する。このブログのgithub pagesのレポジトリで良かろう。

[https://github.com/karino2/karino2.github.io/wiki](https://github.com/karino2/karino2.github.io/wiki)

そしてこのファイルの幾つかをハードリンクでTeFWiki下と共有する。向きとしては、TeFWikiの方のファイルをメインにしておく方がWikiNameでへこへこ作れていいだろう。

WikiNameでリンクを貼るにはファイル名は揃えておく方がいいな。Homeだけ別名にしておいて、他は同じファイルとしよう。
リンクを貼るのはguashスクリプトでいいか。guashスクリプトとしては以下。

```
#!/usr/bin/env guash

(cd ~/Google\ ドライブ/DriveText/TeFWiki/; ls -t *.md) | guash_filter "Src file"

RES=$(guash_doquery)

ln  ~/Google\ ドライブ/DriveText/TeFWiki/${RES} ~/work/GitHub/karino2_github_wiki/${RES}
```

現状filterは矢印とEnterで選べないのがだるいな。そのうち直そう。

これでローカルのWikiを公開出来るようになったヽ(´ー｀)ノ

少し試してみたが、これはなかなか良いな。ローカルのWikiを書いて一部を公開。ローテクでいい感じだ。
こういうのがすぐ出来るのはUnix的筋の良さだよなぁ。