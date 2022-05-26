---
title: HalideのMetalバックエンド周辺のコード読みメモ
layout: page
---
仕事でheadlessアプリにMetalを組み込んでみたいと思い、似たような事をやっているHalideを調べてみる事にする。
Halideのコード読み自体は普通にオープンな物なので、せっかくだから読んだ時のメモをこっちのブログに書いておく。

といっても自分が知りたい事を知るためのメモなので、そんなに読む側を意識したものでは無い。

## CMakeのインテグレーション

HalideGeneratorHelpers.cmake上で、以下のようになっている。

```
    if ("${ARGN}" MATCHES "metal")
        find_library(METAL_LIBRARY Metal)
        if (NOT METAL_LIBRARY)
            message(AUTHOR_WARNING "Metal framework dependency not found on system.")
        else ()
            target_link_libraries(${TARGET} ${VISIBILITY} "${METAL_LIBRARY}")
        endif ()

        find_library(FOUNDATION_LIBRARY Foundation)
        if (NOT FOUNDATION_LIBRARY)
            message(AUTHOR_WARNING "Foundation framework dependency not found on system.")
        else ()
            target_link_libraries(${TARGET} ${VISIBILITY} "${FOUNDATION_LIBRARY}")
        endif ()
    endif ()
```

find_libraryしてtarget_link_librariesしている。
これがCMake的な正しいお作法か。

## ソースコードのコンパイル

