---
title: Mac OS X上のdockerでjekyll環境を作ってgithub pagesのテストをする
layout: page
---

いい加減deployしてtry and errorするのも疲れてきたのでローカルにjekyll環境を作ろうと決心する。
ただローカルにrubyなんて入れてたくないので、docker環境も作る事にする。

### Mac OS X上のdocker環境

MacのdockerはGUIだ（！）との事なので、brew installじゃなくてbrew cask installじゃなきゃダメだよ、と[こちら](https://www.cprime.com/resources/blog/docker-on-mac-with-homebrew-a-step-by-step-tutorial/)に書いてあったので、何も考えずに`brew cask install docker`を実行する。

```
Error: Calling brew cask install is disabled! Use brew install [--cask] instead.
```

何それ。まぁいいや、言われた通りやってみよう。

```
> brew install --cask docker
...
==> Installing Cask docker
==> Moving App 'Docker.app' to '/Applications/Docker.app'.
```

おや、なんかApplications下に入るのか。
そういえば以前仕事で使ってた時はVirtual Boxとかいろいろダウンロードして入れて使ってたのをうっすらと思い出してきた。

設定はGUIでやるっぽいのでCmd+SpaceでスポットライトからDockerで起動してみる。

なんか次へとか適当に押しているとパスワード聞かれたりして、なんかチュートリアルが始まる。
え？そんなの要らないんだけど。
という事で左下のSkip tutorialを選ぶ。

この状態でターミナルから`docker --version`したらそれっぽい結果が帰ってきた。右上のアイコンでrunningと言っているから、この状態だと使えるっぽいかな。

### jekyllイメージ

次にjekyll環境。
dockerのイメージとしては[jekyll/jekyll](https://hub.docker.com/r/jekyll/jekyll)というのがあるね。

```
> docker pull jekyll/jekyll
```

jekyllのビルドをすると何が出来るんだろう？
一通り作業が終わったあとに比較したら`_site`と`.jekyll-cache`が出来るだけっぽいので、これを.gitignoreに追加して、普通にgithub pagesをcloneしたディレクトリで作業すれば良いか。

```
> cd karino2.github.io
```

リンク先のgithubを見ている感じだと、このworkをvmountすれば良さそうかな。

```
> docker run --rm --volume="$PWD:/srv/jekyll" -it jekyll/jekyll jekyll build
```

ビルドは出来た。
serveを試すにはどうしたらいいんだ？
[公式のDockerfile](https://github.com/envygeeks/jekyll-docker/blob/master/repos/jekyll/Dockerfile)見ていると4000番でアクセスするっぽいか？

```
> docker run --rm --volume="$PWD:/srv/jekyll" -it -p 4000:4000 jekyll/jekyll jekyll serve
```

これでブラウザから`http://localhost:4000`でアクセス出来た。いかにも忘れそうなのでシェルスクリプトにしておく。

### 追記: RelativeLinksを使いたい場合は以下

リンクで.mdファイルへのリンクを貼ったものがGithub Pages上では動くがローカルでは動かない。
これは`jekyll-relatie-links`というプラグインがやっているらしい。

これが入っているdocker imageは無いかな？と探したら幾つかあるのだが、どうもjekyll/jekyllと同じ使い方では動かないので自分で書く事にした。

以下のようなDockerfileを書いて、

[kotlin-web-site-ja/docker at master · karino2/kotlin-web-site-ja](https://github.com/karino2/kotlin-web-site-ja/tree/master/docker)

```
$ pushd docker
$ docker build -t karino2/jekyll . 
$ popd
```

とかして、以下のように実行しています。

```
$ docker run --rm --volume="$PWD:/srv/jekyll" -it -p 4000:4000 karino2/jekyll jekyll serve
```

config.ymlには書かなくても有効になっているっぽい。