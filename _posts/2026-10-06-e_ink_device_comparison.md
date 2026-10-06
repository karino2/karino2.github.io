---
title: e-inkデバイスの比較メモ
layout: page
---
[BOOX](https://karino2.github.io/RandomThoughts/BOOX)のNote3が昨晩画面が明るい部分と暗い部分がしましまになってしまった。
見えてはいるのだが。
あけようとしたら表のプラスティックにヒビが入ってしまった。
うーん、寿命かなぁ。

という事で検討した事のメモなどを書いておく。

## 主な用途は手書きのノート

BOOXの今の奴には後で述べるようにちょっと不満があったので、
そもそもe-ink無しに出来ないかな？と考えてみた所、
やはり無理だ、という結論になった話を最初に書く。

まず普段図書館に行く時には、[LenovoTabP12](https://karino2.github.io/RandomThoughts/LenovoTabP12)とBOOXの2台持ちで行っている。
そして本を読みながら[PngNote](https://karino2.github.io/RandomThoughts/PngNote)で手書きメモを書きつつ、息抜きに[Rhinocs](https://karino2.github.io/RandomThoughts/Rhinocs)でブログやWikiなどを書いている。

このうち、文章入力に関しては現時点の用途ならe-inkでなくてもいい。
ただし将来的に砂浜とかで文章を入力するならe-inkにしたい。

pdfや電子書籍は画面の大きさや手書きノートとの対応から最近はLenovo Tab P12（液晶のタブレット）で読むので、
e-inkデバイスでは読んでいない。

究極的には手書きノートが唯一の差し替えられない用途という結論になった。

そして手書きに関しては[KindleFireMax](https://karino2.github.io/RandomThoughts/KindleFireMax)とiPad ProのApple Pencilが手持ちにあるが、
どちらもこの用途には不満が多く、やはりe-inkの手書きノートは欲しいという結論になる。

## いろいろなデバイス検討

以下に検討したデバイスのメモをのせる。

### BOOX Go 10.3 Gen II

値段はフロントライトありの方で 79800円。無しだと77800円。

[BOOX Go10 Gen2 – SKT株式会社](https://sktgroup.co.jp/boox-go10-gen2/)

Note 3の乗り換えとして一番似たスペックなのはGo 10.3 Gen IIになると思うのだが、
スタイラスがInkSense plusとかいうもので、これはだいぶ書き味が普通のタブレットっぽくなってしまうらしい。

一番の用途が手書きノートなのにそれはどうなの！？

重量は360g。

### BOOX Note Max 13.3インチ

Note3と同じスタイラスのモノクロモデルだと、13インチのものがある。

値段は97800円でフロントライト無し。楽天だとポイントが1.3万ポイントちょっとつくので8.5万くらいか。

- [BOOX NoteMax – SKT株式会社](https://sktgroup.co.jp/boox-notemax/)
- [BOOX NoteMax 13インチ電子ペーパーディスプレイ搭載 Androidタブレット – SKTNETSHOP](https://sktnetshop.com/products/boox-notemax)


フロントライトが無いのはスタイラスが近く見えていいというレビューもあるし、
自分の今の用途だとあまりフロントライトはいらないので別にいいかな、という気はしている。

- 13.3
- 3200 x 2400
- 3700mAh
- 重量は615g。

重い！Lenovo Tab P12と同じくらい重い！

13インチはちょっとでかいなぁ、という思いもある。Tab P12が12.7インチで結構でかいなぁ、と思っているので。
この大きさだと普通のスマホスタンドでは縦には立てかけられないので、文章打つ用途だとすこし無駄な感じはある。

ただノートとしてはでかい方がいい部分もあるので試してみたい気持ちもある。

どうせならこれを試してみてもいいのでは？という気持ちはある。

レビューを見ていたら、バッテリの保ちがかなり悪いらしい。うーん、それは残念だなぁ。

今の所このNote Maxか次のNote Air 6Cのどちらかかな〜と思っている。

### BOOX Note Air 6C 10.3インチ

- [NoteAir6C – SKT株式会社](https://sktgroup.co.jp/noteair6c/)

9万6800円。楽天だとポイントが5000ポイントくらい。

カラーはあまり評判良くないのでモノクロを前提に探していたが、別にモノクロで使えばいいのでは？と思い考え直してみると悪くない。


- 10.3
- 2480 x 1860 モノクロ 1240 x 930　カラー
- 3700mAh
- 440g。ちょっと重い。

microSDがつくのはちょっといいね。

値段はNotMaxとそんなに変わらない。そしてノート目的ならカラーもアリかもしれない。

バッテリサイズが小さいな。でもバッテリの保ちは並か。

[Boox Note Air 5C: The Final Verdict - YouTube](https://www.youtube.com/watch?v=vPRuY6NVNkY)

### Supernote Manta 

- [Supernote Manta – Supernote Japan](https://supernote.jp/pages/supernote-a5-x2-manta)

77000円。カバーもつけると85960円。

- 10.7
- 300 ppi
- 375g
- フロントライト無し
- 3600mAh

Note Air　6Cと比較すると画面がすこし大きく重さがすこし軽く、値段が安い。カラーを気にしないならこっちの方がいいかも？

アプリ開発はlow latencyはプラグインとして作ったものだけで、これはReactNativeでTypeScript。
けれどAndroidのネイティブAPIが呼べるっぽい。
もう少し調べたらプラグインでもlow latencyでスタイラスは処理出来ない！駄目じゃん！

以下でもlow latency系は解析されてなさそう。

[GoVed/OpenInkBridge](https://github.com/GoVed/OpenInkBridge)

惜しいなぁ。

ただノートアプリのプラグインで次のページを表示しておく、とかは出来そうなので、半ページずらし相当の機能は作れるか？
これで頑張るのもありかもなぁ。

と思ったら、さっき動いてそうなデモが！

[Monopaint - a new painting app I made for Supernotes : r/Supernote](https://www.reddit.com/r/Supernote/comments/1wx3wlc/monopaint_a_new_painting_app_i_made_for_supernotes/)

コードを見たが/dev/ebcを開いてioctlしてmmapしたりしている。だいぶ解析出来てそうだ。

元はこれだって。へー。

[YoramDevGH/AnimInk: Offline frame-by-frame animation for the Supernote Nomad e-ink tablet](https://github.com/YoramDevGH/AnimInk)

いいのでは？これにしよう。

redditは良く見るのでリンクを貼っておこう。

[reddit r/Supernote](https://www.reddit.com/r/Supernote/)

### ViWoods AI Paper 10.65インチ

75800円。

[Amazon - VIWOODS AiPaper 10.65インチ AI電子ノートセット 電子ペーパータブレット 4.5mm薄型 - PDF書き込み・会議メモ・日程管理。文字化、300PPI、4.5mm/370gで専門家・学生の資料整理を効率化。 - VIWOODS - 電子書籍リーダー 通販](https://www.amazon.co.jp/dp/B0FNRLQGY1?th=1)

スペック的にはかなりNote3に近くて、Goよりはこっちの方がいいか？と思ったし、
Androidベースだがスタイラス周りもlow latency的なAPIはありそうなのでPngNoteを対応させるのは出来そうだった。

だが半年前くらいにファームのアップデートでadbをブロックしたらしく、解除方法はありそうだがそういう野良デベロッパーに優しくないデバイスは嫌だな〜と思っている。
adbがそのままサポートされていたらこれにしたんだが。

### HUAWEI MetaPad 10.3

[amazon: HUAWEI MatePad Paper 10.3インチ](https://link.amazon/B0jdUf821)

ちょっと古いがまだ売ってる。5万円。

割と安い。HarmonyOS2らしく、これはAOSPと併用、次のNextは完全別物らしい。今から開発するのはな〜。

- 10.3インチ
- 360g

### QUADERNO A4 Gen 3C

[QUADERNO A4 Gen 3C](https://www.fmv.com/store/p/note/electronic_paper/fmvdp43ca4)

8万円くらい。

- 13.3インチ
- 1650✕2200 (低め)
- 368g！軽い！

ただ保存結果はpdfでPCとの共有も独自アプリとか。これはいまいち。
あとカラーの画面は評判が悪めだなぁ。

Amazonに白黒があった。

[Amazon.co.jp: 【公式】富士通 10.3型フレキシブル電子ペーパー QUADERNO A5サイズ / FMVDP51 ホワイト : 文房具・オフィス用品](https://www.amazon.co.jp/dp/B09989LKD4?th=1&linkCode=ll2&tag=karino203-22&linkId=d4a4c60e9ba5ec3181527c22ca222324&ref_=as_li_ss_tl)

軽いのはいいけれど、バッテリの保ちが意外と悪いらしいな。

### Kobo Elipsa 2E

Kobo Elipsa 2Eは10.3インチで54800円。
保存はexportっぽくなりそうだがフォーマットはいろいろ選べる感じ。

export周りは以下の記事が概要を把握するには良い。

[【レビュー】Kindle Scribe、Kobo Elipsa、BOOX Tab Ultraの「手書きノート機能」を比較する - PC Watch](https://pc.watch.impress.co.jp/docs/topic/review/1474204.html)

ちょっと微妙だが、値段は安いよなぁ。

- 10.3インチ 1872×1404
- 383g

重さもまぁまぁ。
転送を妥協すれば一番良いかもしれない。

バッテリの保ちは微妙だな。

[Kobo Elipsa 2E - Battery Life, Pixel Density Test, and More - YouTube](https://www.youtube.com/watch?v=X2yOKg4GnUY)

### Kindle Scribe フロントライト無し 11インチ

フロントライト無しのモデルが73000円。

[New Amazon Kindle Scribe フロントライト非搭載モデル](https://link.amazon/B07LB7nzr)

- 11インチ
- 300 ppi
- 400g

PCとの共有がメールを送ってリンクからPDFをダウンロード、とかいう壊滅的に面倒くさいシステム。
ただバッテリは一番保ちそうだな。重さもサイズを思えばまぁまぁ。

### Movinkpad 11

ふと、movkinkpadとかそれ系はどうだろう？と思い見てみる。

8万円！

[amazon: Wacom MovinkPad 11](https://link.amazon/B01bXGYP3)

あれぇ？こんな高かったっけ？と調べてみると最近大幅値上げしたらしい。
書き味はiPadと比べてもかなり良いという話も聞くので試してみてもいいかと思ったが、8万じゃぁBOOXでいいかなぁ。

ビックカメラにあったので触ってみた。
確かにだいぶいい感じのペンだ。
ちょっと触ったくらいだとほとんど普通に紙と鉛筆で書いているのと同じ感じに見える。

ただいろいろ書いてみるとやはりe-inkのネイティブレンダリング系のダイレクトに書いている気持ちよさみたいなのが薄いな。
デジタルノートとしてはすこし劣るか。

### XPPen Magic Note Pad

同じ流れでXPPenの奴を見てみる。

クーポンで5万円になってる。

[amazon: Magic Note Pad](https://link.amazon/B0ivLtiDK)

そうだよな〜、こんなもんだよなぁ。

- 11インチ
- 1920x1200
- 495g

解像度はNote Air 6Cにだいぶ負けてるな。

安く済ませたいならこの辺かもしれない。書き心地の評価は高いんだよなぁ。

### 候補の検討

- BOOX
  - BOOX Go 10.3 Gen2
    - Note3に一番近くて安いがEMRスタイラスじゃない、充電はかったるい
  - BOOX Note Air 6C
    - EMRスタイラス、白黒としてはほぼNote3の進化版でそこにカラーが使える
  - BOOX NoteMax
    - 13.3インチでEMRスタイラス。デカすぎな気もするがデカい良さはある
- Supernote Manta
  - Go 10.3 Gen2にEMRスタイラスがあればな〜と思うとこれは近い
  - Androidではあるがシステム的なアプリが動いていてその中は割と制約が強い
  - Google Play以外からapkを入れる必要はありそう（電子書籍アプリが動くかは微妙か）
  - Note Air 6Cよりは軽い
- Kobo Elipsa 2E
  - 安い
  - 自分のアプリを諦めれば手書きノート自体は悪くないっぽい
- XPPen Magic Note Pad
  - 安い
  - 単なる液晶タブレットだがスタイラスの評価は高い
  - ちょっと重い

  ちょっと違うの使ってみるかという気分もあり、Supernote Mantaにしようかな、と思っている。＞ポチった！