---
title: ファイルのリストとサムネイルのリストのLiveDataの更新時の同時性
layout: page
---

pngのDocumentFileのリストからサムネイルのListを作ってColumnで並べて表示したい、というような時。
最初はblankを表示してあとからlazy loadしたい。

その２つを別々のlivedataにしたら、更新タイミングが少しずれてobserveAsStateした側のstateの配列のOutOfBoundsアクセスでクラッシュする事がある。

```
    private val files = MutableLiveData(emptyList<DocumentFile>())
    private val thumbnails = MutableLiveData(emptyList<Bitmap>())

    private fun reloadBookList(parentDir: Uri) {
        listFiles(parentDir).also { flist->
            thumbnails.value = flist.map { blankBitmap }
            files.value = flist
            lifecycleScope.launch(Dispatchers.IO) {
                val thumbs = flist.map {
                    bookIO.loadThumbnail(it) ?: blankBitmap
                }
                withContext(Dispatchers.Main) {
                    thumbnails.value = thumbs
                }
            }
        }
    }
```

こういう複数LiveDataのオブジェクトの更新をまとめて同時にやるtransaction的な物は無いのかな？と少し見たが、そのものずばりは無さそう。

あるLiveDataの変更をトリガーに他のLiveDataを更新するTransofrmationsというのはあるのだが、
最初にブランクの一覧を表示して途中でロードした結果に差し替えたいので、Mutableな物が取れないと更新方法がわからないなぁ、
と思っていた所、switchMapのliveDataビルダーでemitを複数呼ぶ事が出来そう。

```
    private val files = MutableLiveData(emptyList<DocumentFile>())
    private val thumbnails =  Transformations.switchMap(files) { flist ->
        liveData {
            emit(flist.map { blankBitmap })
            withContext(lifecycleScope.coroutineContext + Dispatchers.IO) {
                val thumbs = flist.map {
                    bookIO.loadThumbnail(it) ?: blankBitmap
                }
                withContext(Dispatchers.Main) {
                    emit(thumbs)
                }
            }
        }
    }
```

毎回ここの中でlazy load的な事まで入れなくてはいけない、というのは制約が多い気もするが、実用上は困らないような気もする。

なんか複数LiveDataをまとめて更新出来れば十分なのでは？という気もするが、observeAsStateしたstate側のrecomposeがちゃんと同時に走る事が保証されるかとかは良くわかってないので、こういう仕組みでちゃんとまとめて反映される事が保証されるならまぁいいか、という気もする。

二回目のemitはwithContext要らん気もするんだが、たまにrecomposeが変なスレッドで走ってクラッシュするんだよなぁ。
もう治ってるのかもしれないが、一応くくっている。

ちなみにこのコードだと全部ロードが終わってからまとめて更新される訳だが、そこはあんまり数が無い前提の場所なのでしばらくはこれでいいか、と思って意図的にそうしている。

でもなんか危うい感じのコードだよなぁ。
ViewModelが複数のLiveDataを持つんじゃなくて、ViewModelだけがLiveDataで毎回全更新するが途中のrecomposeの引数が同じものがスキップされる、
みたいな風になっている方がいい気もする。次作る時はそういう作りでやってみよう。