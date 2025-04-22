---
title: qt-cmakeとvcpkgの共存
layout: page
---
Qtとvcpkgを使おうとしたが割と苦戦して、調べた事を残しておこうというブログ。

## 前提

Qt環境は各自手元にすでに長い歴史のあるなにかがあって、そこにはそのプロジェクト固有の事情があり、それは例外では無くて前提となるので少し特殊な部分がある。
前提として以下のような話がる。

- QtはQt Maintanance Toolで入れている（Qt Creatorのqmakeの環境が生きているプロジェクトがある都合）
  - vcpkgでQtを入れる事は前提と出来ない
- ビルド環境はMacとWindows
- いろいろな人がビルドするのであまり環境設定をさせたくない
- Qtはいろいろなバージョンを試す必要がある

その結果、以下のような感じにしようと思った。

- vcpkgはVCPKG_ROOT環境変数を設定するだけ
- qtのバージョンはPATHの中にqtのbinへのパスを指定するだけにしたい
- cmakeでは無くqt-cmake

## CMAKE_TOOLCHAIN_FILE周りの事情

qt-cmakeはQt独自のCMAKE_TOOLCHAIN_FILEを設定する。
一方でvcpkgもvcpkg独自のCMAKE_TOOLCHAIN_FILEを設定する。
そしてCMakeは複数のCMAKE_TOOLCHAIN_FILEを指定する事は出来ない。

一方、vcpkgではサブのCMAKE_TOOLCHAIN_FILEを指定する、VCPKG_CHAINLOAD_TOOLCHAIN_FILEというのがあるらしい。＞[vcpkg in CMake projects#Using Multiple Toolchain Files](https://learn.microsoft.com/en-us/vcpkg/users/buildsystems/cmake-integration#using-multiple-toolchain-files)

という事で

1. CMAKE_TOOLCHAIN_FILKEはvcpkgを指定
2. VCPKG_CHAINLOAD_TOOLCHAIN_FILEにQtのtoolchainを指定

という感じにする事にする。

## CMakeLists.txtでの記述

qt-cmakeでジェネレートする前提なので、最初の段階ではCMAKE_TOOLCHAIN_FILKEがqtのものが設定されている。
これをVCPKG_CHAINLOAD_TOOLCHAIN_FILEに設定しなおして、CMAKE_TOOLCHAIN_FILEはVCPKG_ROOTからの値を再設定する感じにしたい。

似たような事を以下でやっていた。

- [Building a Qt Application with Modern CMake and vcpkg](https://www.qt.io/resources/videos/building-a-qt-application-with-modern-cmake-and-vcpkg)
  - [qt_world_summit_2019_cmake_vcpkg_app/cmake/app_utils.cmake at master · alcroito/qt_world_summit_2019_cmake_vcpkg_app](https://github.com/alcroito/qt_world_summit_2019_cmake_vcpkg_app/blob/master/cmake/app_utils.cmake)

この動画は出来が悪くて要点が分かりにくいが。
ようするに以下のような感じでCMakeLists.txtの先頭に書けば良さそう。

```
if(DEFINED ENV{VCPKG_ROOT})
		set(vcpkg_toolchain_path "$ENV{VCPKG_ROOT}/scripts/buildsystems/vcpkg.cmake")
		get_filename_component(vcpkg_toolchain_path "${vcpkg_toolchain_path}" ABSOLUTE)		
		get_filename_component(supplied_toolchain_file "${CMAKE_TOOLCHAIN_FILE}" ABSOLUTE)
		if(NOT supplied_toolchain_file STREQUAL vcpkg_toolchain_path)
				set(VCPKG_CHAINLOAD_TOOLCHAIN_FILE "${CMAKE_TOOLCHAIN_FILE}" CACHE STRING "")
		endif()		
    if(vcpkg_toolchain_path AND EXISTS "${vcpkg_toolchain_path}")
        set(CMAKE_TOOLCHAIN_FILE "${vcpkg_toolchain_path}" CACHE STRING "" FORCE)
        message(STATUS "Using vcpkg from $ENV{VCPKG_ROOT}")
    endif()
endif()
```

これでvcpkgでinstallしたものをfind_packageしてtarget_link_libraries出来るようになった。

## Mac上でのOpenGLのワーニング（未解決）

なお、これでMacでジェネレートすると、以下のようなワーニングがfind_packageでQt関連を探す時に出る。

```
CMake Warning at /Users/karino2/Qt/6.8.3/macos/lib/cmake/Qt6/FindWrapOpenGL.cmake:48 (target_link_libraries):
  Target "MyApp" requests linking to directory "/usr/X11R6/lib".  Targets
  may link only to libraries.  CMake is dropping the item.
Call Stack (most recent call first):
  /Users/karino2/vcpkg/scripts/buildsystems/vcpkg.cmake:893 (_find_package)
  /usr/local/share/cmake/Modules/CMakeFindDependencyMacro.cmake:78 (find_package)
  /Users/karino2/Qt/6.8.3/macos/lib/cmake/Qt6/QtPublicDependencyHelpers.cmake:36 (find_dependency)
  /Users/karino2/Qt/6.8.3/macos/lib/cmake/Qt6Gui/Qt6GuiDependencies.cmake:35 (_qt_internal_find_third_party_dependencies)
  /Users/karino2/Qt/6.8.3/macos/lib/cmake/Qt6Gui/Qt6GuiConfig.cmake:43 (include)
  /Users/karino2/vcpkg/scripts/buildsystems/vcpkg.cmake:893 (_find_package)
  /usr/local/share/cmake/Modules/CMakeFindDependencyMacro.cmake:78 (find_package)
  /Users/karino2/Qt/6.8.3/macos/lib/cmake/Qt6/QtPublicDependencyHelpers.cmake:145 (find_dependency)
  /Users/karino2/Qt/6.8.3/macos/lib/cmake/Qt6Widgets/Qt6WidgetsDependencies.cmake:45 (_qt_internal_find_qt_dependencies)
  /Users/karino2/Qt/6.8.3/macos/lib/cmake/Qt6Widgets/Qt6WidgetsConfig.cmake:43 (include)
  /Users/karino2/vcpkg/scripts/buildsystems/vcpkg.cmake:893 (_find_package)
  /Users/karino2/Qt/6.8.3/macos/lib/cmake/Qt6/Qt6Config.cmake:196 (find_package)
  /Users/karino2/vcpkg/scripts/buildsystems/vcpkg.cmake:893 (_find_package)
  CMakeLists.txt:57 (find_package)
```

これは以下の問題のように見える（こちらはErrorと言っているが）

[[grantlee] Build error on arm64-osx (if XQuartz is installed) · Issue #38141 · microsoft/vcpkg](https://github.com/microsoft/vcpkg/issues/38141)

ただワーニングでビルドした結果もそのまま動いてはいるので、しばらくこのままで。

なお、OpenGLのfoundの違いも載せておく。

**通常のqt-cmakeでのOpenGLのfound**

```
Found OpenGL: /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/System/Library/Frameworks/OpenGL.framework
```

**vcpkgのtoolchainにした場合のOpenFLのfound**

```
Found OpenGL: /usr/X11R6/lib/libGL.dylib
```

## 雑感

qt-cmakeを使うのでは無くて、vcpkgのtoolchainをメインにしてqt関連の設定を全部手動でやる方が正しいかもしれない。
vcpkgでQtをインストールしてそれを使えばそんなに難しくないかも？

ただCMakeLists.txtがすでにmoc周りとかでいろいろな試行錯誤をやった結果のなにかなので、
もう一度その辺を見直す気力は沸かず（Qt開発あるある）