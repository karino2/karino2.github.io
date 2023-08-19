---
title: JSDocいいね！
layout: page
---
素のhtmlとJSで書捨てのツールを作っていたら、VSCodeはやけにインテリセンスがちゃんと効くようになっている。
これならなんかgetElementByIdの結果とかもannotationしたいなぁ、と少し調べてみると、JSDocというのでアノテーション出来るらしい。

- [JavaScript Programming with Visual Studio Code](https://code.visualstudio.com/Docs/languages/javascript)
- [Use JSDoc: @type](https://jsdoc.app/tags-type.html)

そうそう、コンパイルとかはしたくないがちょっと手間かけて普段の作業を楽にするくらいのが欲しいと思っていたんだよな、
という事で見てみると、ちょっとJSDocはgetting startedが分かりにくいが、ようするにtypeというので変数の上に指定すれば良さそう。

```javascript
const GE = (id) => { return document.getElementById(id) }

/** @type {HTMLTextAreaElement} */
const jsonArea = GE('jsonarea')
```

おー、インテリセンス効くようになった！
jsonも型をつけよう。

```javascript
/**
 * @typedef TobinQItem
 * @type {object}
 * @property {string} _docId
 * @property {string} title
 * @property {string} _description
 * @property {string} graphId
 * @property {string} _script
 * @property {number} _updatedAt
 */

  /** @type {TobinQItem[]} */
  let json = []
```

おー、効くようになった！いいね！
主要なものにつけてみよう。

```javascript
  /** @type {HTMLTextAreaElement} */
  const jsonArea = GE('jsonarea')
  /** @type {HTMLButtonElement} */
  const loadButton = GE('load-json')
  /** @type {HTMLButtonElement} */
  const submitButton = GE('submit-button')
  /** @type {HTMLSelectElement} */
  const tselect = GE('title-selector')
  /** @type {HTMLTextAreaElement} */
  const descArea = GE('desc-area')
  /** @type {HTMLTextAreaElement} */
  const sourceArea = GE('source-area')
  /** @type {HTMLInputElement} */
  const titleInput = GE('title')
  /** @type {HTMLInputElement} */
  const graphInput = GE('graphId')
```

うーん、ちょっと野暮ったさはあるが、最初にgetElementByIdする所は一度書いたらどうせ見ないのでいいか。

いやぁ、JSはだいぶ良くなってきたよなぁ。
[MDN Web Docs](https://developer.mozilla.org/en-US/)もめっちゃ良く書けているし、
これだけばっちりインテリセンス効くなら、スクリプト系の雑用もnodeでいいのでは、という気分になってくるな。

野暮ったさを思うとスクリプトの雑用にはTypeScriptがいいとかいう事もあるかもなぁ。
ちょっと覚えてみるか？