Metalの入門くらいは[Metal](https://karino2.github.io/RandomThoughts/Metal)で多少はやったが、
テキストをオンザフライでコンパイルする方法は、まだ調べてない。
せっかくなのでHalideでどうやってるか追う事で、Halideのこの辺のコードに慣れつつその辺も調べたい。
まぁOpenCLとそんな変わらんだろう、とは思っている。

IDEが静的にコンパイルする場合は、MTLLibraryからMTLFunctionを取り出して、MTLDeviceにnewComputePipelineStateWithFunctionメッセージを送る。
という事でnewComputePipelineStateWithFunctionで検索してみると、metal.cppで以下のようになっている。

```
WEAK mtl_compute_pipeline_state *new_compute_pipeline_state_with_function(mtl_device *device, mtl_function *function) {
    objc_id error_return;
    typedef mtl_compute_pipeline_state *(*new_compute_pipeline_state_method)(objc_id device, objc_sel sel,
                                                                             objc_id function, objc_id * error_return);
    new_compute_pipeline_state_method method = (new_compute_pipeline_state_method)&objc_msgSend;
    mtl_compute_pipeline_state *result = (*method)(device, sel_getUid("newComputePipelineStateWithFunction:error:"),
                                                   function, &error_return);
    if (result == nullptr) {
        ns_log_object(error_return);
    }

    return result;
}
```

なるほど、objc_msgSendをこうやって呼んでいるんだな。MTLFunctionはmtl_functionという名前になるらしい。
検索してもこれはstructの宣言だけあって中身の定義が無い。ポインタとしてしか使わないので中身の定義は要らないのか、なるほど。

このnew_compute_pipeline_state_with_functionを呼んでいるところを見ると、エラー処理を省略すると以下みたいになっている。

```
    mtl_library *library{};

    bool found = compilation_cache.lookup(metal_context.device, state_ptr, library);

    mtl_function *function = new_function_with_name(library, entry_name, strlen(entry_name));

    mtl_compute_pipeline_state *pipeline_state = new_compute_pipeline_state_with_function(metal_context.device, function);

```

うーむ、この時点では関数名しか指定していないので、コンパイルはもっと前の段階でlibraryにされるっぽいな。
compilation_cacheというそれっぽい名前があるので、これにキャッシュしているのだろう。

compilation_cacheで検索すると、metal.cppのhalide_metal_initialize_kernelsがそれっぽい？
エラー処理を省くと以下みたいな感じ。


```
WEAK int halide_metal_initialize_kernels(void *user_context, void **state_ptr, const char *source, int source_size) {
    MetalContextHolder metal_context(user_context, true);

    mtl_library *library{};
    const bool setup = compilation_cache.kernel_state_setup(user_context, state_ptr, metal_context.device, library,
                                                            new_library_with_source, metal_context.device,
                                                            source, source_size);
    return 0;
}
```

sourceとsource_sizeを渡しているので、halide_metal_initialize_kernelsで文字列をコンパイルしている気がする。
kernel_state_setupの中でコンパイルをしているのだろうけれど、メソッド名とcompilation_cacheという名前から微妙に違和感があるな。

kernel_state_setupの定義を見てみるとgpu_contet_common.hにあって、ちらっと見た感じMetalっぽいものはなさそう。
ざっと見ると、引数で渡しているnew_library_with_sourceに以後の引数を渡して、結果をキャッシュに入れているように見える。

つまり、

```
new_library_with_source( metal_context.device, source, source_size );
```

でコンパイルをして、その結果をキャッシュしている。
new_library_with_sourceは名前から予想するにライブラリを作るんだな。
関数1つにつき1ライブラリを作るのか。
で、libraryをキャッシュする。
だいたい理解出来たな。

一応new_library_with_sourceを見ておこう。どうせobjc_msgSendするだけだろうが。

```
WEAK mtl_library *new_library_with_source(mtl_device *device, const char *source, size_t source_len) {
    objc_id error_return;
    objc_id source_str = wrap_string_as_ns_string(source, source_len);

    typedef objc_id (*options_method)(objc_id obj, objc_sel sel);
    options_method method = (options_method)&objc_msgSend;

    objc_id options = (*method)(objc_getClass("MTLCompileOptions"), sel_getUid("alloc"));
    options = (*method)(options, sel_getUid("init"));
    typedef void (*set_fast_math_method)(objc_id options, objc_sel sel, uint8_t flag);
    set_fast_math_method method1 = (set_fast_math_method)&objc_msgSend;
    (*method1)(options, sel_getUid("setFastMathEnabled:"), false);

    typedef mtl_library *(*new_library_with_source_method)(objc_id device, objc_sel sel, objc_id source, objc_id options, objc_id * error_return);
    new_library_with_source_method method2 = (new_library_with_source_method)&objc_msgSend;
    mtl_library *result = (*method2)(device, sel_getUid("newLibraryWithSource:options:error:"),
                                     source_str, options, &error_return);

    release_ns_object(options);
    release_ns_object(source_str);

    if (result == nullptr) {
        ns_log_object(error_return);
    }

    return result;
}
```

お、思ったより長いな。

前半でMTLCompileOptionsを作り、setFastMathEnabledにfalseを指定している。このオプションをnew_library_with_source_methodに渡している。

一応分けてみてみよう。

```
    typedef objc_id (*options_method)(objc_id obj, objc_sel sel);
    options_method method = (options_method)&objc_msgSend;

    objc_id options = (*method)(objc_getClass("MTLCompileOptions"), sel_getUid("alloc"));
    options = (*method)(options, sel_getUid("init"));
```

これでMTLCompileOptionsというのを作っていて、

```
    typedef void (*set_fast_math_method)(objc_id options, objc_sel sel, uint8_t flag);
    set_fast_math_method method1 = (set_fast_math_method)&objc_msgSend;
    (*method1)(options, sel_getUid("setFastMathEnabled:"), false);
```

これでsetFastMathEnabledというのにfalseを指定している。
こうして作ったoptionsを使ってlibraryを作る訳だな。

```
    typedef mtl_library *(*new_library_with_source_method)(objc_id device, objc_sel sel, objc_id source, objc_id options, objc_id * error_return);
    new_library_with_source_method method2 = (new_library_with_source_method)&objc_msgSend;
    mtl_library *result = (*method2)(device, sel_getUid("newLibraryWithSource:options:error:"),
                                     source_str, options, &error_return);
```

newLibraryWithSourceというメッセージでソースコードからライブラリが作れるらしい。
これでコンパイル周辺は一通り理解出来た。
あとは該当するObjectiveCのメッセージを調べていけば知りたい事はわかるだろう。