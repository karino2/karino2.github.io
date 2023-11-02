---
title: mimallocコード読み、thread終了時の処理
layout: page
---
ここまででmalloc時の振る舞いをだいたい理解したので、次はthread終了時の挙動を見たい。

## 読む前のthread終了時について考えている事

mimallocは確保時にtldにいろいろぶら下げて、そこから確保する。
だから終了するとそのtldがどう管理されるのか、というのは気になる所だ。

ここまでで、おそらくabandonedにsegmentをぶら下げて、
新しくallocateする時にこのabandonedなsegmentが再利用されるとは思われる。

だがここまで読んだ範囲では、そのスレッドが作ったsegmentの一覧を知る方法はなさそうで、
abandonedに全部ぶらさげるにはどうしたらいいのかが分からない。

その辺を読む事で、allocation時の読み抜けを見つけたり、
読み抜けてないならどうしているかを見てみたい。

## heapｎ初期化周辺を見る

終了を追っていこうかと思って、
threadのcreateの所でexitのハンドラぶら下げてるのかなぁ、と探してみたが、
よくよく考えるとmimallocはスレッドの初期化はしない。

外部でスレッドはつくられて、そのスレッドからmi_mallocが呼ばれる訳で、
だから終了処理は最初にtldにアクセスするあたりで仕込まれると思われる。

という事でまずはheapを作る所を見ていきたい。

エントリポイントのmi_mallocを見直すと以下だ。

```
mi_decl_nodiscard extern inline mi_decl_restrict void* mi_malloc(size_t size) mi_attr_noexcept {
  return mi_heap_malloc(mi_prim_get_default_heap(), size);
}
```

という事で、ここの一番最初で`mi_prim_get_default_heap()`でtldのheapを触っているので、
これが初期化もしていると思われる。

見てみようと思ったが、これがifdefがたくさんあっていろんなバージョンがある。

自分の手元のMacでは、TLSを使う以下のバージョンっぽい。

```
static inline mi_heap_t* mi_prim_get_default_heap(void) {
  return _mi_heap_default;
}
```

_mi_heap_defaultがtlsなんだろう。定義は以下。

```
// the thread-local default heap for allocation
mi_decl_thread mi_heap_t* _mi_heap_default = (mi_heap_t*)&_mi_heap_empty;
```

mi_decl_threadは自分の手元では`__thread`となる。

なんか初期化っぽい事はしてないっぽく見えるが、右辺はなんだろう？

```
mi_decl_cache_align const mi_heap_t _mi_heap_empty = {
  NULL,
  MI_SMALL_PAGES_EMPTY,
  MI_PAGE_QUEUES_EMPTY,
  MI_ATOMIC_VAR_INIT(NULL),
  0,                // tid
  0,                // cookie
  0,                // arena id
  { 0, 0 },         // keys
  { {0}, {0}, 0, true }, // random
  0,                // page count
  MI_BIN_FULL, 0,   // page retired min/max
  NULL,             // next
  false
};
```

constのポインタを代入している。うーん、これでは変更出来ないように見えるんだが。
どこかで初期化したheapに置き換えているんだろうな。

少しmi_heap_emptyで調べていると以下を見つける。

```
static inline bool mi_heap_is_initialized(mi_heap_t* heap) {
  return (heap != &_mi_heap_empty);
}
```

やはり`_mi_heap_empty`は未初期化という扱いか。

mi_heap_initializedを検索してみると、だいたい流れはわかった。
まず、mi_malloc_genericの先頭で実際の初期化が行われる。

```
void* _mi_malloc_generic(mi_heap_t* heap, size_t size, bool zero, size_t huge_alignment) mi_attr_noexcept
{
  // initialize if necessary
  if (!mi_heap_is_initialized(heap)) {
    heap = mi_heap_get_default(); // calls mi_thread_init 
    if mi_unlikely(!mi_heap_is_initialized(heap)) { return NULL; }
  }
  ...
}
```

