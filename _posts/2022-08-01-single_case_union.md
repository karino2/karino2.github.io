---
title: F#のSingle case union入門
layout: page
---
[fsharp-lesson](https://karino2.github.io/fsharp-lesson/)でF#を書かせていた所、やっている人が二人ともSingle case unionで少し混乱しているようだった。
確かにシンタックス的にややこしいので、
そういう入門的な解説を軽くしておきたい。

## この記事の目的

まず以下のサイトにはSingle case unionについての解説が書いてあって、これは十分に良く書けている。

[Single case union types · F# for Fun and Profit](https://swlaschin.gitbooks.io/fsharpforfunandprofit/content/posts/designing-with-types-single-case-dus.html)

今回書く記事は、上記リンク先になにか追加の情報を足すものでは無い。
それよりも、上記の記事を理解する為の補助輪のようなものを意図している。
特にシンタックスの周りのややこしさを解説したいと思っている。

## まずはdiscriminated unionの復習から

F#にはdiscriminated union型というのがある。
２つの型のorを表す型。

例えば以下のようなもの。

```
type IntOrBool = 
  | I of int
  | B of bool
```

この時、IntOrBoolが新しい型となる。
そしてIとBはcase identifierと呼ばれるもので、
この型の変数は、この２つのcaseのどちらかである事が保証される。

このcase identifierには２つの役割がある

1. IntOrBoolの型の値を作るコンストラクタ
2. パターンマッチの識別子

このうち、1が混乱のもととなるので、ここでもう少し詳しく見ておく。

例えば以下のようなコードがあるとする。

```
let a = I 3
```

この時、aの型は「IntOrBool型」となる。
ここは混乱しやすい事なので特筆すべきポイント。
Iは型では無い。型はIntOrBool。

IはIntOrBool型の値を作る為のコンストラクタとしての役割を持つ。
Iは型じゃない、というのが重要なポイントなので良く良く注意しておく事。

Discriminated unionより詳しい説明については以下を参照の事。

- [Discriminated Unions - F# - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/fsharp/language-reference/discriminated-unions)
- [Discriminated Unions · F# for Fun and Profit](https://swlaschin.gitbooks.io/fsharpforfunandprofit/content/posts/discriminated-unions.html)

## Single case union入門

Single case uninとは、case identifierが一つしか無いDiscriminated Uninの事。
先程の例から一つだけを残すと、例えば以下となる。

```
type IntOrBool = 
  | I of int
```

IntOrBoolといいつつintでしか無い型になってしまったが、とにかくこれがSingle case union。
一つだけならわざわざ改行する必要も無いので以下のようにも書けるし、普通こう書く。

```
type IntOrBool = I of int
```

さて、この一つのケースしか無いunion型というものにどういう意味があるのだろうか？
それは、同じprimitive型の違う使われ方を、型チェックで識別出来る、という所にある。

例えば以下みたいなレコード型を考える。

```
type Contact = 
    {
    FirstName: string;
    LastName: string;

    EmailAddress: string;
    }
```


この時、FirstNameの型はstringで、EmailAddressもstringとなるが、たとえば以下のような関数があった時、

```
let emailDomain (address:string) = address.Split("@")[1]

emailDomain "hogeika2@gmail.com"
> gmail.com
```

以下のようなコードは間違いのはずだ。

```
let contast : Contact = ...
emailDomain contact.FirstName
```

だが、型としてはstring型なので、これが通ってしまう。

こういう時にEmailAddressを、中身はstring型だが専用の型として作り、この型以外のstringを入れようとしたらコンパイルエラーになるようにするのに、Single case unionは使われる。

```
type EmailAddress = E of string

type Contact =
   {
    FirstName: string;
    LastName: string;
    EmailAddress: EmailAddress
   }

let emailDomain (address:EmailAddress) = ...

emailDmain contact.FirstName # 今度はコンパイルエラー
```

これがSingle case unionの使われ方です。
primitive型しか情報を持たないのだが型として特別なものにしたい、という時に使われるのがSingle case union。
さらなるご利益などは冒頭のfun and profitのリンク先を読んでみてください。

この文書ではシンタックス的なややこしさについて以下に解説を加えたいと思います。

## Single case unionのコンベンションとややこしい所

Single case unionでは、case identifierになんて名前をつけるか悩ましい事が多い。
通常のUnionでは例えば、

```
type Shape =
    | Rectangle of width : float * length : float
    | Circle of radius : float
```

などのように、それぞれのケースが何を表すのか、という名前をつければ良い。
だが、Single case unionは型の名前と同じなので、良い名前がつけづらい。

```
type EmailAddress = （ここに何をつけるべき？） of string
```

という事で、Single case unionの時は、case identifierと型名に同じものを使う、というコンベンションに従う事が多い。

```
type EmailAddress = EmailAddress of string
```

この左と右では役割が違っています。ちょっとこのままだと解説しづらいので、以下のように1と2を便宜のためにつけると、

```
type EmailAddress1 = EmailAddress2 of string
```

EmailAddress1は型の名前です。
EmailAddress2はcase identifierで、これには２つの役割があります。

1. EmailAddress1型の値を作る為のコンストラクタ
2. パターンマッチの識別子

このように役割の違うEmailAddress1とEmailAddress2に同じ名前をつけるのは凄く混乱を招くのですが、
EmailAddress2に良い名前を考えるのが面倒なので広く受け入れられています。
ややこしいけれど、慣れれば困らない。

だけどこの２つの違いは区別しておく必要がある。例えば、以下のようなコードを見たら、

```
let a = EmailAddress2 "hogeika2@gmail.com"
```

aの型はEmailAddress1であって、EmailAddress2では無い、という事は理解している必要がある。

## まとめ

- Single case unionはcaseが一つしか無いDiscriminated unionである
- コンベンションとして、型名とcase identifierを同じものにする事になっている
- けれどコードの中では両者の違いは理解出来ている必要がある

## おまけ： Single case unionからどうやって値を取り出すの？

matchで取れるのは分かるとして、毎回そんな事やるの？というとそんな事はやらない。

match以外での取り出す方法としては、

1. letで取り出す
2. 関数の引数の所でパターンマッチ

の２つをおさえておけばいいんじゃないか。

### letで取り出す例

```
let email = EmailAddress "hogeika2@gmail.com"

let (EmailAddress content) = email

content
```

このようにletの左辺でパターンマッチで取り出す事が出来る。
ちょっと野暮ったいけどとりあえずこれさえ知っておけば基本的には困らない。

### 関数の引数で取り出す例

letさえ知っておけば困る事は無いだろうけれど、実際はもっと簡単に済ませられる事は多い。

だいたいは、関数の引数で取り出してしまう方が簡単だし、出番も多い。
例えば以下のようなコード。

```
let email = EmailAddress "hogeika2@gmail.com"

let someFunc (EmailAddress content) =
    content + "hogehoge"
```

このように、someFuncという関数の引数の所でパターンマッチで中を取り出せる。