---
title: mimallocコード読み、malloc_generic前篇
layout: page
---
malloc代替の一つ、mimallocを評価していたいら、なかなか早い。
汎用のアロケータはそんなに作りたいとは思わないのだけれど、
用途限定のアロケータはちょくちょく必要になるので、mimallocの気になる所だけ読んでメモしておきたい。

- ソース： [microsoft/mimalloc: mimalloc is a compact general purpose allocator with excellent performance.](https://github.com/microsoft/mimalloc)
- 論文： [Mimalloc: Free List Sharding in Action - Microsoft Research](https://www.microsoft.com/en-us/research/publication/mimalloc-free-list-sharding-in-action/)

## 論文のうち自分が興味ある所

自分は64KBくらいの固定サイズをたくさんとるようなアロケータを書きたいと思っているので、小さいサイズの工夫はあまり気にしない。
リファレンスカウントとかの最適化も気にしない。

### Fig. 1のデータ構造

とりあえずFig. 1の図がデータ構造の全体像で重要そう。

4MiBごとのセグメントを1単位として、この中に64KiBのページを複数持つらしい。
論文のFig. 1を見ると、pageというのはarenaのメタ情報を持つっぽいか？
で、pageにarenaのフリーリストなどを持つっぽい。
それらの親のheapという構造体もあり、この中にpage_directとpagesというのがあるが、これらが何なのかは良く分からない。
heapはtlbごとに持つっぽい。

8KiB以上のオブジェクトの場合はセグメント全体を一つのページとする、と書いてある。
自分的にはこのケースがどうなっているかが主な関心だ。
これだとpage arenaが無くなってしまうので嘘だと思うんだが、pageが一つで残り全部page arenaとする、という事かしら？

### 3つのフリーリスト

フリーリストをページごとに別々に持つ、というのがmimallocの工夫の一つらしい。
また、フリーリストが３つあるのも工夫らしい。

- Allocation Free List ... ここからアロケーションする
- Local Free List ... オーナーのスレッドのfreeは一旦ここに入れて、時期を見て上に移動する
- Thread Free List ... オーナー以外のスレッドによるfreeはここに入れる

Allocation Free Listにそのまま戻さない事で、定期的にこれを枯渇させて、枯渇した時にslow pathとしてその他のFree Listを管理したりする。

なおこの辺はすべてCASになっていて、ロックしないで作業している。この辺のコードは参考になる。

### ポインタからセグメントへのアクセス

セグメントを4MiBアラインさせる事で、ポインタの下位ビットをクリアする事でポインタからセグメントにアクセス出来る。
8KiB以上のページの場合これだけでページまで確定するのでフリーリストなどにアクセス出来るようになる。

### malloc_generic

slow pathの処理。heap構造体からそのサイズのページを先頭からなめていって、フリーリストがあったらそこから取って返す。
次回はそのフリーリストのあるページからになるようにページリストをローテートする、と書いてある。全部ずらすのかしら？

この時に空になったページはfreeしたりもするらしい。

複数セグメントの処理はなさそうなので、heapのpagesから全ページが辿れそうに見えるがどうやってたどるんだろう？

### 良く分からない事

セグメントがいっぱいになった時に次のセグメントが出来ると思うが、これは誰が管理するのか？

arenaのサイズが良く分からないな。ページのサイズと同じなのかしら？

tlbに入れておくという事はthread exitの時にこの構造をどこかに移動する必要があるが、それはどこで、その構造はそれ以後どう使われるのか？
特に別のスレッドがThread Free Listに要素をつなげた時に、これを確認する人が不在になってしまうと思うが。

8KiB以上の場合を前提とするならページとセグメントは同じ単位になってしまうので、セグメントのヘッダにメタ情報を持たせて、あとはarenaにしてしまって良さそうな気はする。
そうすると複数セグメントの管理が主体になりそうな気がする。この辺をコードを読んで確認したい。

## _mi_malloc_genericの周辺を読む

とりあえず複数セグメントの処理がどうなっているのかを見たい。malloc_genericでどうやってページを辿っているかを見ればこれが分かるんじゃないか。
これはpage.cの_mi_malloc_genericがそれっぽい。
シグニチャは以下。

```
// Generic allocation routine if the fast path (`alloc.c:mi_page_malloc`) does not succeed.
// Note: in debug mode the size includes MI_PADDING_SIZE and might have overflowed.
// The `huge_alignment` is normally 0 but is set to a multiple of MI_SEGMENT_SIZE for
// very large requested alignments in which case we use a huge segment.
void* _mi_malloc_generic(mi_heap_t* heap, size_t size, bool zero, size_t huge_alignment) mi_attr_noexcept
```

コメントにもあるように、huge_alignmentはほとんどのケースで0が来るので0と思って読んでおいて良さそう。

中のコードは、細かいコメントを取り除いて核になる部分だけ残すと以下みたいになっている。

```
  mi_page_t* page = mi_find_page(heap, size, huge_alignment);
  if (page == NULL) { // first time out of memory, try to collect and retry the allocation once more
    mi_heap_collect(heap, true /* force */);
    page = mi_find_page(heap, size, huge_alignment);
  }

  if (page == NULL) { // out of memory
    return NULL;
  }

  return _mi_page_malloc(heap, page, size, zero);
```

mi_find_pageでページのアロケーションもしているらしい。
ページが出来ると_mi_page_mallocでページから領域を切り出すっぽい。

この２つを見ていきたい。

まずはmi_find_pageを見ていこう。

### mi_find_free_page

mi_find_pageはMI_MEDIUM_OBJ_SIZE_MAXより小さければmi_find_free_pageを呼び出すだけ。
このmedium sizeは64bitマシンだと128KiBらしい。
自分が興味あるのは64KiBあたりなので、mi_find_free_pageを見ていけば良さそう。

セキュリティがどうこうとかを取り除くと以下。

```
static inline mi_page_t* mi_find_free_page(mi_heap_t* heap, size_t size) {
  mi_page_queue_t* pq = mi_page_queue(heap,size);
  mi_page_t* page = pq->first;

  if (page != NULL) {
    _mi_page_free_collect(page,false);

    if (mi_page_immediate_available(page)) {
      page->retire_expire = 0;
      return page; // fast path
    }
  }
  return mi_page_queue_find_free_ex(heap, pq, true);
}
```

mi_page_queueというのが出てくる。heapになんかキューがあるらしい。ここは後で読みたい。

最初のif文ではこのキューの最初のページの処理になっている。
このページだけ見てどうにかするのがfast path。

見つからなかったらmi_page_queue_find_free_exに進む。

mi_page_queue_find_free_exを読みたい所だが、その前にmi_page_queueを確認しておこう。

```
static inline mi_page_queue_t* mi_page_queue(const mi_heap_t* heap, size_t size) {
  return &((mi_heap_t*)heap)->pages[_mi_bin(size)];
}
```

_mi_binはそれなりにいろいろやっているけれど、基本的にはサイズから一対一で求まる何らかの固定値っぽく、heapの値などには依存していない。
だからheapのpagesの先頭からのインデックスでしかなさそう。

つまり、heapのpagesにはページサイズごとのキューのheadが入っている、という模様。

mi_page_queue_tを見ておくか。

```
// Pages of a certain block size are held in a queue.
typedef struct mi_page_queue_s {
  mi_page_t* first;
  mi_page_t* last;
  size_t     block_size;
} mi_page_queue_t;
```

mi_page_tも気になる所だが、ちらっと見たら結構大きかったので後回しにしたい。
ただmi_page_tにもnextとprevがあるので、同じ確保サイズに対応するページはリンクリストでつながっているらしい。

mi_find_free_pageに戻る。
一応mi_page_immediate_availableも確認しておこう。

```
// are there immediately available blocks, i.e. blocks available on the free list.
static inline bool mi_page_immediate_available(const mi_page_t* page) {
  mi_assert_internal(page != NULL);
  return (page->free != NULL);
}
```

ページのAllocation Free Listが空でなければtrueっぽい。

という事で本命っぽいmi_page_queue_find_free_exを見ていこう。

### mi_page_queue_find_free_exの前半

heapのpagesの先頭に空きがなければこれが呼ばれる。
セグメントに新しいページを確保して加えるのが期待される動作だが、
ミドルサイズの場合はセグメント一つにつき一ページのはずなのでどうしているのかを見たい。

まずは前半部分から。

```
static mi_page_t* mi_page_queue_find_free_ex(mi_heap_t* heap, mi_page_queue_t* pq, bool first_try)
{
  mi_page_t* page = pq->first;
  while (page != NULL)
  {
    mi_page_t* next = page->next; // remember next
    // 0. collect freed blocks by us and other threads
    _mi_page_free_collect(page, false);

    // 1. if the page contains free blocks, we are done
    if (mi_page_immediate_available(page)) {
      break;  // pick this one
    }

    if (page->capacity < page->reserved) {
      mi_page_extend_free(heap, page, heap->tld);
      break;
    }
    // 3. If the page is completely full, move it to the `mi_pages_full`
    // queue so we don't visit long-lived pages too often.
    mi_page_to_full(page, pq);

    page = next;
  } // for each page
  ...
}
```

ページキューのページから始めて、ページのnextを辿っている。
各ページに対して以下を実行する（コメントは0から始めているが以下はmdの都合で1からにする）

1. free_collectする
2. 空きがあればbreak
3. capacityに余裕がある（reservedで無い）ならextendしてbreak
4. ページが空きがなければmi_page_to_fullを呼んでmi_pages_fullに移す

4以外はまぁいいだろう。
4の呼び出しは以下のようになっている。

```
  mi_page_to_full(page, pq);
```

pageとpqだけを元に呼び出す何か。
ではmi_page_to_fullを見てみる。

```
static void mi_page_to_full(mi_page_t* page, mi_page_queue_t* pq) {
  if (mi_page_is_in_full(page)) return;
  mi_page_queue_enqueue_from(&mi_page_heap(page)->pages[MI_BIN_FULL], pq, page);
  _mi_page_free_collect(page,false);  // try to collect right away in case another thread freed just before MI_USE_DELAYED_FREE was set
}
```

mi_page_in_fullはpage自身にそういうフラグがあって立っているかをチェックしている。

興味深い作業をしているのはmi_page_queue_enqueue_from。

MI_BIN_FULLは以下のように定義されている。

```
#define MI_BIN_FULL  (MI_BIN_HUGE+1)
```

HUGEのbinの隣にそういうbinがあるらしい。
これはサイズに関係なくフルなページは全部ここにつなげている模様。へー。

mi_page_heapでpageからヒープを取れるのもへーって感じだが、それは置いとく。

```
static void mi_page_queue_enqueue_from(mi_page_queue_t* to, mi_page_queue_t* from, mi_page_t* page) {

  mi_heap_t* heap = mi_page_heap(page);

  if (page->prev != NULL) page->prev->next = page->next;
  if (page->next != NULL) page->next->prev = page->prev;

  if (page == from->last)  from->last = page->prev;
  if (page == from->first) {
    from->first = page->next;
    // update first
    mi_heap_queue_first_update(heap, from);
  }

  page->prev = to->last;
  page->next = NULL;

  if (to->last != NULL) {
    to->last->next = page;
    to->last = page;
  }
  else {
    to->first = page;
    to->last = page;
    mi_heap_queue_first_update(heap, to);
  }

  mi_page_set_in_full(page, mi_page_queue_is_full(to));
}
```

C言語の線形リスト特有のコードだがいろいろやっているのでちょっと真面目に読む。

最初の以下はpageをpageのリストから抜いている。

```
  if (page->prev != NULL) page->prev->next = page->next;
  if (page->next != NULL) page->next->prev = page->prev;
```

次にキューのfirstかlastだったらキューを更新している。（キューからなくなるので）

```
  if (page == from->last)  from->last = page->prev;
  if (page == from->first) {
    from->first = page->next;
    // update first
    mi_heap_queue_first_update(heap, from);
  }
```

lastだったら一つ前、というのはいい。
firstは単にnextを入れるだけでは無いのか？
少し眺めるとMI_SMALL_SIZE_MAXより大きいと何もしてないので、
小さいオブジェクトの時のdirect array的な最適化のための処理っぽい。
じゃあ無視していいか。

以上でpageのリストから抜いてfromのキューからも抜いた。
次はtoに加えるだけに思えるが、どうだろう？

```
  page->prev = to->last;
  page->next = NULL;

  if (to->last != NULL) {
    to->last->next = page;
    to->last = page;
  }
  else {
    to->first = page;
    to->last = page;
    mi_heap_queue_first_update(heap, to);
  }
```

最後のmi_heap_queue_first_updateは先程ちらっと見た関係ないヤツなので無視。
toが空じゃなければtoのlastの次に加えてtoのlastを更新し、
toが空だったらfirstもlastもpageとなる。

この辺は単なる線形リストの処理だな。

最後が以下。

```
  mi_page_set_in_full(page, mi_page_queue_is_full(to));
```

これはキューがfullのリストだったらpageにフラグを立てているのかな。

なんか思ったよりも大した事してなかったな。
名前から予想される事しかしてないので読まなくても良かったか。まぁこんな日もある。

とにかく、mi_page_to_fullというのはサイズ関係なくいっぱいになったページを特別に入れておく場所があるらしい。
このページのthread free listに追加したら誰がこれを処理するのか？というのは気になる所だな。
あとで調べたい。


### mi_page_queue_find_free_exの後半

```
static mi_page_t* mi_page_queue_find_free_ex(mi_heap_t* heap, mi_page_queue_t* pq, bool first_try)
{
  // 前半、ページをなめて空きページを探す
  // ...

  // 後半

  mi_heap_stat_counter_increase(heap, searches, count);

  if (page == NULL) {
    _mi_heap_collect_retired(heap, false); // perhaps make a page available?
    page = mi_page_fresh(heap, pq);
    if (page == NULL && first_try) {
      // out-of-memory _or_ an abandoned page with free blocks was reclaimed, try once again
      page = mi_page_queue_find_free_ex(heap, pq, false);
    }
  }
  else {
    page->retire_expire = 0;
  }
  return page;
}
```

mi_heap_stat_counter_increaseはheap.stat.searchs的なのを上げるっぽい。まぁいいだろう。

興味があるのはpageが無かった場合だ。
mi_page_freshがそれっぽいが、とりあえずその前の_mi_heap_collect_retiredも少し気になる。
ちらっとコードを見たらheapのpagesの中のretiredという範囲を探して空のページが無いかを探しているな。
なんかこれはレアな最適化っぽいから気にしなくていいか。

という事でmi_page_freshが本命っぽい。

mi_page_queue_find_free_exとしては、
前半で空きpageがあればそれをreturnして、
なければmi_page_freshをreturnする。

という事でmi_page_freshを見てみよう。

### mi_page_fresh前半

assesrtを取っ払うと以下。

```
static mi_page_t* mi_page_fresh(mi_heap_t* heap, mi_page_queue_t* pq) {
  return mi_page_fresh_alloc(heap, pq, pq->block_size, 0);
}
```

mi_page_fresh_allocを見ると以下。

```
// allocate a fresh page from a segment
static mi_page_t* mi_page_fresh_alloc(mi_heap_t* heap, mi_page_queue_t* pq, size_t block_size, size_t page_alignment) {
  mi_page_t* page = _mi_segment_page_alloc(heap, block_size, page_alignment, &heap->tld->segments, &heap->tld->os);
  if (page == NULL) {
    // this may be out-of-memory, or an abandoned page was reclaimed (and in our queue)
    return NULL;
  }

  // a fresh page was found, initialize it
  const size_t full_block_size = ((pq == NULL || mi_page_queue_is_huge(pq)) ? mi_page_block_size(page) : block_size); // see also: mi_segment_huge_page_alloc

  mi_page_init(heap, page, full_block_size, heap->tld);
  mi_heap_stat_increase(heap, pages, 1);
  if (pq != NULL) { mi_page_queue_push(heap, pq, page); }
  return page;
}
```

_mi_segment_page_allocを呼んでページを作り、そのページを初期化しているようにみえる。
_mi_segment_page_allocは名前を信じるならセグメントから作ってそうで、
セグメントがいっぱいの時の処理が無いように見えるがどうなっているんだろう？

_mi_segment_page_allocを見ていきたいが、
まず呼び出しの引数を確認してみよう。

```
  mi_page_t* page = _mi_segment_page_alloc(heap, block_size, page_alignment, &heap->tld->segments, &heap->tld->os);
```

`heap->tld->segments`と`heap->tld->os`というのを渡している。
tldはthread local dataとの事。

定義を見ると以下。

```
// Thread local data
struct mi_tld_s {
  unsigned long long  heartbeat;     // monotonic heartbeat count
  bool                recurse;       // true if deferred was called; used to prevent infinite recursion.
  mi_heap_t*          heap_backing;  // backing heap of this thread (cannot be deleted)
  mi_heap_t*          heaps;         // list of heaps in this thread (so we can abandon all when the thread terminates)
  mi_segments_tld_t   segments;      // segment tld
  mi_os_tld_t         os;            // os tld
  mi_stats_t          stats;         // statistics
};
```

heapsの所がちょっと予想外で、スレッド一つにheapは複数あるの？
良くわからんが後で分かる事を期待して先に進む。

segmentsを見てみよう。

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

spanというのが何なのかは知らないけれど、このスレッド内のセグメントの統計情報っぽい。
まぁいいか。

_mi_segment_page_allocを見てみよう。

```
mi_page_t* _mi_segment_page_alloc(mi_heap_t* heap, size_t block_size, size_t page_alignment, mi_segments_tld_t* tld, mi_os_tld_t* os_tld) {
  mi_page_t* page;
  // ...
  return mi_segments_page_alloc(heap,MI_PAGE_MEDIUM,MI_MEDIUM_PAGE_SIZE,block_size,tld, os_tld);
}
```

サイズとかalignで分岐があるが、今興味あるのはここなのでここを見る。

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

おー、セグメントに空きが無い時に新しいセグメントを作ってるっぽい。知りたい事の核心に近づいてそうだ。

page_sizeとslices_neededは先で使っているのでちょっと見ておくか。

MI_SEGMENT_SLICE_SIZEは64KiBっぽい。MI_MEDIUM_PAGE_SIZEは512KiBっぽい。
512KiBより小さければ64KiBでalign_upするって事か。

slices_neededは64KiBでalignしたサイズを64KiBで割っている。
64KiBを何個使うか、というのを表しているな。
スライスとは64KiB単位のなにかかしら？

mi_segments_page_find_and_allocateはセグメントからページを取り出す感じで、
これが失敗するとセグメントがいっぱいの時の処理でたぶんmi_segment_reclaim_or_allocがそれっぽい。

mi_segment_reclaim_or_allocが一番興味ある所だが、
その前にmi_segments_page_find_and_allocateがMEDIUM_SIZEの時にどうなっているのかは確認したいな。見てみよう。

### mi_segments_page_find_and_allocate

セグメントからページを確保すると思われるコード。
まず最初のassertを見てみる。

```
static mi_page_t* mi_segments_page_find_and_allocate(size_t slice_count, mi_arena_id_t req_arena_id, mi_segments_tld_t* tld) {
  mi_assert_internal(slice_count*MI_SEGMENT_SLICE_SIZE <= MI_LARGE_OBJ_SIZE_MAX);
  ...
}
```

MI_SEGMENT_SLICE_SIZEは64KiB、MI_LARGE_OBJ_SIZE_MAXは32MiBとの事。
64KiB以上32MB以下の処理をする関数との事なので、64KiBに関心がある自分としてはこれが主なセグメントからの切り出し担当という事で良さそうだ。

続きを見ていこう。

```
  mi_span_queue_t* sq = mi_span_queue_for(slice_count, tld);
  if (slice_count == 0) slice_count = 1;
  while (sq <= &tld->spans[MI_SEGMENT_BIN_MAX]) {
    for (mi_slice_t* slice = sq->first; slice != NULL; slice = slice->next) {
      ...
    }
    sq++;
  }
```

mi_span_queue_forというものでspan_queueというものを取り出している。
なんだこれ？pagesと何が違うんだろう？
以前に見たTLDになんか入ってたな。

```
// Segments thread local data
typedef struct mi_segments_tld_s {
  mi_span_queue_t     spans[MI_SEGMENT_BIN_MAX+1];  // free slice spans inside segments
  ...
};
```

うーむ、なんか良くわからんな。
pagesにpage queueがあってそれを辿って見た後の処理のはずなのに、
なんでまた似たようなキューがあるのだろう？

良く分からないけれど、TLDにslice_countごとに分かれたspan queueというのがあって、
それを取り出して、そこより上のspan queueを見ていくのがwhile文だな。
これはより大きなspan sliceでも良い、というような最適化と思われる。

感覚的にはページを新しく取るのだから、sliceのサイズごとのキューに分ける意義は良く分からない。
これからページを区切ってどうこうするのだから。

考えられるとするなら、ページサイズが違う、という可能性だな。
MEDIUM_SIZEの中でもサイズによってページサイズを何種類か用意している、
ページ内フラグメンテーションを減らしたいのであんまり小さすぎるページは使いたくないが、
余らせたくもないので大きすぎるのも嫌だ。
でも取り直すほど嫌でも無い、みたいな中途半端な感じなんだろうか。

whileの中のfor文ではこのslice queueを順番に見ていく、という事をしているな。
forの中をもう一度見てみよう。

```
for (mi_slice_t* slice = sq->first; slice != NULL; slice = slice->next) {
  if (slice->slice_count >= slice_count) {
    // found one
    mi_segment_t* segment = _mi_ptr_segment(slice);
    if (_mi_arena_memid_is_suitable(segment->memid, req_arena_id)) {
      ...
      return page;
    }
  }
}
```

目的のサイズのslice_countよりも大きいslice_countを持つsliceを探す、というのがこのfor文の目的のようだ。
見つけたら、セグメントのmemidとreq_area_idを比較している。なんだこれ？
良く分からないので少し先を読んで戻ってこよう。

一致していたらif文の中に入る。
そして以下が実行される。

```
// found a suitable page span
mi_span_queue_delete(sq, slice);

if (slice->slice_count > slice_count) {
  mi_segment_slice_split(segment, slice, slice_count, tld);
}
mi_page_t* page = mi_segment_span_allocate(segment, mi_slice_index(slice), slice->slice_count, tld);
if (page == NULL) {
  // commit failed; return NULL but first restore the slice
  mi_segment_span_free_coalesce(slice, tld);
  return NULL;
}
return page;
```

span_queueからこのスライスというのを抜いて、
スライスカウントが余っていたらこれをsplitというのをしている。
ふむ。
ここを見るとスライスとかスパンが何なのか分かりそうだが、
入っていく前にここで何をやっているか見てみたい。
名前から予想するにたぶんスライスというのを必要なサイズだけに切り取ってあまりは別のスライス用にどこかに収めるのだろう。
（追記：この予想は誤っていた）

という事で自分のサイズのスライスが得られたので、
そこからページを取り出して返しているように見える。

ではmi_segment_slice_splitを見てみよう。

```
static void mi_segment_slice_split(mi_segment_t* segment, mi_slice_t* slice, size_t slice_count, mi_segments_tld_t* tld) {
  if (slice->slice_count <= slice_count) return;
  size_t next_index = mi_slice_index(slice) + slice_count;
  size_t next_count = slice->slice_count - slice_count;
  mi_segment_span_free(segment, next_index, next_count, false /* don't purge left-over part */, tld);
  slice->slice_count = (uint32_t)slice_count;
}
```

mi_slice_indexというのは以下。

```
static inline size_t mi_slice_index(const mi_slice_t* slice) {
  mi_segment_t* segment = _mi_ptr_segment(slice);
  ptrdiff_t index = slice - segment->slices;
  return index;
}
```

segmentのslicesという所にスライスの一覧が入り、そのオフセットがslice indexと呼ばれるらしい。
こちらはサイズとかは関係なくて固定数ある。
そしてスライスからspanというものを切り出してここからページを取り出す。
スパンはサイズごとに別々のspanを作るものっぽいな。

mi_segment_slice_splitに戻ろう。next_indexとnext_countとはなんなんだろうか？

```
  size_t next_index = mi_slice_index(slice) + slice_count;
  size_t next_count = slice->slice_count - slice_count;
  mi_segment_span_free(segment, next_index, next_count, false /* don't purge left-over part */, tld);
```

64KiBを２つのサイズ、例えば120KiBを要求している時に、ヒットしたスライスがslice_count8だった場合、
next_countは6になる。これはまぁ分かる。スライスというのを2と6に分割するんだろう。

でもnext_indexは意味が分からない。なんだこれ？
見つけたスライスのインデックスにslice_countを足している。なんかスライスのインデックスとスライスのカウントってなんか関係あるのか？

さっぱり意味が分からないので、スライスとスパンを根本的に誤解している気がする。
スライスとは何かをもうちょっと調べてみる。

### スライスとは何か？を調べる

まずslicesの個数から確認しよう。

```
typedef struct mi_segment_s {
  ...
  mi_slice_t        slices[MI_SLICES_PER_SEGMENT+1];  // one more for huge blocks with large alignment
} mi_segment_t;
```

MI_SLICES_PER_SEGMENTはいくつだ？

```
#define MI_SLICES_PER_SEGMENT             (MI_SEGMENT_SIZE / MI_SEGMENT_SLICE_SIZE) // 1024
```

コメントによると1024らしいが、一応確認しておこう。

MI_SEGMENT_SIZEは32MiBらしい。これは論文では4MiBといっているが64bitアーキテクチャだと32MiBにしているらしい。

で、MI_SEGMENT_SLICE_SIZEは64KiBらしい。
おや？MI_SLICES_PER_SEGMENTは1024じゃなくて512じゃん。コメントを信じてはいけないな。

さて、以上を踏まえて少し認識を改める必要がありそうだ。
スライスというのはどうも64KiBの単位のことっぽいな。
32MBのセグメントを64KiBのスライス単位に分けているのか？なんか1引かなくていいのか少し不安になるが、
その辺は置いとこう。

とにかく、スライスは64KiB単位の連続領域と思って良さそうだ。
先程のスライスを分割してスパンを取り出す、という予測は間違っていそうだ。

スライスをまとめてスパンとする、が正しそうだな。この認識でさっき分からなかった所を読み直してみよう。

### mi_segment_slice_split再訪

さっき意味の分からなかったnext_indexとnext_countを見直してみる。

```
  size_t next_index = mi_slice_index(slice) + slice_count;
  size_t next_count = slice->slice_count - slice_count;
  mi_segment_span_free(segment, next_index, next_count, false /* don't purge left-over part */, tld);
```

開いているスライスというのは、先頭にslice_countを持って、その後に続くスライスは全部slice_countを0にしておくんじゃないか。
こうして連続のスライスを先頭で管理する。

例えばスライスが8個連続で余っていて、そこから2個とったとすれば、残りは6個になる。
そして残りの6個の先頭は3番目のスライスとなる。

next_indexというのは次のスライスの先頭という事か。
そしてその次のspan freeというのは、連続するsliceの先頭を適切に初期化して、
後ろを全部0に埋める的な事をするんじゃないか？

mi_segment_span_freeは結構長くてややこしいが、関連してそうな所を抜き出すと以下のような感じになっている。

```
  // set first and last slice (the intermediates can be undetermined)
  mi_slice_t* slice = &segment->slices[slice_index];
  slice->slice_count = (uint32_t)slice_count;
  mi_assert_internal(slice->slice_count == slice_count); // no overflow?
  slice->slice_offset = 0;
  if (slice_count > 1) {
    mi_slice_t* last = &segment->slices[slice_index + slice_count - 1];
    last->slice_count = 0;
    last->slice_offset = (uint32_t)(sizeof(mi_page_t)*(slice_count - 1));
    last->xblock_size = 0;
  }
```

先頭に空きslice_countをつけていて、最後に何か設定をしていて、間は何もしていないな。
最後のページのclide_offsetやxblock_sizeなどは良く分からないが、スライスの連続領域から切り出しているだけ、というのは正しそうだ。

この後以下をやっている。

```
  // and push it on the free page queue (if it was not a huge page)
  if (sq != NULL) mi_span_queue_push( sq, slice );
             else slice->xblock_size = 0; // mark huge page as free anyways
```

切り出したスライスをspan_queueに入れている。

これはようするにスライスの連続領域をフリーリストで管理しているという事だな。
slab allocator的な事をしているのでは無くて、単純に先頭からfirst fitで切り出しているんだな。

予想とはだいぶ違う挙動だが、64KiB以上はこうだ、という事の模様。ふむふむ。

これとページやarenaの関係がまだ良く分からないが、mi_segments_page_find_and_allocateのあたりは割と理解出来た気がする。

### ここまでを簡単に振り返る

呼び出しは以下のように進んできている。

- _mi_malloc_generic
  - mi_find_page
    - mi_find_free_page
       - mi_page_queue_find_free_ex
          - mi_page_fresh
             - mi_segments_page_alloc
               - mi_segments_page_find_and_allocate

そしてサイズはいくつが来ているかを見直していくと、
_mi_segment_page_allocの所でMI_MEDIUM_PAGE_SIZEを渡しているな。
これが512KiBなので、mi_segments_page_find_and_allocateとしてはスライスから512KiBを取り出す、という事をしている模様。

512KiBというのは64KiBを単位とするなら随分小さい気もするんだが、そういうものらしい。
そしてこの512KiBをfirst fitで取り出して、残った領域はslice queueで管理している模様。

512KiBをどう使うのか、という問題と、
そもそもスライスが無かったらどうするのか、
という２つの重要な問題はまだ分かっていないが、長くなってきたので一旦ここまでで最初のポストとする。