このmi_heap_get_defaultがlazy getterみたいなものになっている。

```
mi_heap_t* mi_heap_get_default(void) {
  mi_thread_init();
  return mi_prim_get_default_heap();
}
```

普通の感覚なら最初からこっち呼びそうだが、初期化後は元のコードの方が早いんだろう。

mi_thread_initは以下

```
// This is called from the `mi_malloc_generic`
void mi_thread_init(void) mi_attr_noexcept
{
  // ensure our process has started already
  mi_process_init();

  // initialize the thread local default heap
  // (this will call `_mi_heap_set_default_direct` and thus set the
  //  fiber/pthread key to a non-zero value, ensuring `_mi_thread_done` is called)
  if (_mi_heap_init()) return;  // returns true if already initialized

  _mi_stat_increase(&_mi_stats_main.threads, 1);
  mi_atomic_increment_relaxed(&thread_count);
  //_mi_verbose_message("thread init: 0x%zx\n", _mi_thread_id());
}
```

processの初期化はちょっと気になるが、必要になるまでは後回しにしておこう。
とりあえず本命は`_mi_heap_init()`か。

```
// Initialize the thread local default heap, called from `mi_thread_init`
static bool _mi_heap_init(void) {
  if (mi_heap_is_initialized(mi_prim_get_default_heap())) return true;
  if (_mi_is_main_thread()) {
    // mi_assert_internal(_mi_heap_main.thread_id != 0);  // can happen on freeBSD where alloc is called before any initialization
    // the main heap is statically allocated
    mi_heap_main_init();
    _mi_heap_set_default_direct(&_mi_heap_main);
    //mi_assert_internal(_mi_heap_default->tld->heap_backing == mi_prim_get_default_heap());
  }
  else {
    // use `_mi_os_alloc` to allocate directly from the OS
    mi_thread_data_t* td = mi_thread_data_zalloc();
    if (td == NULL) return false;

    mi_tld_t*  tld = &td->tld;
    mi_heap_t* heap = &td->heap;
    _mi_memcpy_aligned(tld, &tld_empty, sizeof(*tld));
    _mi_memcpy_aligned(heap, &_mi_heap_empty, sizeof(*heap));
    heap->thread_id = _mi_thread_id();
    _mi_random_init(&heap->random);
    heap->cookie  = _mi_heap_random_next(heap) | 1;
    heap->keys[0] = _mi_heap_random_next(heap);
    heap->keys[1] = _mi_heap_random_next(heap);
    heap->tld = tld;
    tld->heap_backing = heap;
    tld->heaps = heap;
    tld->segments.stats = &tld->stats;
    tld->segments.os = &tld->os;
    tld->os.stats = &tld->stats;
    _mi_heap_set_default_direct(heap);
  }
  return false;
}
```

まぁelseだけでいいだろう。

最後の`_mi_heap_set_default_direct`で先程のtlsの`_mi_heap_default`に代入しているのだろう。
簡単に見ておく。

```
void _mi_heap_set_default_direct(mi_heap_t* heap)  {
  _mi_heap_default = heap;

  // ensure the default heap is passed to `_mi_thread_done`
  // setting to a non-NULL value also ensures `mi_thread_done` is called.
  _mi_prim_thread_associate_default_heap(heap);    
}
```

なんか`_mi_prim_thread_associate_default_heap`というのを呼んでいるな。
とりあえず後回しにして先に進もう。

という事でここが初期化だな。
この範囲を眺めていると、別段exitでなにかやっているようには見えないなぁ。

thread exitっぽいものを処理しているのはprim.cっぽいので、
pthreadの実装を簡単に確認しておこう。

```
static void mi_pthread_done(void* value) {
  if (value!=NULL) {
    _mi_thread_done((mi_heap_t*)value);
  }
}

void _mi_prim_thread_init_auto_done(void) {
  pthread_key_create(&_mi_heap_default_key, &mi_pthread_done);
}
```

