---
title: mimallocコード読み、malloc_generic後編
layout: page
---
前回までで、mi_segments_page_allocでスライスからページを作るケースは理解出来た。
今回最初に知りたい事はスライスが無い場合に何をやっているのか、
もっと言えばセグメントが溢れた時にどうしているか、というあたりを見たい。

予想としては新しいセグメントを作ってそれを管理するんだと思うが、
古いセグメントはどうなるのか、具体的にはthread free listを誰が処理するのかを知りたい。

## 前回までの復習、mi_segments_page_allocのあたりから

mi_segments_page_allocが以下のようなコードになっていた。

```
static mi_page_t* mi_segments_page_alloc(mi_heap_t* heap, mi_page_kind_t page_kind, size_t required, size_t block_size, mi_segments_tld_t* tld, mi_os_tld_t* os_tld)
{
  size_t page_size = _mi_align_up(required, (required > MI_MEDIUM_PAGE_SIZE ? MI_MEDIUM_PAGE_SIZE : MI_SEGMENT_SLICE_SIZE));
  size_t slices_needed = page_size / MI_SEGMENT_SLICE_SIZE;

  mi_page_t* page = mi_segments_page_find_and_allocate(slices_needed, heap->arena_id, tld); //(required <= MI_SMALL_SIZE_MAX ? 0 : slices_needed), tld);
  if (page==NULL) {
    // no free page, allocate a new segment and try again
    if (mi_segment_reclaim_or_alloc(heap, slices_needed, block_size, tld, os_tld) == NULL) {
      // OOM or reclaimed a good page in the heap
      return NULL;  
    }
    else {
      // otherwise try again
      return mi_segments_page_alloc(heap, page_kind, required, block_size, tld, os_tld);
    }
  }

  mi_segment_try_purge(_mi_ptr_segment(page), false, tld->stats);
  return page;
}
```

そして前回はmi_segments_page_find_and_allocateを読んでいって、だいたい理解出来た。
今回はこれがnullを返したケースの処理を見ていきたい。

nullを返すと以下のコードが呼ばれる。

```
    // no free page, allocate a new segment and try again
    if (mi_segment_reclaim_or_alloc(heap, slices_needed, block_size, tld, os_tld) == NULL) {
      // OOM or reclaimed a good page in the heap
      return NULL;  
    }
```

ちょっと不思議なのはpage変数をこの後更新する事は特になさそうなので、
新しくセグメントを作った時にはNULLを返しているっぽい所だ。
コメントでもそれっぽい事が書いてある。

その辺も踏まえてmi_segment_reclaim_or_allocを見ていこう。

## mi_segment_reclaim_or_alloc概要

まずコードを見てみる。

```
static mi_segment_t* mi_segment_reclaim_or_alloc(mi_heap_t* heap, size_t needed_slices, size_t block_size, mi_segments_tld_t* tld, mi_os_tld_t* os_tld)
{
  // 1. try to reclaim an abandoned segment
  bool reclaimed;
  mi_segment_t* segment = mi_segment_try_reclaim(heap, needed_slices, block_size, &reclaimed, tld);
  if (reclaimed) {
    // reclaimed the right page right into the heap
    return NULL; // pretend out-of-memory as the page will be in the page queue of the heap with available blocks
  }
  else if (segment != NULL) {
    // reclaimed a segment with a large enough empty span in it
    return segment;
  }
  // 2. otherwise allocate a fresh segment
  return mi_segment_alloc(0, 0, heap->arena_id, tld, os_tld, NULL);  
}
```

コメントを見ると、reclaimを試して、無理だったら新しいsegmentを作るっぽい。
2の方の新しいsegmentを作るのが一番知りたい所だが、とりあえずreclaimの処理も軽く見ておこう。
特にコメントのabandoned segmentというのが気になる所なので。

### mi_segment_try_reclaim

コメントがたくさんあって量が多いがちょっとずつ見ていこう。

```
static mi_segment_t* mi_segment_try_reclaim(mi_heap_t* heap, size_t needed_slices, size_t block_size, bool* reclaimed, mi_segments_tld_t* tld)
{
  *reclaimed = false;
  mi_segment_t* segment;
  long max_tries = mi_option_get_clamp(mi_option_max_segment_reclaim, 8, 1024);     // limit the work to bound allocation times
  while ((max_tries-- > 0) && ((segment = mi_abandoned_pop()) != NULL)) {
    ...
  }
  return NULL;
}
```

オプションは誰がどう設定しているか全然分かっていないが、まぁいいだろう。たぶん8〜1024のどこかの値でretryの数が決まっているという事だろうし。

