---
title: AndroidのtargetSdkVersionを35に上げる作業
layout: page
---
重い腰を上げて自作アプリのtargetSDKVersionを35に上げる作業をする。

以下最新のAndroid Studioで開いて適当にはいはい言ってUpgradeをいろいろして、
build.gradleのcompileSdkとtargetSdkVersionを35にして何をやってるかわかってる的なやつを選ぶ（わかってないが）、
まではやった上で出てきた問題のメモ。

## 統計グラフ！

### PendingIntentのFLAG_IMMUTABLEが無い

FLAG_IMMUTABLEかFLAG_MUTABLEをつける必要があるらしい。
とりあえずFLANG_IMMUTABLEをつけて先に進み、問題が出たらMUTABLEを検討する。

### POST_NOTIFICATIONのpermissionが必要になった

AndroidManifest.xmlに追加する。

### NotificationServerからNo Channel found for pkg〜というメッセージが出てNotificationが出ない

Geminiに聞いたら、Notification Channelの作り方を教えてくれて、そこから貼られてたlinkから以下に行き着く。

[Create and manage notification channels  -  Views  -  Android Developers](https://developer.android.com/develop/ui/views/notifications/channels)

Notificationがうるさいから個別に消せるようにする、みたいなの、なんかセンスを感じないなぁ。

以下のような関数を作ってnotificationを表示する前に毎回呼ぶ。

```
  public static void createNotificationChannel(Context context, NotificationManager notificationManager) {
      String channelName = context.getString(R.string.notification_title) + " Channel";
      NotificationChannel channel = new NotificationChannel(UpdateChecker.CHANNEL_ID, channelName, NotificationManager.IMPORTANCE_LOW);
      notificationManager.createNotificationChannel(channel);
  }
```

### JUnitが3から4に

なんかgeiminiに聞きながらTestCaseの継承をアノテーションに変えたりする。

### kotlin-stdlibとかがDuplicate Classだとかなんだとか

```
Execution failed for task ':app:checkDebugDuplicateClasses'.
> A failure occurred while executing com.android.build.gradle.internal.tasks.CheckDuplicatesRunnable
   > Duplicate class kotlin.collections.jdk8.CollectionsJDK8Kt found in modules kotlin-stdlib-1.8.22.jar -> kotlin-stdlib-1.8.22 (org.jetbrains.kotlin:kotlin-stdlib:1.8.22) and kotlin-stdlib-jdk8-1.6.21.jar -> kotlin-stdlib-jdk8-1.6.21 (org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.6.21)
```

みたいなのが出るように。build.gradleのandroidの中に

```
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
```

を定義し、
先頭の

```
apply plugin: 'com.android.application'
```

を

```
plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android' version '1.8.22'
}
```

に変える。

###  antlrがno viable alternative atうんたら、というワーニングが出る

```
line 1:4 no viable alternative at character ' '
```

もう元の文法ファイルから生成させるのも困難ないにしえのLexerなので、QLexerのreportErrorをオーバーライドして、
空白のこのメッセージの時だけ無視する。

## いつなに


### ランチャーアイコン

アイコンが小さくなってしまったのでAsset Studioでアイコンを設定する。Asset Studioは以下に移動していた。

View＞Tool Window＞Resourece Manager

+を押してImageで512x512のアイコンを選びTrimを選ぶ。バックグラウンドはカラーで白を選んでおく。

### Data Safetyのセクションを埋める

昔設定した気がするのだが、なんかされてないとの事なのでする。
場所が分かりにくいが左のメニューの下の方のApp contentから行けた。

advertising IDを使ってない、と言うだけだった…

## カキオク

Composeがあるのでなかなか苦戦。

### namespaceの追加

```
android {
  namespace = "io.github.karino2.kakioku"
  ...
}
```

### Compose関連のバージョン合わせ、プラグイン以外

相変わらずいろいろなパズルを合わせて答えを出す必要があり、geminiも良く分からないとか言い出す始末。
JVM targetなどは以下を参考にした。

- [Compose to Kotlin Compatibility Map  -  Jetpack  -  Android Developers](https://developer.android.com/jetpack/androidx/releases/compose-kotlin)


```
    kotlinOptions {
        jvmTarget = '19'
    }
    buildFeatures {
        compose true
    }
    composeOptions {
        kotlinCompilerExtensionVersion "1.5.15"
    }
```

そしたらJavaのVMのターゲットがうんたらとか言われたのでgeminiに聞いて以下を追加。

```
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_19
        targetCompatibility = JavaVersion.VERSION_19
    }
```

モジュールレベルのbuild.gradleの方では、以下のバージョンとする。

```
       classpath 'com.android.tools.build:gradle:8.7.1'
       classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:2.0.21"
```

これでも通らなかったので調べた所、Compose Compiler Gradle Pluginを使えとのこと。

### Compose Compiler Gradle Pluginとversion catalogsの導入

ドキュメントは以下。

[Compose Compiler Gradle plugin  -  Jetpack Compose  -  Android Developers](https://developer.android.com/develop/ui/compose/compiler)

とりあえず通す最小限の作業をしたいと思ったが、
ドキュメントを解読して現状のgroovyに適応するのはミスが生まれそうなので、
ドキュメント通りにversion catalogsを導入した。

まず、gradle/下にlibs.versions.xmlをtouchで作って、書かれている内容をコピペする。

次にモジュールレベルのbuild.gradleに以下を追加

```
// https://developer.android.com/develop/ui/compose/compiler
plugins {
    alias(libs.plugins.compose.compiler) apply false
}
```

そしてアプリの方のbuild.gradleに以下を追加


```
plugins {
  ...
  alias(libs.plugins.compose.compiler)
}
```

これでcomposeのビルドが通るようになった。

作業を進めているうちにversion catalogsの理解が深まってこれ無しで良かったな〜、と思ったが、
今後コピペしやすいように推奨にしておくか、という気分ではいる。
あまりセンスがあるとは思わないが…


### アイコンを更新するとpainterResourceでエラーになる

Asset Studioでランチャーアイコンを差し替えた所、painterResourceの所で以下のエラーになる。

```
 java.lang.IllegalArgumentException: Only VectorDrawables and rasterized asset types are supported ex. PNG, JPG, WEBP
 ```

どうもanydpiの下にxmlがあって、これのロードの時に怒られているようだ。解決策をググっても全部のpainerResourceの所を直す必要があるのばかりでさすがにやってられないので、
ひとまずanydpiのフォルダごと削除。

### Columnでweightを指定している所が高さ0になってしまう

これはweightを指定していない所のBottomNavigationの中に、fillMaxHeightのButtonがあったせいだった。
兄弟の中で最大、くらいの挙動を期待していた（し、以前はそう動いていた）が、
現在は画面いっぱいを占めるように広がってしまう模様。

自分の期待している動作は親のBottomNavigationのmodifierにmodifier.heightでIntrinsicSizeのMinを指定するのがそれっぽい。

[Intrinsic measurements in Compose layouts  -  Jetpack Compose  -  Android Developers](https://developer.android.com/develop/ui/compose/layouts/intrinsic-measurements)

Minという言葉の意味は分かりにくいが、子供を最小のintrinsic sizeになるようにmeasure時にサイズを申告させて、
その中の「最大」の子供のサイズをRowのサイズとする、という事のよう。

これでだいたいいいのだが、なんか微妙にボタンを変えるとサイズが変わるようになって、
雑にハンドルしてたリサイズで書いたものがクリアされるようになってしまったので、
あまり違わない時はクリアせずに元のBitmapをリサイズするように変更した。

### AndroidViewで中のViewがクリップされずにcanvas.drawColorなどが画面全体を塗りつぶしてしまう

これは以前別のアプリの更新の時にも遭遇したもので、clipToOutlineをtrueにしてやれば良い。