_mi_prim_thread_init_auto_doneを呼ぶと、
`_mi_heap_default_key`に紐づいたtldがあるスレッドはこのexitが呼ばれる。
これはさっき飛ばしたmi_process_initでやっているのを確認したが、詳細はあまり興味無いのでスルーで。

この紐づけはどこでやってるのか？

```
void _mi_prim_thread_associate_default_heap(mi_heap_t* heap) {
  if (_mi_heap_default_key != (pthread_key_t)(-1)) {  // can happen during recursive invocation on freeBSD
    pthread_setspecific(_mi_heap_default_key, heap);
  }
}
```

これが呼ばれるとmi_pthread_doneが呼ばれる。
これはさっきの_mi_heap_set_default_directだな。

mi_pthread_doneはさっきもちらっと見たが、以下のようになっていて、

```
static void mi_pthread_done(void* value) {
  if (value!=NULL) {
    _mi_thread_done((mi_heap_t*)value);
  }
}
```

_mi_thread_doneが呼ばれる。これがプラットフォーム非依存なスレッド終了処理だな。

以上をまとめると

- プロセスの初期化でpthread_setspecificが呼ばれるとmi_pthread_doneが呼ばれるように初期化される
- mi_malloc_genericの中のthread初回アクセス時にheapを作ってこれを呼ぶ
- mi_pthread_doneは_mi_thread_doneを呼ぶ

という形でmi_mallocを一度でも使ったスレッドの終了時には、
_mi_thread_doneが呼ばれる。

## _mi_heap_doneを見ていく

さて、思ったよりも呼ばれるメカニズムを追うのは時間が掛かったが、本題のthread終了時にsegmentをどうabandonedにぶらさげるか、というのを見ていこう。

_mi_thread_doneを見てみると、いろいろなチェックをした後に_mi_heap_doneを呼んでいた。
という事でこれを見ていく。

まずはmi_heap_doneの前半。

```
// Free the thread local default heap (called from `mi_thread_done`)
static bool _mi_heap_done(mi_heap_t* heap) {
  if (!mi_heap_is_initialized(heap)) return true;

  // reset default heap
  _mi_heap_set_default_direct(_mi_is_main_thread() ? &_mi_heap_main : (mi_heap_t*)&_mi_heap_empty);

  // switch to backing heap
  heap = heap->tld->heap_backing;
  if (!mi_heap_is_initialized(heap)) return false;

  ...
}
```

default heapをとりあえず空のに変えて、heap_backingというのを以下は処理する。

heap_backingというのはいまいち良く分からないが、スレッドに一つheapがあって、
それ以外にheapを一時的に作ってそこからallocとかしたい、というような用途があるんじゃないか。
そういう時にメインとなるheapとそれ以外のheapを区別していて、メインのheapは何か特別扱いがあると予想。
ここはそんな重要じゃない気がするのでこの予想で進もう。

```
  // delete all non-backing heaps in this thread
  mi_heap_t* curr = heap->tld->heaps;
  while (curr != NULL) {
    mi_heap_t* next = curr->next; // save `next` as `curr` will be freed
    if (curr != heap) {
      mi_heap_delete(curr);
    }
    curr = next;
  }
```

tldのheapsにこのスレッドに所属する全heapが並んでいて、メイン以外を`mi_heap_delete`している。
`mi_heap_delete`は気になる所だが、一旦この関数を最後まで読んでからそちらに進もう。

```
  // collect if not the main thread
  if (heap != &_mi_heap_main) {
    _mi_heap_collect_abandon(heap);
  }

  // merge stats
  _mi_stats_done(&heap->tld->stats);

  // free if not the main thread
  if (heap != &_mi_heap_main) {
    mi_thread_data_free((mi_thread_data_t*)heap);
  }
  return false;
```