while文としては、`mi_abandoned_pop()` というので取り出していく模様。
名前からすると特定のthreadに属していなかったりもういっぱいになったsegmentがどこかに積まれていて、それをチェックしているんじゃないか。

予想としてはいっぱいになったケースだと空きは無いのでしばらく放置しておいて、いろいろなスレッドからのthread freeが溜まったら再利用する、
という感じなんじゃないか。

予想を確認する前に`mi_abandoned_pop()`を見てabandonedとはなんぞや、というのを確認したい。

### mi_abandoned_pop

```
// Pop from the abandoned list
static mi_segment_t* mi_abandoned_pop(void) {
  mi_segment_t* segment;
  // Check efficiently if it is empty (or if the visited list needs to be moved)
  mi_tagged_segment_t ts = mi_atomic_load_relaxed(&abandoned);
  segment = mi_tagged_segment_ptr(ts);
  ...
}
```

tagged segmentというのがあって、そこからsegmentを取り出している。
mi_tagged_segment_tの定義を見ると以下。

```
// Use the bottom 20-bits (on 64-bit) of the aligned segment pointers
// to put in a tag that increments on update to avoid the A-B-A problem.
#define MI_TAGGED_MASK   MI_SEGMENT_MASK
typedef uintptr_t        mi_tagged_segment_t;
```

並列のABA（解放されてもう一回allocateされた場合に本来は変わっているのが同じと誤解する問題）の対策として、
ポインタの下位20 bitをインクリメントしていくidとしているらしい。へぇ。

その上にabandonmentというコメントが長々と書かれている。

```
Abandonment

When threads terminate, they can leave segments with
live blocks (reachable through other threads). Such segments
are "abandoned" and will be reclaimed by other threads to
reuse their pages and/or free them eventually

We maintain a global list of abandoned segments that are
reclaimed on demand. Since this is shared among threads
the implementation needs to avoid the A-B-A problem on
popping abandoned segments: <https://en.wikipedia.org/wiki/ABA_problem>
We use tagged pointers to avoid accidentally identifying
reused segments, much like stamped references in Java.
Secondly, we maintain a reader counter to avoid resetting
or decommitting segments that have a pending read operation.

Note: the current implementation is one possible design;
another way might be to keep track of abandoned segments
in the arenas/segment_cache's. This would have the advantage of keeping
all concurrent code in one place and not needing to deal
with ABA issues. The drawback is that it is unclear how to
scan abandoned segments efficiently in that case as they
would be spread among all other segments in the arenas.
```

ほぉほぉ。やはりthreadが終了する時にそこのsegmentはabandonedという所に行って、これが他のスレッドに再利用される、
という事のようだ。

2段落目を見ると、たまたま同じポインタの別のsegmentを区別する為にidがいるとの事だな。
segmentが解放されるのは空になった時だけだろうからABA問題はかなり起こりにくそうだが、
ほとんど空のsegmentを作ってすぐ死ぬthreadが大量にあると起こり得るか。

`mi_abandoned_pop()`のコードに戻ろう。

```
  mi_tagged_segment_t ts = mi_atomic_load_relaxed(&abandoned);
```

以下のコードで、abandonedとはなんぞや？

```
// The abandoned page list (tagged as it supports pop)
static mi_decl_cache_align _Atomic(mi_tagged_segment_t) abandoned;         // = NULL
```

static変数で別段リストとかになってないように見えるな。しかも単にloadしているだけで、NULLとswapしている様子も無い。

その後のコードを見てみよう。

```
  if mi_likely(segment == NULL) {
    if mi_likely(!mi_abandoned_visited_revisit()) { // try to swap in the visited list on NULL
      return NULL;
    }
  }
```

likelyは普段は消しているけれどここではヒントになりそうなので残しておく。
このよく分からないstatic変数はだいたいNULLで、mi_abandoned_visted_revisitでvisitedリストから取り出す、みたいな感じになっているのかな。

mi_abandoned_visited_revisitも見てみるか。

```
// Move the visited list to the abandoned list.
static bool mi_abandoned_visited_revisit(void)
{
  // quick check if the visited list is empty
  if (mi_atomic_load_ptr_relaxed(mi_segment_t, &abandoned_visited) == NULL) return false;

  // grab the whole visited list
  mi_segment_t* first = mi_atomic_exchange_ptr_acq_rel(mi_segment_t, &abandoned_visited, NULL);
  if (first == NULL) return false;
...
}
```

NULLとexchangeしたりそれっぽいコードにはなっている。
abandoned_visitedの定義を見ると以下。

