---
title: MFG： ドキュメントをVuePressでhtmlとして公開する事にしました
layout: page
---
prism.jsによるシンタックスハイライトを実装したので、公式ドキュメントもシンタックスハイライトに対応したい、
と思い、静的サイトジェネレータでhtmlにする事にしました。

もともといつかはやるつもりだった作業ですが、機は熟した、という事で。

サイトは以下になります。

[MFGのドキュメントのページ - MFGドキュメント](https://karino2.github.io/MFG/ja/)

今までGitHubのレポジトリの方に貼っていたリンクは順次直していく予定。

## サイトジェネレータはVuePressを使う事に

prism.jsがJSなので、サーバーサイドでハイライトするならnode系のサイトジェネレータがいいかな、
と思い、要件をgeminiに伝えた所、VuePressにしとけ、と言われたので試してみました。

ちょこちょこGeminiの言っている事は間違っていたけれど、
mdには特に手を入れる事なくいい感じのサイトは出来たので、満足です。

最近のJSのサイトジェネレータはデフォルトで全部いい感じになって見た目もかっこよくてめっちゃ早くて凄いですね。

## VuePressにprism.jsのカスタムの言語ハイライトを追加する方法

ドキュメントを調べてもいまいち良くわからなかったので、いろいろ試行錯誤しました。
結局、config.jsと同じフォルダに`prism-mfg.js`を置いて、config.jsを以下のようにしました。

```js
import Prism from 'prismjs'
import PrismMfg from './prism-mfg.js'

Prism.languages.mfg = PrismMfg.grammar
```

Prismをimportしていじるとビルド時に使われるPrismが勝手にいじったのになってそうです。

## 国際化とnavbar

ドキュメントにはnavbarはthemeConfigに書け、と書いてあるけれど、書いても有効になりませんでした。（追記：たぶん間違ってv1のドキュメントを見ていたのだと思う、これに限らずv1のドキュメントがググって引っかかって間違って見る事が多かった）

`defaultTheme()` を使っている時にはこれではダメっぽい？これも同じGuideから順番に真似ていった時に書いたものなのだけれど…

どうもdefaultThemeの関数の引数にthemeConfigの中身を置くと動くっぽいです。
国際化も合わせて以下のようになりました。

```js
export default defineUserConfig({
  locales: {
    "/ja/": {
      lang: "ja-JP",
      title: "MFGドキュメント",
      descpription: "MFGのドキュメント"
    },
    "/en/": {
      lang: "en-US",
      title: "MFG Document",
      descrption: "MFG Documentation."
    }
  },
  bundler: viteBundler(),
  theme: defaultTheme({
    locales: {
      "/ja/": {
        navbar: [
          { text: 'Home', link: '/ja/' },
          { text: 'Getting Started', link: '/ja/GettingStarted/' },
          { text: 'Reference', link: '/ja/Reference/' },
        ],
      },
      "/en/": {
        navbar: [
          { text: 'Home', link: '/en/' },
          { text: 'Getting Started', link: '/en/GettingStarted/' },
          { text: 'Reference', link: '/en/Reference/' },
        ],
      }
    }
  }),
})
```

navbar周りは間違っていてもエラーメッセージが出ず、だまって表示されなくなるだけのため、いまいち何が悪くて何が正解かわからないままなんとなく表示されてしまいました。

こういうのを言語ごとに設定出来たり、VuePressはかゆい所に手が届く感じでいいですね。
デフォルトの国際化の振る舞いもとてもエレガント。

## GitHub Actionsでのデプロイ

[公式のドキュメントのDeployingのセクション](https://vuepress.vuejs.org/guide/deployment.html#gitlab-pages)の通りで良かったのだが、
例のごとく間違ってv1の方を見ていて、
そちらは何故かDockerのイメージを使う例が載っていて、
これはACCESS_TOKENとかを発行したりいろいろ面倒が多い。

そこで頑張って自力で書いたが、あとでv2の方のドキュメントに同じ内容が載っていた…

という訳で以下のようになりました。

[MFG/.github/workflows/vuepress-deploy.yml at main · karino2/MFG](https://github.com/karino2/MFG/blob/main/.github/workflows/vuepress-deploy.yml)

まぁいい感じに動いたのでこれでよし。