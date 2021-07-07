---
title: 瞬間音声メモアプリ、「いつなに」、リリース！
layout: page
---
2年前くらいに作って個人的には使っていた「いつなに」だけど、なかなか便利だし普通の人でも使えるくらいには出来てきたのでリリースする事にしました。
「いつ」「なに」をしたのかをメモするアプリ、「いつなに」です。

[Google Play: いつなに](https://play.google.com/store/apps/details?id=io.github.karino2.itsunani)

コンセプトとしては、立ったままとかでなるべくハンズフリーに一言のメモを取る、というものです。
確認は取らずにとりあえずメモして、間違いなどの修正は後からやる、という前提にたって、とにかく一文を簡単に入力出来るように、と考えたUIになっています。
癖はあるけれど、これ以上簡単にはならない、と思うくらいには究極的なUIになっていると思う。

仕様として変わっているのは、保存先をStorage Access Frameworkで選ばせた外部のテキストファイル、という所です。
だから通常のCloud Storage的な仕組みでsyncすればPCとも共有出来る。
しかも追記していくだけなので、先頭の方に解説とかリンクとか書いておいたファイルを指定する事で、マークダウンのメモのシステムに組み込めます。
自分は[TeFWiki](https://karino2.github.io/2021/04/17/tefwiki_ja.html)のファイルの一つを指定して使っています。

今回新しい試みとして、好きな絵師さんにイラストを描いてもらう、というのをやってみました。
きみどりさん([@kani_beam__](https://twitter.com/kani_beam__))にお願いした。

今後はシリーズ物としてきみどりさんに頼んでいってもいいかもなぁ、とか思ってます。

----

### Pixel 3で落ちる

Pixel 3で落ちる、と言われて、ログを見せてもらうと、`RecognizerIntent.getVoiceDetailsIntent(this)`がnullを返す模様。
うーん、なんでか良く分からないけれど、[DroidSpeechのissue #6](https://github.com/vikramezhil/DroidSpeech2.0/issues/6)で同じ症状に対して、[fixのcommit](https://github.com/ronnyporsch/DroidSpeech2.0/commit/f00a70c416e057af7223aaee5c8cc86b1616ace1)で、`Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)`を指定するようにしている。

ドキュメントを読んでもそんな変更があるようには見えないが、真似して自分のコードでは`RecognizerIntent.getVoiceDetailsIntent(this) ?: Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)`と変更してみた。＞認識されなくなった

ソースコードを読むと、`ACTION_WEB_SEARCH`と`ACTION_GET_LANGUAGE_DETAILS`でresolveするので、これのpackage visibility filtering対応が要るんじゃないか？
という事で以下を追加。

```
    <queries>
        <intent>
            <action android:name="android.intent.action.WEB_SEARCH" />
        </intent>
        <intent>
            <action android:name="android.intent.action.GET_LANGUAGE_DETAILS" />
        </intent>
    </queries>
```

これで無事動いた。うーん、これ、ドキュメントに書いておいてくれないと、中でなんのintent使ってるかなんて知らないよなぁ。