```
// This is a list of visited abandoned pages that were full at the time.
// this list migrates to `abandoned` when that becomes NULL. The use of
// this list reduces contention and the rate at which segments are visited.
static mi_decl_cache_align _Atomic(mi_segment_t*)       abandoned_visited; // = NULL
```

やはりfullだった時にこれにぶら下げる、みたいな処理の模様。

この関数は細かい処理が多いので、とりあえずコメントに着目して何をしているか見てみる。

```
// Move the visited list to the abandoned list.
static bool mi_abandoned_visited_revisit(void)
{
  // mi_segment_t* firstにabandoned_visitedを取り出す

  // abandonedがNULLだったら置き換えてreturn

  // firstの一番最後まで辿って、

  // その最後にabandonedを足す
}
```

こんな感じになっている。

たどる所を見ると以下みたいな感じ。

```
  // firstの一番最後まで辿って、
  mi_segment_t* last = first;
  mi_segment_t* next;
  while ((next = mi_atomic_load_ptr_relaxed(mi_segment_t, &last->abandoned_next)) != NULL) {
    last = next;
  }
```

mi_segment_tにabandoned_nextというのがあって線形リストになっている模様。

最後がちょっとテクニカルなので、こちらのコードも見ておく。

```
  // その最後にabandonedを足す
  mi_tagged_segment_t anext = mi_atomic_load_relaxed(&abandoned);
  size_t count;
  do {
    count = mi_atomic_load_relaxed(&abandoned_visited_count);
    mi_atomic_store_ptr_release(mi_segment_t, &last->abandoned_next, mi_tagged_segment_ptr(anext));
    afirst = mi_tagged_segment(first, anext);
  } while (!mi_atomic_cas_weak_release(&abandoned, &anext, afirst));
  mi_atomic_add_relaxed(&abandoned_count, count);
  mi_atomic_sub_relaxed(&abandoned_visited_count, count);
  return true;
```

abandonedをCASで更新する。afirstはfirstのタグつきでfirstは最初のabandoned_visitedだった。
こういうコードは正しいか理解するのは難しいね。

でもmi_abandoned_visited_revisitで何をやっているかはだいたいわかったかな。

ここまで来ると`mi_abandoned_pop()`が何をやっているかも予想はつく。
予想があっているかを確認しておこう。

```
// Pop from the abandoned list
static mi_segment_t* mi_abandoned_pop(void) {
  // abandonedをvisitedなどから持ってくる、既に見たので省略
  ...

  // Do a pop. We use a reader count to prevent
  // a segment to be decommitted while a read is still pending,
  // and a tagged pointer to prevent A-B-A link corruption.
  // (this is called from `region.c:_mi_mem_free` for example)
  mi_atomic_increment_relaxed(&abandoned_readers);  // ensure no segment gets decommitted

  // 中略

  mi_atomic_decrement_relaxed(&abandoned_readers);  // release reader lock
  if (segment != NULL) {
    mi_atomic_store_ptr_release(mi_segment_t, &segment->abandoned_next, NULL);
    mi_atomic_decrement_relaxed(&abandoned_count);
  }
  return segment;
}
```

abandoned_readersというカウンタをincrementして、終わった後にdecrementしているが、
特に中で使っている様子は無い。
この変数で検索すると以下が引っかかる。

```
// Wait until there are no more pending reads on segments that used to be in the abandoned list
// called for example from `arena.c` before decommitting
void _mi_abandoned_await_readers(void) {
  size_t n;
  do {
    n = mi_atomic_load_acquire(&abandoned_readers);
    if (n != 0) mi_atomic_yield();
  } while (n != 0);
}
```

yieldというのはいかにも際どい命令だが、スピンロックのような事でreader writerロックのような事を実現している模様。
yieldはインラインアセンブリでアーキテクチャごとに謎の命令を実行している。
見た所省電力モードとしてイベントを待つ、みたいな感じっぽいな。
なお、古いプロセッサなどではnopになるようなのでその場合はスピンロックになる訳だな。
お、cppの場合は`std::this_thread::yield()`が呼ばれるらしい。

mutexなどではなくメモリの特定の領域を使ってロックってどうやるんだろう？という気はしていたのだが、
C++ならこれで良さそうだな。

なんかwriterがいる時にはブロックする必要がありそうなもんだが、そういう処理は入っていない。
たぶんawaitする時にはもうほかの処理は始まらないという事が保証されていて、
終わるのを待つだけで十分なんだろう。（それをコードで確認するのは大変そうだが）

さて、`mi_abandoned_pop()`に戻ろう。
readersをインクリメントした後には以下のコードが実行される。

