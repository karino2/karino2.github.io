---
title: Android Qから、contentResolverのopenOutputStreamがtruncateされなくなっている
layout: page
---
以下のような感じでcontentResolverのopenOputputStreamを使っていると、

```
contentResolver.openOutputStream(file.uri).use {
    ...
}
```

Android Qからはtruncateされなくなった模様。

[issue tracker: [Android Q Beta] Save file by ContentResolver work not working properly](https://issuetracker.google.com/issues/135714729)

ドキュメントには書かれていないが、tというオプションが新たに追加になっていて、`"wt"`と指定するのが正しいらしい。
これを直さない理由もドキュメントがいつまでもアップデートされない理由も謎というか、ちょっと酷い気はする。