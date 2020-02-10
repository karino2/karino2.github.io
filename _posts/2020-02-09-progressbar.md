---
title: ActionBarにプログレスインジケータを出す
layout: page
---
通信中を表す為にActionBarにプログレスインジケータを出そうと昔のコードを引っ張って来たら出なくなっていたのでそのメモを。
なお、ちゃんと調べてないので不要な事も含まれているかもしれない。

追記: ギャラノ3(AndroidのバージョンはL)では動かなかった…

まず最近のAndroidでは、ActionBar回りのカスタマイズはカスタムのToolbarを使うようになっていて、以前のActivityに生えていたメソッド群はdeprecatedになっている（し動かない）。

カスタムのToolbarを使う手順は、

1. AndroidManifest.xmlでアクションバー無しのテーマにする
2. layout.xmlにandroidx.appcompat.widget.Toolbarの要素を入れる
3. onCreateでsetSupportActionBarを呼び、上記のToolbarを渡す

で良いはずなのだが、これではProgressBarのindicatorが出なくなっていた。
原因はちゃんと調べてないが、色がかぶっているっぽい？indeterminateTintを指定したら出るようになった、という話。

将来の為に一応以下詳細をメモしておく。

### AndroidManifest.xmlでアクションバー無しのテーマにする

AndroidManifest.xmlの目的のactivityで、以下のようにする。

```
    <activity android:name="com.github.harukawa.drivetext.MainActivity"
            android:theme="@style/Theme.AppCompat.Light.NoActionBar">
```

### layout.xmlにandroidx.appcompat.widget.Toolbarの要素を入れる

ConstraintLayoutの中に以下のように入れた。

```
    <androidx.appcompat.widget.Toolbar
            android:id="@+id/toolbar"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:background="@color/colorPrimary"
            app:theme="@style/ThemeOverlay.AppCompat.Dark.ActionBar"
            app:popupTheme="@style/ThemeOverlay.AppCompat.Light"
            app:layout_constraintLeft_toLeftOf="parent"
            app:layout_constraintRight_toRightOf="parent"
            app:layout_constraintTop_toTopOf="parent">
        <ProgressBar
                android:id="@+id/progressBar"
                android:indeterminateTint="@color/colorAccent"
                android:indeterminateTintMode="src_atop"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:visibility="gone" />
    </androidx.appcompat.widget.Toolbar>
```

さらにこの下に置いていたViewをToolbarの下になるように`app:layout_constraintTop_toBottomOf="@+id/toolbar"`を追加した。（これいるかしら？）

このProgressBarの所にある`android:indeterminateTint="@color/colorAccent"`と`android:indeterminateTintMode="src_atop"`いうのが今回追加しないと表示されなかった所。
前者はNのタブレットでで、後者はLのスマホで必要になった。（support library v7時代はLのスマホはどちらも要らなかったはずだが…）

テーマ回りのデフォルトとかが変わっているのかしら？

### onCreateでsetSupportActionBarを呼び、上記のToolbarを渡す

onCreateのsetContentViewしたあとで、以下を呼び出す。

```
    setSupportActionBar(findViewById(R.id.toolbar))
```

あとはインジケータを出したい所で、以下のshowCommuniationIndicatorを呼ぶ。

```
    fun showCommunicationIndicator() {
        findViewById<View>(R.id.progressBar).visibility = View.VISIBLE
    }

    fun hideCommunicationIndicator() {
        findViewById<View>(R.id.progressBar).visibility = View.GONE
    }
```

### 参考URL

[https://github.com/harukawa/DriveText/pull/38](https://github.com/harukawa/DriveText/pull/38)