```
  mi_tagged_segment_t next = 0;
  ts = mi_atomic_load_acquire(&abandoned);
  do {
    segment = mi_tagged_segment_ptr(ts);
    if (segment != NULL) {
      mi_segment_t* anext = mi_atomic_load_ptr_relaxed(mi_segment_t, &segment->abandoned_next);
      next = mi_tagged_segment(anext, ts); // note: reads the segment's `abandoned_next` field so should not be decommitted
    }
  } while (segment != NULL && !mi_atomic_cas_weak_acq_rel(&abandoned, &ts, next));
```

abandonedの先頭を取り出して、nextを次のabandonedにする、をCASで実現している。
こういうイディオムはなかなか難度高いね。そしてコメントを見ると、abandoned_nextをたどる時にはreaderのカウントを上げないといけないっぽい。

その後は以下。

```
  if (segment != NULL) {
    mi_atomic_store_ptr_release(mi_segment_t, &segment->abandoned_next, NULL);
    mi_atomic_decrement_relaxed(&abandoned_count);
  }
```

store_ptr_releaseのreleaseはメモリモデルのreleaseで、ようするにこのmemory_orderのstore。
既にリストから外れているsegmentなのになんでatomicである必要があるのかは良く分からないが、abandoned_countとの可視性の問題がなんかあるんだろうな。
なんにせよ、segmentを取り出してabandoned_nextをクリアして返す訳だ。

コードは長いが、ようするにabandoned_visitedを全部abandonedにつなぎ直して、
その先頭を取り出して返しているだけだな。

### mi_segment_try_reclaim続き

mi_abandoned_popを理解したのでこれを呼び出していたmi_segment_try_reclaimに戻ってこよう。

以下みたいなコードだった。

```
static mi_segment_t* mi_segment_try_reclaim(mi_heap_t* heap, size_t needed_slices, size_t block_size, bool* reclaimed, mi_segments_tld_t* tld)
{
  *reclaimed = false;
  mi_segment_t* segment;
  long max_tries = mi_option_get_clamp(mi_option_max_segment_reclaim, 8, 1024);     // limit the work to bound allocation times
  while ((max_tries-- > 0) && ((segment = mi_abandoned_pop()) != NULL)) {
    ...
  }
  return NULL;
}
```

abandonedからsegmentをポップして何かをする。
条件を満たさなかったらvisitedの最後に加わえる事が予想されるが、whileの中を見ていこう。


```
    segment->abandoned_visits++;
    // todo: an arena exclusive heap will potentially visit many abandoned unsuitable segments
    // and push them into the visited list and use many tries. Perhaps we can skip non-suitable ones in a better way?
    bool is_suitable = _mi_heap_memid_is_suitable(heap, segment->memid);
    bool has_page = mi_segment_check_free(segment,needed_slices,block_size,tld); // try to free up pages (due to concurrent frees)
    if (segment->used == 0) {
      // free the segment (by forced reclaim) to make it available to other threads.
      // note1: we prefer to free a segment as that might lead to reclaiming another
      // segment that is still partially used.
      // note2: we could in principle optimize this by skipping reclaim and directly
      // freeing but that would violate some invariants temporarily
      mi_segment_reclaim(segment, heap, 0, NULL, tld);
    }
    // 以下else節
```

memidというのはarea_idっぽいが、これがなんなのかはいまいち良く分からない。
arenaアロケータの上に作られているのだろうけれど、tlbごとに別じゃないのならどういう単位で複数になるのだろう？良く分からないが、とりあえず先に進む。

usedというのが0というのはこのsegmentに所属するメモリは全部解放済み、という事のように見える。
ちらっと見た感じだとpageが全部解放されていると0になるっぽいか。

mi_segment_reclaimをちらっと見るとsliceがusedの場合があるっぽいが、ここから呼ばれる場合もあるんだろうか？
segmentのusedが0というのが何を表すのか、いまいち良く分からないな。
コメントのnote2とかを読むとこのsegmentはもう使われていなさそうではあるが。

まぁいいや。使ってないsegmentがたまたま見つかったら初期化して再利用、という事をやっているんだろう。
else以降を見ていく。

```
    else if (has_page && is_suitable) {
      // found a large enough free span, or a page of the right block_size with free space 
      // we return the result of reclaim (which is usually `segment`) as it might free
      // the segment due to concurrent frees (in which case `NULL` is returned).
      return mi_segment_reclaim(segment, heap, block_size, reclaimed, tld);
    }
```

has_pageは以下の行だった。

```
    bool has_page = mi_segment_check_free(segment,needed_slices,block_size,tld); // try to free up pages (due to concurrent frees)
```