mi_thread_data_freeは単なるfreeに近い事をしていたので、
たぶん気になるsegmentとかの処理は`_mi_heap_collect_abandon`となりそう。

という事で`mi_heap_delete`と`_mi_heap_collect_abandon`を読んでいく。

### mi_heap_delete

backing heapというもの以外はこれが呼ばれる模様。
見てみよう。

backingの場合とかは今回は関係無いのでその他チェックなども取っ払うと以下で、

```
// Safe delete a heap without freeing any still allocated blocks in that heap.
void mi_heap_delete(mi_heap_t* heap)
{
  if (!mi_heap_is_backing(heap)) {
    // tranfer still used pages to the backing heap
    mi_heap_absorb(heap->tld->heap_backing, heap);
  } else { ... }

  mi_heap_free(heap);
}
```

mi_heap_freeは大した事はしていなかった。

mi_heap_absorbを軽く見ると、、だいたいは以下がメインの処理っぽい。

```
  // transfer all pages by appending the queues; this will set a new heap field
  // so threads may do delayed frees in either heap for a while.
  // note: appending waits for each page to not be in the `MI_DELAYED_FREEING` state
  // so after this only the new heap will get delayed frees
  for (size_t i = 0; i <= MI_BIN_FULL; i++) {
    mi_page_queue_t* pq = &heap->pages[i];
    mi_page_queue_t* append = &from->pages[i];
    size_t pcount = _mi_page_queue_append(heap, pq, append);
    heap->page_count += pcount;
    from->page_count -= pcount;
  }
```

heapのpagesをbacking heapのpagesのキューに移動するらしい。
という事でbacking heapに全ページが行った状態になった所で、`_mi_heap_collect_abandon`が呼ばれる訳だな。

### mi_heap_collect_ex

ということでbacking heapの終了処理を見ていこう。

`_mi_heap_collect_abandon`は、mi_heap_collect_exというのを呼び出しているだけ。

```
void _mi_heap_collect_abandon(mi_heap_t* heap) {
  mi_heap_collect_ex(heap, MI_ABANDON);
}
```

という事でmi_heap_collect_exを読んでいこう。
ただ、なかなか分岐が多いのでMI_ABANDONを中心に抜き出してみる。

```
static void mi_heap_collect_ex(mi_heap_t* heap, mi_collect_t collect)
{
  mi_heap_visit_pages(heap, &mi_heap_page_never_delayed_free, NULL, NULL);

  // free all current thread delayed blocks.
  // (if abandoning, after this there are no more thread-delayed references into the pages.)
  _mi_heap_delayed_free_all(heap);

  // collect retired pages
  _mi_heap_collect_retired(heap, force);

  // collect all pages owned by this thread
  mi_heap_visit_pages(heap, &mi_heap_page_collect, &collect, NULL);

  // collect abandoned segments (in particular, purge expired parts of segments in the abandoned segment list)
  // note: forced purge can be quite expensive if many threads are created/destroyed so we do not force on abandonment
  _mi_abandoned_collect(heap, collect == MI_FORCE /* force? */, &heap->tld->segments);

  // collect segment local caches
  _mi_segment_thread_collect(&heap->tld->segments);
}
```

という事で関数をそれぞれ呼んでいるだけなので、まずは名前とコメントだけ見て何やってるか考えてみる。

最初のmi_heap_visit_pagesは渡す関数ポインタを各ページに実行する、という類のものなので、
本体はmi_heap_page_never_delayed_freeの方になる。
名前とコメントから予想するに、ページにdelayed freeを行わないようにするフラグを立てる、という感じだろう。
delayed freeというのが何なのかは正確には知らないが、
まぁなんかfreeを遅延させる方が都合が良い事は並列アルゴリズムでは多いのでなんかそういう機構があるんだろう。

