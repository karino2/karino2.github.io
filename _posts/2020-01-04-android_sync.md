---
title: Androidアプリでは通信をsync的に作ろう
layout: page
---

Androidでは通信周りを普通に作ると、いろいろと問題が出てくる事が多い。
その解決策としてsync的な構造にする方が良いと自分は思っている。

その辺の事について簡単に書いておきたい。

以下の話は多くのケースに当てはまるが、簡単のためtwitterアプリのような、テキストを書いて送信する、というものを考えよう。

### 一見すると普通の作り方とその問題点

まず送信するテキストを書くActivityを考えよう。EditTextがあって、送信ボタンのようなもの（ActionBarだろうがどちらでも良い）を作り、
それをタップされたら書かれているテキストを送信する、というActivityだ。

普通に考えると、タップされた時のイベントハンドラでHttpのPostリクエストを出す、というのが自然に思えるが、これはいろいろ問題がある。

まず、通信がエラーになった時にどうすべきかが自明では無い。
モバイルのアプリにおいて、通信はエラーになる事がある。
電車の中とか混んでいる時間帯とかいろいろな事情でエラーになりうる。
エラーのケースは最初からどうすべきか、プログラムの構造の時点で考えるべきだが、
このコールバックの中でリクエストを発行する、という構造だと、エラーの時にどうリカバリーするかと正常のケースで大きくコードが変わってしまう。

また、リクエストを発行してから戻ってくるまでの間にActivityが終了するケースも扱いづらい。
リクエストに時間がかかる時に、ユーザーはpostが終わったら次の事をすぐに始める事は多い。
例えば動画を見ていて、ちょっと感想をつぶやいてまたすぐ動画に戻る、みたいな時。
こういう時に送信が終わるまでバックしてはいけない、というのは良くない。

同様の理由で、リクエストを発行してから戻ってくるまでの間にActivityがリサイクルされるケースも考える必要がある。
ホームボタンでアプリを切り替えて違う事をする、というのは一般的だ。
この時に、送信の途中でアプリが殺された結果送信されないのはある程度仕方がないが、
送信するつもりだったデータが失われてしまっては良くない。
また、なるべくアプリは殺されない方が望ましい。

### sync的に作るという事の説明

ネットワークの通信に対応するSQLiteのテーブルを作る。コマンドテーブルと呼ぶ事にしよう。

EditのActivityからは、通信に必要な事をこのテーブルに入れて、syncをキックしてActivity自体を終える。
この時に送信が終わるまでブロックする、というのはAndroid的で無い。
UIはブロックせずに次の動作を行えるようにしておく方がUX的にも良いし、最終的にはバグも少ない。

syncは立ち上がると、コマンドテーブルを見て、入っているコマンドを順番に実行していく。
コマンドに対応するリクエストが成功したらコマンドテーブルのエントリを削除し、必要なUIアップデートが行えるようにnotifyする。

送信の場合は別段UIのアップデートはいらないのでnotifyはいらない。
例えばタイムラインのリロードみたいなものの時にはgetリクエストが帰ってきたあとにテーブルに突っ込んでnotifyする事になる。

すべての通信はすべて一旦コマンドテーブルにリクエストに必要なデータを全部突っ込んでsyncをキックする、
という一貫したやり方で行うようにする。getもpostも同様。

### sync的に作る利点

sync的に作ると、すべてのリクエストは一旦コマンドテーブルに必要な引数を入れてから実行されるので、
リクエストが終了せずにActivityがリサイクルされても再開する事が出来る。
同じリクエストが二回行ってしまう可能性はあるが、これは原理的に防げないのでサーバー側が弾くべきだし普通は弾く。
何より、エラーの時にはユーザーが入力したデータが消えてしまうのが一番の問題で、2回投稿されてしまってユーザーが手動で削除するのは書いたはずのテキストが消えるよりは良い。
投稿失敗でデータが消えるのはモバイルアプリとしてはとても良くない。

また、syncをServiceにしておけば、リクエストの途中でユーザーがアプリを切り替えてプロセスが殺されたとしても、
あとで暇になった時にプロセスが生き返ってServiceを再実行してくれる（AndroidのServiceの仕組み）。
だからユーザーがアプリを切り替えて違う事をやっている間に、そのうちすべてのリクエストが裏で終了される。
これはネットワークが遅い時やリクエストが大きなデータを送るなどの場合にユーザーの期待する動作だろう。
また、ActivityよりServiceの方が裏に行った時に殺されにくいので、そういう点でも通信はServiceにしておくメリットはある。

通信がエラーになっても、コマンドテーブルからエントリを削除しないだけで良い。
あとで通信が回復したあとに何らかの方法でユーザーがsyncを再開すれば、
正常系と全く同じフローで送信が行われる。
電車の中で使っていて偶然トンネルの中を通ったり混んでる時間でSIMがつながらないといった一時的なネットワークエラーにも、適切に対応出来る。

また、最初から「リクエストを飛ばしてから帰ってくるまでの間の状態」というのが明示的にプログラミングに現れる。
これは非同期プログラミングをバグなく行う為にとても重要な事で、
sync的に作っても作らなくても必要な事だ。
これが自然に強制されるのがすべてをsync的に作るメリットである。

従来の、まずActivityからリクエストを飛ばすコードを書いて、間のキャンセルとかエラーの処理をアドホックに追加していく方法と比較すると、最初からエラーのケースに対応が自然に行えて、
しかも最終的にはアドホックに追加していったコードよりも最初からsync的に書く方がシンプルになる。

自分の経験上、アドホックにエラーの処理を足していくのは抜けも多いし全部バグ無く書くのはかなり大変。
Androidのアプリ開発の経験が浅い人が思う以上にこの処理は大変なので、
最初からsync的に全部を揃えて書く方が良い。
通信の構造を最初からActivityのライフサイクルを意識したものにしておくほうが良い、というのが自分の結論。

### 実例

少し探した所、公開しているコードでサービス化しているのが無かったが、Syncの構造自体はOpenEibunpouがそうなっている。

- [OpenEibunpou/QuestionActivity.java at master · karino2/OpenEibunpou](https://github.com/karino2/OpenEibunpou/blob/master/app/src/main/java/com/livejournal/karino2/openeibunpou/QuestionActivity.java)
- [OpenEibunpou/Sync.java at master · karino2/OpenEibunpou](https://github.com/karino2/OpenEibunpou/blob/master/app/src/main/java/com/livejournal/karino2/openeibunpou/Sync.java)

### まとめ

Androidのアプリでは、通信は最初からsync的な構造で作る方が良い。