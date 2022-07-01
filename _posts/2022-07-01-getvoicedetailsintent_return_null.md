---
title: RecognizerIntent.getVoiceDetailsIntentがnullを返すようになったので調査
layout: page
---
「いつなに」などの音声認識を使っているアプリが起動時に落ちるようになってしまったので調査。
数ヶ月前までは動いていたのだが。

SpeachRecognizerのstartListeningのところで以下のようなコードになっているのだが、

```
recognizer.startListening(RecognizerIntent.getVoiceDetailsIntent(this))
```

この引数のintent、つまり以下がnullを返している模様。

```
RecognizerIntent.getVoiceDetailsIntent(this)
```

中を見ると、

```
Intent voiceSearchIntent = new Intent(ACTION_WEB_SEARCH);
ResolveInfo ri = context.getPackageManager().resolveActivity(
        voiceSearchIntent, PackageManager.GET_META_DATA);
if (ri == null || ri.activityInfo == null || ri.activityInfo.metaData == null) return null;
```

のところでnullを返していて、どうもmetaDataが見えていない模様。
あー、なんかよそのActivityのmetadataが見えなくなるってなんか言ってたな。
なんか足すんだっけ。

[Package visibility filtering on Android - Android Developers](https://developer.android.com/training/package-visibility)

これか。
リンクをたどると、以下にspeech recognitionのケースが書いてある。

[Fulfilling common use cases while having limited package visibility  - Android Developers](https://developer.android.com/training/package-visibility/use-cases)


queriesに以下を足せと書いてあるな。

```
<intent>
  <action android:name="android.speech.RecognitionService" />
</intent>
```

おや、自分のAndroidManifest.xmlを見たらWEB_SEARCHとGET_LANGUAGE_DETAILSはすでに足してあるな。
まぁいい。これも足してみよう。

あれ？今度は次の行でやっぱりnullが返るな。

```
String className = ri.activityInfo.metaData.getString(DETAILS_META_DATA);
if (className == null) return null;
```

DETAILS_META_DATAが入ってない。
うーん、別段getVoiceDetailsIntentを見ても変更があったとは書いてないし、ソースコードも変更があるようには見えないけれどなぁ。

なんか楽天ミニ（自分のデバイス）のサービス側が変わったのかな。わからん。

そもそも [RecognizerIntent - Android Developers](https://developer.android.com/reference/android/speech/RecognizerIntent) のドキュメントを読んでいると、単にACTION_RECOGNIZING_SPEECHで十分なんじゃないか？

という事でコードを以下のように変更してみる。

```
recognizer.startListening(Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH))
```

これで普通に動いた。querisも不要になったのでAndroidManifests.xmlから削除する。

なんかRecognitionServiceのエントリを削除しても動くんだが？と思ったが、別のデバイスだと`bind to recognition service failed`と出て動かないな。
やはり以下は必要そう。

```
<queries>
    <intent>
        <action android:name="android.speech.RecognitionService" />
    </intent>
</queries>
```