その後に_mi_heap_delayed_free_allが呼ばれているが、
なんか前のフラグを立てたあとには同期が必要そうな処理に思えるけれどおうなんだろう？
まぁとにかく、名前的にはdelayed freeの遅延されたfreeをここで処理しているのだろう。

その後retired pageというのを集めている。
集めるとは何を指すのかとかは見てみないと分からないが、
なんとなく想像はつく。

そのあとまたvist pagesでmi_heap_page_collectを実行している。
コメントと合わせるとこれは全ページを集めるのだろう。
どこに集めるのかは見てみたい所だが、ここまでの処理で空のページを全部集めているのだろうな。

そしてその後に_mi_abandoned_collectというのを呼んでいる。
この辺は名前からは知りたい処理を行ってそうな雰囲気だな。

そして最後に_mi_segment_thread_collectというのを呼んで終わりとなる。

雰囲気としては、以下の２つを読んで見れば分かりそうかな？

- mi_heap_page_collect
- _mi_abandoned_collect

ここに目的の処理がなさそうだったらそれ以外も読む感じにしよう。

とりあえずmi_heap_page_collectを見る。

```
static bool mi_heap_page_collect(mi_heap_t* heap, mi_page_queue_t* pq, mi_page_t* page, void* arg_collect, void* arg2 ) {
  mi_collect_t collect = *((mi_collect_t*)arg_collect);
  _mi_page_free_collect(page, collect >= MI_FORCE);
  if (mi_page_all_free(page)) {
    // no more used blocks, free the page.
    // note: this will free retired pages as well.
    _mi_page_free(page, pq, collect >= MI_FORCE);
  }
  else if (collect == MI_ABANDON) {
    // still used blocks but the thread is done; abandon the page
    _mi_page_abandon(page, pq);
  }
  return true; // don't break
}
```

また中で_mi_page_free_collectとかいう似たような名前の関数が呼ばれている。
ちらっと中を見ると、thread free listとかlocal free listとかをfree listに編入するような処理になっている。
ここはもうだいたい分かるので深入りしないで先に進むが、collectが何をやっているかはだいぶ分かってきたな。

_mi_page_freeはそれなりにその後いろいろ呼ぶ関数だが、ページをsegmentのフリーリストみたいな所に入れている。
まぁここはいいかな。

_mi_page_abandonを見ていこうと思うが、その前にここに渡しているpqってどこから来たんだっけ？
という事で飛ばしたmi_heap_visit_pagesを軽く眺める。

```
// Visit all pages in a heap; returns `false` if break was called.
static bool mi_heap_visit_pages(mi_heap_t* heap, heap_page_visitor_fun* fn, void* arg1, void* arg2)
{
  // ... 省略 ...
  for (size_t i = 0; i <= MI_BIN_FULL; i++) {
    mi_page_queue_t* pq = &heap->pages[i];
    mi_page_t* page = pq->first;
    while(page != NULL) {
      mi_page_t* next = page->next; // save next in case the page gets removed from the queue
      if (!fn(heap, pq, page, arg1, arg2)) return false;
      page = next; // and continue
    }
  }
  return true;
}
```

heapのpagesを順番にたどり、その各pagesに対してぶら下がっているページをイテレートしていく。
pqは`heap->pages[]`のエントリだな。

という事で話を戻して_mi_page_abandonを見てみよう。
この関数は、pageがまだ使われているがheapが破棄される時に呼ばれる。

```
// Abandon a page with used blocks at the end of a thread.
// Note: only call if it is ensured that no references exist from
// the `page->heap->thread_delayed_free` into this page.
// Currently only called through `mi_heap_collect_ex` which ensures this.
void _mi_page_abandon(mi_page_t* page, mi_page_queue_t* pq) {
  mi_heap_t* pheap = mi_page_heap(page);

  // remove from our page list
  mi_segments_tld_t* segments_tld = &pheap->tld->segments;
  mi_page_queue_remove(pq, page);

  // page is no longer associated with our heap
  mi_page_set_heap(page, NULL);

  _mi_segment_page_abandon(page,segments_tld);
}
```