このmi_segment_check_freeの中でthread_freeとかlocal_freeの解放処理をしている模様。
それで十分なページがあれば、このsegmentを返すのだろう。

reclaimも重要ではありそうだが、一番関心のある所では無いのでまぁいいかなぁ。

else節の次は以下。

```
    else if (segment->abandoned_visits > 3 && is_suitable) {  
      // always reclaim on 3rd visit to limit the abandoned queue length.
      mi_segment_reclaim(segment, heap, 0, NULL, tld);
    }
```

reclaimすると何が起こるのかは良く分かってないが、returnはしてないので外のwhile文としては次のsegmentのpopに進むっぽいな。

さらに次のelse節。

```
    else {
      // otherwise, push on the visited list so it gets not looked at too quickly again
      mi_segment_try_purge(segment, true /* force? */, tld->stats); // force purge if needed as we may not visit soon again
      mi_abandoned_visited_push(segment);
    }
```

purgeが何なのかは良く分からないが、visited listの方にpushするのは予想通りだ。

ようするに、mi_segment_try_reclaimは、

- abandoned_visitedをabandonedに昇格
- abandonedからsegmentを取り出して以下を試す
   - あいているsegmentがあればそれをrelcaimして返す
   - 空いてなければvisitedに加える

reclaimは結構複雑そうな上に関心がある所では無いっぽいので気が乗らないが、一応何をやっているかを理解する為に見てみるか。

### mi_segment_reclaim

```
// Reclaim an abandoned segment; returns NULL if the segment was freed
// set `right_page_reclaimed` to `true` if it reclaimed a page of the right `block_size` that was not full.
static mi_segment_t* mi_segment_reclaim(mi_segment_t* segment, mi_heap_t* heap, size_t requested_block_size, bool* right_page_reclaimed, mi_segments_tld_t* tld) {
  if (right_page_reclaimed != NULL) { *right_page_reclaimed = false; }

  segment->thread_id = _mi_thread_id();
  segment->abandoned_visits = 0;
  mi_segments_track_size((long)mi_segment_size(segment), tld);
  _mi_stat_decrease(&tld->stats->segments_abandoned, 1);
  
  // for all slices
  const mi_slice_t* end;
  mi_slice_t* slice = mi_slices_start_iterate(segment, &end);
  while (slice < end) {
    if (mi_slice_is_used(slice)) {
      ... 中略 ...
    }
    else {
      // the span is free, add it to our page queues
      slice = mi_segment_span_free_coalesce(slice, tld); // set slice again due to coalesceing
    }
    slice = slice + slice->slice_count;
  }

  if (segment->used == 0) {  // due to page_clear
    mi_segment_free(segment, false, tld);
    return NULL;
  }
  else {
    return segment;
  }
}
```

reclaimされるとこのsegmentはこのthread_idのものとみなされるようだ。
中ではsegmentのsliceをなめて何かをやって、使っているものがいなくなればfreeしてNULLを返し、
そうでなければこのsegmentを返す。

本体はwhileの中か。

whileの中のelseの方はコメントを信じるなら空いているスライスをつなげてページキューに入れている。
まぁ使ってないsliceはなんか初期化して利用出来る状態にするんだろう。

とう事でwhileの最初のif文の中を見てみる。

```
  while (slice < end) {
    if (mi_slice_is_used(slice)) {
      // in use: reclaim the page in our heap
      mi_page_t* page = mi_slice_to_page(slice);
      _mi_stat_decrease(&tld->stats->pages_abandoned, 1);
      segment->abandoned--;
      // set the heap again and allow delayed free again
      mi_page_set_heap(page, heap);
      _mi_page_use_delayed_free(page, MI_USE_DELAYED_FREE, true); // override never (after heap is set)
      _mi_page_free_collect(page, false); // ensure used count is up to date
      if (mi_page_all_free(page)) {
        // if everything free by now, free the page
        slice = mi_segment_page_clear(page, tld);   // set slice again due to coalesceing
      }
      else {
        // otherwise reclaim it into the heap
        _mi_page_reclaim(heap, page);
        if (requested_block_size == page->xblock_size && mi_page_has_any_available(page)) {
          if (right_page_reclaimed != NULL) { *right_page_reclaimed = true; }
        }
      }
    }
    else {
      // 略
    }
    slice = slice + slice->slice_count;
  }
```

なかなかごついが、pageを現在のスレッドの管理に置いて、thead free listなどの処理を行っているっぽい。
そしてmi_page_reclaimというのでページを管理下にしているっぽい。

