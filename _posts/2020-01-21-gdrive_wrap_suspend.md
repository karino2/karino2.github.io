---
title: Google Driveのアクセスをsuspend関数でラップする
layout: page
---

以下を復習してから読むと良い。
[使うだけに絞ったsuspend関数入門 | karino2の暇つぶしプログラム教室 kotlin編](https://karino2.github.io/kotlin-lesson/suspend_intro.html)

ブロッキングなリクエストのコードがあった時にsuspend関数にする方法。

### あらすじ

kotlinを教えるべく、Google Driveをバックエンドにしたメモアプリを書いてもらっていた所、以下のようなコードが来た。

[DriveText:MainActivity.kt](https://github.com/harukawa/DriveText/blob/876f8df92ba1b8dfbabdeb7102e6675958109ed2/app/src/main/java/com/github/harukawa/drivetext/MainActivity.kt#L260-L269)

```
suspend fun downLoadFile(googleDriveService: Drive, id : String, name : String) {

    // Download file refers to https://developers.google.com/drive/api/v3/manage-downloads
    val outputStream: ByteArrayOutputStream = ByteArrayOutputStream()
    googleDriveService.files().get(id).executeMediaAndDownloadTo(outputStream)
    openFileOutput(name, Context.MODE_PRIVATE).use{
        it.write(outputStream.toByteArray())
    }
    outputStream.close()
}
```

そしてAndroidStudio上ではsuspendの所がグレーアウトされてて、「この関数suspendつける必要無いよ」的なツールチップが出る。

Driveというのは`com.google.api.services.drive`にある物らしい。
[googleapis/google-api-java-client: Google APIs Client Library for Java](https://github.com/googleapis/google-api-java-client) かな？

上記コメントのリンク先を見てもいまいち実行しているスレッドとか良く分からないが、
以下の行のexecuteMediaAndDownloadToを呼ぶと呼んだスレッド内でブロッキングで実行されるっぽい。

```
googleDriveService.files().get(id).executeMediaAndDownloadTo(outputStream)
```

つまり上記のコードは全部同じスレッドで呼ばれるので、suspendによるコード分割がされる所は無い。だからsuspendをつける意味が無いので、上記のコードはたぶん誤っている。

ただ気分的にはきっと、executeMediaAndDownloadToはUIスレッドで呼んではいけない、
という事は分かってて、別のスレッドで実行したいのだろう。
そこで良く分からんけどsuspendをつけたのだと思う。

downLoadFile関数を呼ぶ側はどうなっているかというと

```
launch(Dispatchers.Default) {
// ... 中略 ...
    downLoadFile(googleDriveService, file.id.toString(), fileName)
```

となっている。
これだとMainじゃないから別スレッドで実行はされるが、suspend関数である必要は全く無い。

という事でこれをどうsuspend関数でラップするのが正しいのか、というのが今回のお題。

英語のスペルがどうとかそういうのはいい。


### 実行するスレッドを考える

suspend関数でラップする場合は、非同期なAPIの方が都合が良い。
という事で少しこのライブラリを調べてみたが、信じがたい事に非同期実行の口が無いっぽい？
という事で、この場合は適当なスレッドでexecuteMediaAndDownloadToを実行するように直さないといけない。（長いので以下executeと呼ぶ事にする）

で、実行するスレッドはDispatchersを眺めて考える。

[Dispatchers - kotlinx-coroutines-core](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-dispatchers/index.html)

ぱっと見はDispatchers.IOかな。
Dispatchers.IOはDispatchers.Defaultと同じスレッドらしいのでちゃんと作るならもっと考えないといけないが、ブロッキングなリクエストをとりあえずAndroidで呼びたいという時にはまずはDispatchers.IOでwithContextすれば良いでしょう。

### 別のスレッドで実行したい時はwithContextを使う

executeを実行するスレッドをこのDispatchers.IOの管轄のスレッド化にしたい。
こういう目的では、withContextを使うのが良い。

[withContext - kotlinx-coroutines-core](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/with-context.html)


するとこんな感じになる。

```
suspend fun downLoadFile(googleDriveService: Drive, id : String, name : String) {
    // この行が増えた
    withContext(Dispatchers.IO) {

        // Download file refers to https://developers.google.com/drive/api/v3/manage-downloads
        val outputStream: ByteArrayOutputStream = ByteArrayOutputStream()
        googleDriveService.files().get(id).executeMediaAndDownloadTo(outputStream)
        openFileOutput(name, Context.MODE_PRIVATE).use{
            it.write(outputStream.toByteArray())
        }
        outputStream.close()

    }
}

```

withContextの所でsuspend関数のコード分割がされるので、上記のコードはsuspend関数である意味がある。
ちなみに各コードがどのスレッドで実行されるかは理解しておく方が良いので、軽く説明してみる。

```
suspend fun downLoadFile(googleDriveService: Drive, id : String, name : String) {
    // ここまで親のDispatcherのスレッド

    withContext(Dispatchers.IO) {
        // ここからDispatchers.IOのスレッド
    }

    // ここからまた親のDispatcherのスレッド
}

```

となる。

### downLoadFileを呼ぶ側を直す

さて、元のコードではDispatchers.DefaultでIO的な作業もそれ以外の物も全部行ってしまっていた。

```
launch(Dispatchers.Default) {
    // Android的な処理いろいろ
    ... 省略1 ...

    // 本当はここだけIOスレッドにしたい
    downLoadFile()

    // Android的な処理いろいろ
    ... 省略2 ...
}
```

これではsuspend関数の意義が無い。具体的にはリクエストが終わったあとにUIスレッドで画面を更新したりが出来ない。
というのは上記の省略1も省略2も元のコードではdownLoadFileも全部Dispathcers.Defaultの管轄下のスレッドで行われてしまうから。

という事でdownLoadFileをちゃんと直した今では、省略1と省略2の所はUIスレッドで行うように直せる。こんな感じ。


```
// この行だけ変更した
launch {
    // Android的な処理いろいろ
    ... 省略1 ...

    // downLoadFileの中でwithContextで囲まれている所だけIOスレッドで実行される。
    // だが、コード分割がなされて順番に実行される事が保証される
    downLoadFile()

    // Android的な処理いろいろ
    ... 省略2 ...
}
```

こうする事で省略1と省略2の所をこのコードを実行している所のCoroutineScope（上記githubのリンクからコードを見ると分かるようにDispatchers.Mainになっている）で実行される。
だから省略2の所でListViewのupdateをしたりが出来る。

### おわりに

とりあえずwithContextでくくると別のスレッドで実行出来て、
そのブロックの前後がsuspend関数の仕組みでコード分割されて順番が保証される。

表面的な事を言えば、ブロッキングのAPIをラップする時はwithContext、コールバックの非同期APIをラップする時はstartCoroutineと覚えておけば良い。

最終的にはそもそもに元のコードが何故おかしいのかとかちゃんと理解した方が良いが、
最初は実際に間違えて訂正してもらう方が話が具体的で分かりやすいと思うので、
今回のケース限定で余計な事はせずに単に正解を書くだけの解説にしてみた。