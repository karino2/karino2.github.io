---
title: Eventscountのメモ
layout: page
---
またまた[1024cores - Eventcounts](https://www.1024cores.net/home/lock-free-algorithms/eventcounts)が全然わからんのでメモ。

わからないというより、これはリンクがデッドリンクで実装が無い。

以下が移転先か？ [Eventcount (gate) proposal - Intel Community](https://community.intel.com/t5/Intel-oneAPI-Threading-Building/Eventcount-gate-proposal/m-p/888095)

でも解説が無いので何をやっているのかわからない。という事でメモをしつつ解読を頑張る。

## 単なるセマフォでなぜうまく行かないかを考える

やりたい事はcondition variableのような事で、実装にはセマフォが使われている。
例えばロックフリーなキュー、LFQueueがあったとしよう。で、Semaphoreがあったとする。

Eventscountとか使わずに単にセマフォで同じような事をやりたいとする。
型は適当でコードも適当。

単にセマフォを使うと、一番何も考えなければ以下みたいな実装になる。

```
struct WaitableLFQueue
{
  Semaphore _sem;
  LFQueue _queue;

  void Push( Item* item ) {
    _queue.push( item );
    _sem.post();
  }

  Item* Pop() {
    _sem.wait();
    return _queue.pop();
  }

};
```

これなら当然Popの時にセマフォから返ってくれば、アイテムがあるって事なのでpop出来る。それはいい。

けれど本当にやりたいのは

- Pushはまっている人が居なければロックしたくない
- Popは既に詰まっていたらロックしたくない

という事だろう。
そのためのlock freeなキューだ。

という事で、Pop側は気分的には以下のような事をやりたい。

```
  Item* Pop() {
    Item* item = _queue.pop();
    if (item != nullptr)
      return item;
    _sem.wait();
    return _queue.pop();
  }
```

ようするにpop出来ない時だけwaitしたい。
でもこれでは、_semのwaitの回数とアイテムのpopの回数が一致しないので、Pushの側でpostした個数と対応関係が取れてない。

だからダメ。

でも気分的にはこういう感じで、

- アイテムがLock freeに取れたらブロックしない
- アイテムがnullだったらブロックして待つ

という事がやりたい。

## 使う側のコードを見る

で、使う側の解決策としては以下と書いてある。

```
  Item* Pop() {
    Item* item = _queue.pop();
    if (item != null)
      return item;

    for(;;) {
      _ec.prepare_wait();

      item = _queue.pop();
      if( item != nullptr ) {
        _ec.cancel_wait();
        return item;
      }

      _ec.commit_wait();
      item = _queue.pop();
      if( item != nullptr ) {
        return item;
      }
    }
  }
```

ようするに、

1. prepare_waitする
2. もう一回条件を確かめる
  - 条件を満たしていたらcancel_waitしてreturn
  - 条件を満たしていなかったらcommit_waitで待つ

という感じになっている。
ちなみにPushの側は何も考えずにnotifyを呼んでいるように見える。

```
  void Push(Item* item) {
    _queue.push(item);
    _ec.notify();
  }
```

ここでは待っている人がいるかどうかとかは気にしているようには見えない。

ただ気分的には、

- prepare waitかwaitしていなければ何もしない
- 待っている人が居たら`_sem.post()`する

みたいな事をしたい。このpostとwaitの対応関係がちゃんと取れている、という事を保証したい訳だな。

たぶんポイントなのはprepare_waitした後にcancelする場合がある、って事だと思うが、その辺を踏まえてコードをみたい。

## 注意すべきタイミングを考える

スレッドAが以下のイベントを順番に行い、

- A-1: prepare
- A-2: predをチェック
  - A-3-1: cancel
  - A-3-2: commit_wait

スレッドBが、以下を順番に行う。

- B-1: push
- B-2: notify

どういう場合がありえるだろうか？

### B-1とA-2の前後関係を考える

まず、B-1とA-2の前後関係を考えてみたい。つまりA-1は先に起きているケース。

B-1が先に行われてA-2が後に行われると、predは成功するからA-3-1に進む。
この時にB-2とA-3-1の間の順番を考える。

- ケース1: B-2が先でA-3-1が後の場合＞prepareはされててcancelはされてない状態のnotifyとなる。
- ケース2: B-2が後でA-3-1が先の場合＞キャンセルされた後にnotifyが呼ばれる（たぶんprepareされる前のnotifyと一緒で、これは何もしないのが期待値）

次にB-1が後に行われてA-2が先に行われるケースを考えると、A-2のpredは失敗するのでA-3-2に進む。
この場合は、おそらくB-1が行われるかどうかはもう重要じゃないので、B-2との前後を考えるのがいいんだろう。

- ケース3: A-3-2が先、B-2が後のケース＞普通に`_sem.wait()`と`_sem.post()`の対が行われるのだろう
- ケース4: A-3-2が後、B-2が先のケース＞prepareはされているが、waitはされてない状態でnotifyが呼ばれる

ケース4とケース1は、notifyの側からは区別出来ないので、どちらでも良いような処理が行われるのだろう。
普通に考えれば`_sem.post()`を呼べば良いか？prepareより後ならnotifyはいつでもpostを呼べば良い、という風に出来ないだろうか？
どうせキャンセルかコミットはされるので、ここでwaitを呼べばいいんじゃないか。

### A-1がB2より後に起こるケース

他に気になるケースとしては、A-1よりも前にB-2が呼ばれるケースだ。この場合はB側ではセマフォはいじらないんじゃないか。
となると、A-1＞A-2＞A-3-1のパスは、セマフォをいつもdecrementすればいいとは言えないな。

ただこのケースだと必ずA-3-1に行く。A-3-2には行かない。逆に言うと、A-3-2に行ったならA-1がB2よりも前と思って良いはず。

### 複数スレッドを考えるとややこしくなるか？

２つのスレッドならこの調子で全部考えられる気がするが、複数スレッドが入るともっとややこしい気がする。
寝ている人向けにnotifyしようとしても、横からqueueの中身をかっさらっていく人がいる場合もあって、
この場合はprepareもしないんじゃないか？

起きたけど中が空だった、は、もう一回待てば良いような気もするが、この時にセマフォのカウントの対応関係があっている必要がある。

ただ起きたらまたprepareから始めるので、無かった時と同じ対応となるのでうまくいくような気もする。
この辺はちょっと完全に確信が持ててる訳でも無いけれど、まぁいいだろう。

## 実装を眺める

[Eventcount (gate) proposal - Intel Community](https://community.intel.com/t5/Intel-oneAPI-Threading-Building/Eventcount-gate-proposal/m-p/888095)で、上記の疑問を考えつつ見てみる。

まずprepare_waitを見ると以下。

```
    void prepare_wait(void* ctx = 0)
    {
        ec_thread* th = ec_thread::current();
        // this is good place to pump previous spurious wakeup
        if (th->spurious_)
        {
            th->spurious_ = false;
            th->sema_.wait();
        }
        th->in_waitset_ = true;
        th->ctx_ = ctx;
        {
            lock l (mtx_);
            th->epoch_ = epoch_;
            waitset_.push(&th->node_);
        }
        full_memory_fence();
    }
```

spuriousといのがどういう条件かはちょっとわからないが、関係ない、と予想して見てみよう。

```
class eventcount
{
    void prepare_wait(void* ctx = 0)
    {
        ec_thread* th = ec_thread::current();
        th->in_waitset_ = true;
        th->ctx_ = ctx;
        {
            lock l (mtx_);
            th->epoch_ = epoch_;
            waitset_.push(&th->node_);
        }
        full_memory_fence();
    }
    ...
};
```

ec_threadのcurrentというのはTLSに入っているデータだった。eventcountのwaitset_というリストにTLSのノードをpushしている。これはlockでガードされている。
この範囲ではまだセマフォのwaitは呼んでいないな、これは当たり前だが、つまりセマフォのpushを呼ぶにはもうちょっと注意が必要そうだ。

notifyは、notify_one_relaxedが呼ばれそう。

```
    void notify_one_relaxed()
    {
        if (waitset_.size() == 0)
            return;
        dlist::node* n;
        {
            lock l (mtx_);
            epoch_ += 1;
            n = waitset_.pop();
            if (n)
                to_ec_thread(n)->in_waitset_ = false;
        }
        if (n)
        {
            to_ec_thread(n)->sema_.post();
        }
    }
```

waitsetに入っていて、popに成功したら必ずセマフォのpostが呼ばれそうな気がするな。
で、その場合はepochというのが増える。

で、cancelはどういう実装になっているんだ？たぶんこのコード例のretire_waitという奴が元の説明のキャンセルに相当すると思う。

```
    void retire_wait()
    {
        ec_thread* th = ec_thread::current();
        // spurious wakeup will be pumped in following prepare_wait()
        th->spurious_  = true;
        // try to remove node from waitset
        if (th->in_waitset_)
        {
            lock l (mtx_);
            if (th->in_waitset_)
            {
                // successfully removed from waitset,
                // so there will be no spurious wakeup
                th->in_waitset_ = false;
                th->spurious_ = false;
                waitset_.remove(&th->node_);
            }
        }
    }
```

ん？この場合はセマフォのwaitが呼ばれていないように見えるが。postしちゃっていい訳？

ああ、これは疑似wakeになるだけなのか。あれ？でもそれなら最初のコードでそもそも、以下のようにすればいいだけか？

```
  Item* Pop() {
    Item* item = _queue.pop();
    if (item != nullptr)
      return item;

    while(true) {
      _sem.wait();
      item = _queue.pop();
      if (item != nullptr)
        return item;
    }
  }
```

これで良い気はするな。でもpushの毎回postは嫌なんだよな。

```
  void Push( Item* item ) {
    _queue.push( item );
    _sem.post();
  }
```

でもこのpostを毎回にしないと、無限にwaitで待っちゃうケースがあるよなぁ。

保証したいのは、

- waitに入ったら絶対にpostされる
- postもwaitもいらなさそうな時はしたくない

の２つを満たしたいって事か。
逆にpostが多い分には別にいいって事だな。

話を戻せば、waitsetに居たらとりあえずpostするのは構わない。

retire_waitをもう一回見てみよう。

```
    void retire_wait()
    {
        ec_thread* th = ec_thread::current();
        // spurious wakeup will be pumped in following prepare_wait()
        th->spurious_  = true;
        // try to remove node from waitset
        if (th->in_waitset_)
        {
            lock l (mtx_);
            if (th->in_waitset_)
            {
                // successfully removed from waitset,
                // so there will be no spurious wakeup
                th->in_waitset_ = false;
                th->spurious_ = false;
                waitset_.remove(&th->node_);
            }
        }
    }
```

spuriousをtrueにしておくと、一回無駄なpostがされている、という意味になるんだろうな。
waitsetから取り出せたら、semのpostをする人がいないのでそういう事は無い。
取り出せなかったら既にnotify側で取り出しちゃったって事なのでpostが一回多く呼ばれる。

概念的には余分はpostはここでwaitしても良いのだろうけれど、当然retireでpost側を待つ理由は無いので、次のprepareでwaitするんだな。
ちょっと理解が進んだ。

一応waitを見ておこう。

```
    void wait()
    {
        ec_thread* th = ec_thread::current();
        // this check is just an optimization
        if (th->epoch_ == epoch_)
            th->sema_.wait();
        else
            retire_wait();
    }
```

epochの所は良くわからないな。notifyされるとepochが進むんだった。
待っていた時よりも後にアイテムがポストされているので、いったんキャンセルしてやり直す、って感じか。
まぁわからんでも無い。

### waitが呼ばれると確実にpostが呼ばれるかを確認する

さて、セマフォのwaitを呼んだ時に必ずpostが呼ばれる、というのが一番気になる所だ。
そこを確認してみよう。

waitが呼ばれる条件は、epochを無視すると

- prepare waitが終わっていて
- predがその後に失敗する

が条件になる。
この後にpostされてもwaitはされるので、
prepare waitが終わってpredが失敗した後は必ずsemのpostが呼ばれるコードになっていないといけない。

prepare waitの時点でnodeは必ずecのwaitsetに入れられるので、notifyの時点ではここから取り出す事が必ず出来る。
だから必ずpostは呼ばれそうだ。

### postとキャンセルのレースを考える

waitが呼ばれるケースだと複雑な事は無い気がしてきた。という事でretireのケースを考えよう。
以下のリストをもう一度見ながら考える。

スレッドA

- A-1: prepare
- A-2: predをチェック
  - A-3-1: cancel
  - A-3-2: commit_wait

スレッドB

- B-1: push
- B-2: notify

キャンセルに行くためには、A-2の前にB-1が呼ばれている必要がある。
B-1 ー＞ A-2 は確定。

このケースで不安になるのはどういう事だろうか？
この場合は、A-1とB-2の前後関係が気になるな。

**A-1が先の場合**

prepareでnodeがwaitsetに入る。そのあとにB-1でpushが行われてA-2が行われる。
するとA-3-1とB-2のレースコンディションになるな。

- A-3-1が先の場合：waitsetから取り出すことに成功するのでspuriousをfalseにして、notifyでは何もしない
- B-2が先の場合：waitsetから取り出してpostする事に成功するので、spuriousはtrueのままにして次のprepareでwaitする

うーむ、後者の場合はやはりこの時点でwaitしても良さそうな気がするが、まぁいいか。B-2が先の場合を考えよう。

**B-2が先の場合**

まだprepareされていないので、waitsetに入っていない。だからepochが進むだけでセマフォ関連は何もしない。
そのあとにA-1でprepareがされてA-2でpredがチェックされてA-3-1でキャンセルをするが、
これはwaitsetから取り出す事が出来るのでspuriousをfalseにして何もしない。

### fast pathについて確認する

popはそもそもにロックフリーのリストからpop出来たらそのまま返るのでロックフリー。

pushは、notifyのコードをもう一度見ると、

```
    void notify_one_relaxed()
    {
        if (waitset_.size() == 0)
            return;
        dlist::node* n;
        {
            lock l (mtx_);
            epoch_ += 1;
            n = waitset_.pop();
            if (n)
                to_ec_thread(n)->in_waitset_ = false;
        }
        if (n)
        {
            to_ec_thread(n)->sema_.post();
        }
    }
```

待っている人が居なければ何もしないので、これもロックしない。
waitsetは単なる線形リストなのでsizeが安全かはちょっと不安になる。

だがprepareが終わっていればfenceのおかげで1が見えるはずだし、prepareとのレースはその後に必ずpredが走るのでどちらでも問題無い。

ふむ、LFQueueが空にならない限りは早そうだな。

## なんとなく理解出来てきたのでこのくらいにしておく

このアルゴリズムが正しいかも必要最小限かも自分には確信が持てていないが、やりたい事は理解出来た。
そしていくつかの気になるケースでは正しく動いていそうな事も確認出来た。

waitに入った人がずーっと後回しになってしまうケースはありそうだが、そこは保証されていないのでまぁいいのだろう。

ようするにロックフリーのデータ構造を、特にブロッキングする必要が無いケースではロックせずに、
けれどロックが必要な時にはつじつまを合わせる、というのがやりたい事で、
そのためにはprepareとcancel-commitの組み合わせを使うと出来そうだ、という事なんだろうな。
データベースのtwo phase commitみたいな話と似ている気がするが、
並列でこの辺を一般的に議論した何かはどこかに無いものか。

自分で似たような問題に遭遇した時にちゃんと理解して書けるという気はまだしないけれど、
その時が来た時にこれを理解すれば良いとは判断出来るとは思う。

それにしてもこれ、結構使う事ありそうな気がするけれど解説が全然無いの、
どういう事なんだろう？ググってみるといろいろな所で実装は見かけるので使っている人は多そうなんだが。