heapのpqから削除して、segments_tldのどこかにぶら下げているようだ。
_mi_segment_page_abandonを読んでみよう。

```
void _mi_segment_page_abandon(mi_page_t* page, mi_segments_tld_t* tld) {

  mi_segment_t* segment = _mi_page_segment(page);

  segment->abandoned++;  
  _mi_stat_increase(&tld->stats->pages_abandoned, 1);

  if (segment->used == segment->abandoned) {
    // all pages are abandoned, abandon the entire segment
    mi_segment_abandon(segment, tld);
  }
}
```

おや？pageはsegmentを取得するのにしか使ってないな。
どこにもぶら下げたりはしてないようだな。
最終的に全pageはそのうちabandonedされるかfreeされるかで、freeされればusedのカウントが減るので、
最後のページの処理まで行けばこのif文がtrueになると思われる。

pageをabandonにするだけかと思っていたら、segmentもここで処理しているのか。

mi_segment_abandonを見てみよう。

```
static void mi_segment_abandon(mi_segment_t* segment, mi_segments_tld_t* tld) {

  // remove the free pages from the free page queues
  mi_slice_t* slice = &segment->slices[0];
  const mi_slice_t* end = mi_segment_slices_end(segment);
  while (slice < end) {
    if (slice->xblock_size == 0) { // a free page
      mi_segment_span_remove_from_queue(slice,tld);
      slice->xblock_size = 0; // but keep it free
    }
    slice = slice + slice->slice_count;
  }

  // perform delayed decommits (forcing is much slower on mstress)
  mi_segment_try_purge(segment, mi_option_is_enabled(mi_option_abandoned_page_purge) /* force? */, tld->stats);    
  
  // all pages in the segment are abandoned; add it to the abandoned list
  _mi_stat_increase(&tld->stats->segments_abandoned, 1);
  mi_segments_track_size(-((long)mi_segment_size(segment)), tld);
  segment->thread_id = 0;
  mi_atomic_store_ptr_release(mi_segment_t, &segment->abandoned_next, NULL);
  segment->abandoned_visits = 1;   // from 0 to 1 to signify it is abandoned
  mi_abandoned_push(segment);
}
```

最後の所でsegmentをabandonedにpushしているな。これは知りたかった事の一つだ。
ただ一応その前も読んでおこう。

whileではスライスを舐めて、tldのspansから削除したりしている。
まぁこの辺は深入りしなくていいかなぁ。

purgeはsegmentが空でメモリあけられる時は戻す設定の時はパージするんだろう。これもまぁいいかな。

なんてatomicな処理が必要なのかは良く分かってないが、なんにせよthread_idを0にしたりabandoned_nextをNULLにしたりして、
abandoned listにpushする準備をして、
mi_abandoned_pushを呼んでいる。

一応mi_abandoned_pushを軽く見ておく。

```
// Push on the abandoned list.
static void mi_abandoned_push(mi_segment_t* segment) {
  mi_tagged_segment_t next;
  mi_tagged_segment_t ts = mi_atomic_load_relaxed(&abandoned);
  do {
    mi_atomic_store_ptr_release(mi_segment_t, &segment->abandoned_next, mi_tagged_segment_ptr(ts));
    next = mi_tagged_segment(segment, ts);
  } while (!mi_atomic_cas_weak_release(&abandoned, &ts, next));
  mi_atomic_increment_relaxed(&abandoned_count);
}
```

さて、これはだいたい予想通りのコードだ。
tagged segmentはABA問題対策になんかカウンタでも持つんだろう。

一応軽く周辺を眺める。