軽く見るとこのpageをheapのpage_queueに入れたりしている。

全体としては、このsegmentをheapの管理下においている感じか。
page queueに加えたページのうち、目的のブロックを切り出せるページがあればout引数にtrueが入る。

### mi_segment_reclaim_or_alloc再訪

以上でmi_segment_try_reclaimが理解出来た。
これはどこから呼ばれていたかと思い直すと、以下のmi_segment_reclaim_or_allocだった。

```
static mi_segment_t* mi_segment_reclaim_or_alloc(mi_heap_t* heap, size_t needed_slices, size_t block_size, mi_segments_tld_t* tld, mi_os_tld_t* os_tld)
{
  // 1. try to reclaim an abandoned segment
  bool reclaimed;
  mi_segment_t* segment = mi_segment_try_reclaim(heap, needed_slices, block_size, &reclaimed, tld);
  if (reclaimed) {
    // reclaimed the right page right into the heap
    return NULL; // pretend out-of-memory as the page will be in the page queue of the heap with available blocks
  }
  else if (segment != NULL) {
    // reclaimed a segment with a large enough empty span in it
    return segment;
  }
  // 2. otherwise allocate a fresh segment
  return mi_segment_alloc(0, 0, heap->arena_id, tld, os_tld, NULL);  
}
```

try_reclcaimでreclaimedだとheapのpagesに空きページが入った状態となっているので、
segmentなど無視してheapからallocateすればよろしい。

そうでなくsegmentが返ってくるというのは、
ray_reclaimを見直すと`has_page && is_suitable`だった時で、さらにreclaimedがtrueにならないケースなので、
sliceを処理していって空のスライスがあるがページにはしてないケースか。

どちらにせよ、これはsegmentから取れるケースなのは変わりない。

そして本題としては、segmentから空きスペースが取れない、
コメントとしては2の所だ。

この場合はmi_segment_allocが呼ばれている。

これは現在のsegmentがいっぱいになった後に新しいsegmentを作る場合で、
その場合前のsegmentがどうなっているかとかが当初の関心事だった。
だがここまで読んだ結果、abandonedと同じような処理になるのだろう。

その辺を確認していきたい。

### mi_segment_alloc

前回のmi_segments_page_find_and_allocateで、segmentのspan_queueから空いているsliceを探して、
見つからなかったらreclaimを試して、
それでもダメだったらmi_segment_allocを呼ぶのだった。
tldという変数名だが上の方ではtldのsegmentsだったものだ。

これが見つからなかったのだからmi_segment_allocではtldのsegmentsを更新して、
古いsegmentsはどこかにぶら下げるんじゃないか、と予想される。

```
// Allocate a segment from the OS aligned to `MI_SEGMENT_SIZE` .
static mi_segment_t* mi_segment_alloc(size_t required, size_t page_alignment, mi_arena_id_t req_arena_id, mi_segments_tld_t* tld, mi_os_tld_t* os_tld, mi_page_t** huge_page)
{
  // calculate needed sizes first
  size_t info_slices;
  size_t pre_size;
  size_t segment_slices = mi_segment_calculate_slices(required, &pre_size, &info_slices);
  
  // Commit eagerly only if not the first N lazy segments (to reduce impact of many threads that allocate just a little)
  const bool eager_delay = (// !_mi_os_has_overcommit() &&             // never delay on overcommit systems
                            _mi_current_thread_count() > 1 &&       // do not delay for the first N threads
                            tld->count < (size_t)mi_option_get(mi_option_eager_commit_delay));
  const bool eager = !eager_delay && mi_option_is_enabled(mi_option_eager_commit);
  bool commit = eager || (required > 0);   

  ...

}
```

まずはsegment_slices, eagerなどのフラグの確認をしている。eagerとかは予想も出来るしたいして興味があるところでも無いので飛ばそう。

mi_segment_calculate_slicesはややこしいな。
pre_sizeはセグメントの最初のメタ情報のサイズだな。
mi_segment_tをOSのpage sizeでalignしたもの。

info_slicesはセキュリティ周りがあるとなんか挙動が変わるが、
それを無視すればpre_sizeがスライスいくつ分か、ということか。

segment_slicesはpre_sizeとrequiredを足したものがスライスいくつ分か、だな。

次はsegmentの確保。

```
  // Allocate the segment from the OS  
  mi_segment_t* segment = mi_segment_os_alloc(required, page_alignment, eager_delay, req_arena_id, 
                                              &segment_slices, &pre_size, &info_slices, commit, tld, os_tld);
  if (segment == NULL) return NULL;
```

