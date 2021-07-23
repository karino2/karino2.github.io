---
title: PngNote for BOOX開発記
layout: page
---
今後MOOCで生物関係のコースをたくさん取っていこうかと思うにあたり、ノートを取るにあたり、BOOXでノート取るかな、と思った。

BOOXのデフォルトのノートアプリは十分使いやすいのだが、将来デバイスを乗り換える時にいちいちデータをexportするのがかったるい。
しかもpdfのexportってその後の管理がやりにくく、自分的にあまり好きじゃない。

という事で、自分で作る事にした。

名前はPngNote for BOOXという名前にする。

# 基本コンセプト

BOOXのpen SDKを使って、デフォルトのノートアプリみたいにレイテンシがあまり無いnative drawでちゃんと作る。
ただ機能的には最低限の物だけにする。

データはフォルダをブックとして、フォルダ内は連番のpngとする。
ページの入れ替えとかはファイル名のrenameで。
当初は足りない機能はファイラーとかPC上で編集したりしてしのぐ。

データはStorage Access Frameworkで普通にフォルダに保存していき、
それを[GooglePlay: Autosync for Google Drive](https://play.google.com/store/apps/details?id=com.ttxapps.drivesync)などのフォルダsyncアプリで共有する前提で。

明示的なexport無しで共有出来て、将来デバイスを乗り換える時もそのまま続きのノートを書いていけるようにする。