```
// Use the bottom 20-bits (on 64-bit) of the aligned segment pointers
// to put in a tag that increments on update to avoid the A-B-A problem.
#define MI_TAGGED_MASK   MI_SEGMENT_MASK
typedef uintptr_t        mi_tagged_segment_t;

static mi_segment_t* mi_tagged_segment_ptr(mi_tagged_segment_t ts) {
  return (mi_segment_t*)(ts & ~MI_TAGGED_MASK);
}

static mi_tagged_segment_t mi_tagged_segment(mi_segment_t* segment, mi_tagged_segment_t ts) {
  uintptr_t tag = ((ts & MI_TAGGED_MASK) + 1) & MI_TAGGED_MASK;
  return ((uintptr_t)segment | tag);
}
```

そうっぽい。
ちゃんとどういうABA問題があってどうしてこれで解決出来るのかを本来はちゃんと追うべきだろうが、
そこは関心外なのでスルー。

abandonedはファイル内static変数で、以下。

```
// The abandoned page list (tagged as it supports pop)
static mi_decl_cache_align _Atomic(mi_tagged_segment_t) abandoned;         // = NULL
```

以上で知りたかった事がわかったので、
_mi_abandoned_collectの方を見る必要はなさそう（最後にちらっと見ると思うが）。

とりあえずここまででわかった事をまとめよう。

- heapはセグメントの一覧は持っていない、pageの一覧は持っている
- threadのexit時にはheapにあるpageの一覧をabandonしていく
- pageのabandon処理でそれの所属する全pageがabandonされたらsegmentをabandonedリストにプッシュする

こうして、全segmentはabandonedリストにぶら下がる事になる。

segmentはpageからたどるしか無い、というのは意外な所だね。

最後に_mi_abandoned_collectを確認して終わりにしよう。

```
void _mi_abandoned_collect(mi_heap_t* heap, bool force, mi_segments_tld_t* tld)
{
  mi_segment_t* segment;
  int max_tries = (force ? 16*1024 : 1024); // limit latency
  if (force) {
    mi_abandoned_visited_revisit(); 
  }
  while ((max_tries-- > 0) && ((segment = mi_abandoned_pop()) != NULL)) {
    mi_segment_check_free(segment,0,0,tld); // try to free up pages (due to concurrent frees)
    if (segment->used == 0) {
      // free the segment (by forced reclaim) to make it available to other threads.
      // note: we could in principle optimize this by skipping reclaim and directly
      // freeing but that would violate some invariants temporarily)
      mi_segment_reclaim(segment, heap, 0, NULL, tld);
    }
    else {
      // otherwise, purge if needed and push on the visited list 
      // note: forced purge can be expensive if many threads are destroyed/created as in mstress.
      mi_segment_try_purge(segment, force, tld->stats);
      mi_abandoned_visited_push(segment);
    }
  }
}
```

abandonedにぶら下がっているsegmentをなめていって、
usedが0になったら解放する、
使われていたらabandoned_visitedの方につなぎかえてしばらくチェックしないようにする、
という感じの処理だな。

## ここまで読んでの雑感

mimallocのコード読みは自分の知りたい事はだいたい追えたので、
今回で終わりにしようと思う。

論文とは結構違う所もあり、割と予想とは違う構造の部分もあったので、
読んだ甲斐はあった。
またロックフリーなコードの書き方としては勉強になる事も多かった。

ただC言語でこの規模のコード読むのはつらいなぁ、という気もする。
C++で同じようなコード読みたいなぁ。

言語の事はおいておいても、かなり読むのが大変なコードではある。

また、並列のコードとして、
free listを3つに分けたり処理するスレッドを一つにするがそのスレッドが複数あるような構造にする事で、
並列性を高めつつ際どい問題を避けていたり、
とても勉強になった。
これを0から編み出すのはまぁ無理かなという気もするけれど、
似た問題にあった時にアレンジする事は出来そうなので、
こういった「答え」を勉強しておくのは重要だな、と思った。

いやぁ、Microsoftも並列力高いプログラマいるよなぁ。
やるねぇ。