mi_segment_os_allocは中も見たいが、一旦この先を見よう。
segmentを確保した後に何をしているか、をセキュリティとか初期を0で埋めるかとかを抜いて見てみる。


```
  // initialize the rest of the segment info
  const size_t slice_entries = (segment_slices > MI_SLICES_PER_SEGMENT ? MI_SLICES_PER_SEGMENT : segment_slices);
  segment->segment_slices = segment_slices;
  segment->segment_info_slices = info_slices;
  segment->thread_id = _mi_thread_id();
  segment->cookie = _mi_ptr_cookie(segment);
  segment->slice_entries = slice_entries;
  segment->kind = (required == 0 ? MI_SEGMENT_NORMAL : MI_SEGMENT_HUGE);

  // _mi_memzero(segment->slices, sizeof(mi_slice_t)*(info_slices+1));
  _mi_stat_increase(&tld->stats->page_committed, mi_segment_info_size(segment));
```

これはセグメントの初期化っぽくみえるな。
先に進もう。

```
  // reserve first slices for segment info
  mi_page_t* page0 = mi_segment_span_allocate(segment, 0, info_slices, tld);
  segment->used = 0; // don't count our internal slices towards usage
  
  // initialize initial free pages
  if (segment->kind == MI_SEGMENT_NORMAL) { // not a huge page
    mi_segment_span_free(segment, info_slices, segment->slice_entries - info_slices, false /* don't purge */, tld);
  }
  else {
    *huge_page = mi_segment_span_allocate(segment, info_slices, segment_slices - info_slices - guard_slices, tld);
  }

  return segment;
```

最初のpage0はセグメントの情報を書くので別扱いの模様。
kindはMI_SEGMENT_HUGEだった気がするのでそっちだけ読んでおこう。

mi_segment_span_allocateが呼ばれるが、これは前回見たな。
ここおでheapを初期化するんだっけ？
いや、ちらっと見直したがsegmentのslicesとかを初期化しているだけだな。

tldのsegmentsは誰が初期化するんだ？

そもそもの呼び出しもとを辿っていくと、mi_page_fresh_allocが以下のようになっている。

```
// allocate a fresh page from a segment
static mi_page_t* mi_page_fresh_alloc(mi_heap_t* heap, mi_page_queue_t* pq, size_t block_size, size_t page_alignment) {
  mi_page_t* page = _mi_segment_page_alloc(heap, block_size, page_alignment, &heap->tld->segments, &heap->tld->os);
  ...
}
```

`&heap->tld->segments`が以後はtldと呼ばれるのだが、ポインタなのでこれを更新すればいいのか。

もう一度segmentsを見てみるか。型はmi_segments_tld_sで以下。

```
// Segments thread local data
typedef struct mi_segments_tld_s {
  mi_span_queue_t     spans[MI_SEGMENT_BIN_MAX+1];  // free slice spans inside segments
  size_t              count;        // current number of segments;
  size_t              peak_count;   // peak number of segments
  size_t              current_size; // current size of all segments
  size_t              peak_size;    // peak size of all segments
  mi_stats_t*         stats;        // points to tld stats
  mi_os_tld_t*        os;           // points to os stats
} mi_segments_tld_t;
```

これはtldに入っている。
一方、segment_allocなどでallocateされているのはmi_segment_tで、型は以下。

```
// Segments are large allocated memory blocks (8mb on 64 bit) from
// the OS. Inside segments we allocated fixed size _pages_ that
// contain blocks.
typedef struct mi_segment_s {
  // constant fields
  mi_memid_t        memid;              // memory id for arena allocation
  bool              allow_decommit;
  bool              allow_purge;
  size_t            segment_size;

  // segment fields
  mi_msecs_t        purge_expire;
  mi_commit_mask_t  purge_mask;
  mi_commit_mask_t  commit_mask;

  _Atomic(struct mi_segment_s*) abandoned_next;

  // from here is zero initialized
  struct mi_segment_s* next;            // the list of freed segments in the cache (must be first field, see `segment.c:mi_segment_init`)
  
  size_t            abandoned;          // abandoned pages (i.e. the original owning thread stopped) (`abandoned <= used`)
  size_t            abandoned_visits;   // count how often this segment is visited in the abandoned list (to force reclaim it it is too long)
  size_t            used;               // count of pages in use
  uintptr_t         cookie;             // verify addresses in debug mode: `mi_ptr_cookie(segment) == segment->cookie`  

  size_t            segment_slices;      // for huge segments this may be different from `MI_SLICES_PER_SEGMENT`
  size_t            segment_info_slices; // initial slices we are using segment info and possible guard pages.

  // layout like this to optimize access in `mi_free`
  mi_segment_kind_t kind;
  size_t            slice_entries;       // entries in the `slices` array, at most `MI_SLICES_PER_SEGMENT`
  _Atomic(mi_threadid_t) thread_id;      // unique id of the thread owning this segment

  mi_slice_t        slices[MI_SLICES_PER_SEGMENT+1];  // one more for huge blocks with large alignment
} mi_segment_t;
```

