---
title: キーワードとしてのtemplate（dot template）
layout: page
---
Halideのコードを読んでいたら、以下のような行に突き当たった。

```
    op = result.template as<LetOrLetStmt>();
```

templateというメンバがある訳でもなさそうだし、あったとしてもシンタックス的におかしいよな、
と思っていたところ、以下のStackoverflowに当たる。

[Stackovderflow: .template (dot-template) construction usage](https://stackoverflow.com/questions/8463368/template-dot-template-construction-usage)

dot templateというのはわかりやすい名前なのでduplicateフラグついてしまっているが残ってほしいものだ。

で、これはtypenameと同じような形として、テンプレート越しにメンバのテンプレート関数を呼ぶ時に、
それがテンプレート関数だという事を示す為につけるキーワードの模様。
そんなのあったっけ？とThe C++ Programming Languageのrev 4を見ているが、Indexからは探せない。
でもtypenameのあたりにさらっと言及があった。26.3.1のDependent Namesの最後、p748のあたり。

以下のサンプルコードが書いてあって、これが十分にわかりやすい。

```
class Pool { // some allocator
public:
  template<typename T> T∗ get();
  template<typename T> void release(T∗);
  // ...
};

template<typename Alloc> void f(Alloc& all)
{
  int∗ p1 = all.get<int>();   // syntax error: get is assumed to name a non-template
  int∗ p2 = all.template get<int>(); // OK: get() is assumed to be a template
}
```

`all.get`という記述は、allの実体が分からないからテンプレート関数かどうか分からないので、
getというメンバ変数との大小比較と区別がつけられない訳だな。

うーん、C++。

こういうのって一度読んでも、しばらく時間が経つとすぐ忘れちゃうのでブログにしておく。