つまりsegmentというのはtldやheapは保持していないように見えるな。
heapも確認しておこう。

```
// A heap owns a set of pages.
struct mi_heap_s {
  mi_tld_t*             tld;
  mi_page_t*            pages_free_direct[MI_PAGES_DIRECT];  // optimize: array where every entry points a page with possibly free blocks in the corresponding queue for that size.
  mi_page_queue_t       pages[MI_BIN_FULL + 1];              // queue of pages for each size class (or "bin")
  _Atomic(mi_block_t*)  thread_delayed_free;
  mi_threadid_t         thread_id;                           // thread this heap belongs too
  mi_arena_id_t         arena_id;                            // arena id if the heap belongs to a specific arena (or 0)  
  uintptr_t             cookie;                              // random cookie to verify pointers (see `_mi_ptr_cookie`)
  uintptr_t             keys[2];                             // two random keys used to encode the `thread_delayed_free` list
  mi_random_ctx_t       random;                              // random number context used for secure allocation
  size_t                page_count;                          // total number of pages in the `pages` queues.
  size_t                page_retired_min;                    // smallest retired index (retired pages are fully free, but still in the page queues)
  size_t                page_retired_max;                    // largest retired index into the `pages` array.
  mi_heap_t*            next;                                // list of heaps per thread
  bool                  no_reclaim;                          // `true` if this heap should not reclaim abandoned pages
};
```

ページの管理しかしていない。

なんか予想外だな。作ったsegmentsを管理しているのは誰だ？

うーん、そもそもspansに入らないとおかしいよな。
さっきのコードでそれっぽいのなんてmi_segment_span_freeくらいしか…あ、MI_SEGMENT_HUGEじゃないのか？

mi_segment_allocの呼び出しのrequiredが0か？
呼び出しもとを見直そう。

```
static mi_segment_t* mi_segment_reclaim_or_alloc(mi_heap_t* heap, size_t needed_slices, size_t block_size, mi_segments_tld_t* tld, mi_os_tld_t* os_tld)
{
  ...
  // 2. otherwise allocate a fresh segment
  return mi_segment_alloc(0, 0, heap->arena_id, tld, os_tld, NULL);  
}
```

0じゃん。という事は64KiBくらいだとMI_SEGMENT_NORMALなんだな。

この辺の定義を見直すと以下。

```
typedef enum mi_page_kind_e {
  MI_PAGE_SMALL,    // small blocks go into 64KiB pages inside a segment
  MI_PAGE_MEDIUM,   // medium blocks go into medium pages inside a segment
  MI_PAGE_LARGE,    // larger blocks go into a page of just one block
  MI_PAGE_HUGE,     // huge blocks (> 16 MiB) are put into a single page in a single segment.
} mi_page_kind_t;

typedef enum mi_segment_kind_e {
  MI_SEGMENT_NORMAL, // MI_SEGMENT_SIZE size with pages inside.
  MI_SEGMENT_HUGE,   // > MI_LARGE_SIZE_MAX segment with just one huge page inside.
} mi_segment_kind_t;
```

なるほど、page kindとsegment kindというのがあるのだな。

ページのkindは

- MI_PAGE_SMALL ... 8KiB以下のオブジェクト用
- MI_PAGE_MEDIUM ... 8KiBよりお大きく128KiB以下
- MI_PAGE_LARGE ... 16MiB以下
- MI_PAGE_HUGE ... 16MiB以上

で、SEGMENTはHUGEかHUGEじゃないかの二種類なのか。

mi_segment_allocに戻ろう。
segmentを作ったあとは以下が呼ばれる。

```
  mi_segment_span_free(segment, info_slices, segment->slice_entries - info_slices, false /* don't purge */, tld);
```

これは`tld->segments`のspansに先頭があるmi_span_queue_tに一つの大きなspanをぶら下げる事になる。
以後はここからallocateされていく。

segmentはどこにもぶら下げているようには見えないし、前のsegmentのnextに入れる処理も見当たらない。
sliceからしか辿れないように見える。
これではabandonedの時にたどる方法が無いので何か見落としがあると思うが、それはthread exitのコードを読めば分かると思うので、一旦そちらに進もう。