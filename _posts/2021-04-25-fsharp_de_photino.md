---
title: Create a single binary GUI tool with photino and F# on osx
layout: page
---
When I want to create a single binary simple GUI tool for both osx and windows, I think photino is a nice candidate.
But the official document lacks a single-binary related topic.

[photino](https://www.tryphotino.io) is a nice cross-platform WebView based GUI app library for both osx and windows (and probably Linux) which you can use from .NET Core.
I use F# for development language, so this instruction is also F# based.

### Project setup

```
$ dotnet new console -lang "F#" -o hellophotino
$ cd hellophotino
$ code .
$ dotnet add package Photino.NET --version 1.1.6
```

### Add resource

To load html or css or js for single-file executable, EmbeddedResource is the best way to package.

Put index.html in `assets` folder.

```
$ mkdir assets
$ echo > assets/index.html
```

Write index.html.

Add the following in hellophotino.fsproj.

```
<ItemGroup>
   <EmbeddedResource Include="./assets/*" />
</ItemGroup>
```

### Load resource HTML to photino

In Program.fs.

```
open PhotinoNET
open System.Reflection

[<EntryPoint>]
let main argv =
    let win = new PhotinoWindow("Hello Photino")
    let asm = Assembly.GetExecutingAssembly()
    use stream = asm.GetManifestResourceStream("hellophotino.assets.index.html")
    use sr = new StreamReader(stream)
    let text = sr.ReadToEnd()

    win.RegisterWebMessageReceivedHandler(System.EventHandler<string>(onMessage))
        .LoadRawString(text)
        .WaitForClose()
    0 // return an integer exit code
```

Now you can run this project with F5. (For standard launch.json and tasks.json).

### Build single binary

Check RID.

```
$ dotnet --info
...
RID:         osx.11.0-x64
...
```

My RID is osx.11.0-x64.

```
$ dotnet publish -c release -r osx.11.0-x64 /p:PublishSingleFile=true /p:IncludeNativeLibrariesForSelfExtract=true /p:PublishTrimmed=true
```

Maybe you want to add `/p:SelfContained=true` too. 

The result is under `bin/release/net5.0/osx.11.0-x64/publish/hellophotino`.
You can grab this file and put it to `~/bin` or wherever you like and launch GUI with WebView.

The binary size is about 30MB in my environment.
Not so impressive, but far better than Electron counterpart (about 180MB).

### js, css loading from EmbeddedResource

For loading js and css files, using a custom scheme is the easiest way for single file deployment.

Put client.js to `assets`.

```
$ echo "alert('hello')" > assets/client.js
```

Load from `index.html` with some custom scheme (I use `resjs` for js).

```
 <script src="resjs:client.js"></script>
```

You need to allow custom scheme loading in html. That is, do not specify `Content-Security-Policy` with too strict manner (like standard Electron app).

Add custom scheme handling in `Program.fs`. (I add rescss too).

```
let winConfig (options: PhotinoWindowOptions) =
    let asm = Assembly.GetExecutingAssembly()

    let load (url:string) (prefix:string) =
    let fname = url.Substring(prefix.Length)
    asm.GetManifestResourceStream($"hellophotino.assets.{fname}")

 
    options.CustomSchemeHandlers.Add("resjs",
        CustomSchemeDelegate(fun url contentType ->
            contentType <- "text/javascript"
            load url "resjs:"))
    options.CustomSchemeHandlers.Add("rescss",
        CustomSchemeDelegate(fun url contentType ->
            contentType <- "text/css"
            load url "rescss:"))


[<EntryPoint>]
let main argv =
    let win = new PhotinoWindow("Hello Photino", Action<PhotinoWindowOptions>(winConfig))
...
```

You can check the suffix and use one scheme if you want.
I just use two schemes for laziness.

### Communicate to WebView

I only use `window.external.receiveMessage` and `window.external.sendMessage`.
These two methods accept string argument only.
So I always pack messages with JSON.

For Program.fs:

```
open System.Text.Json

type Message = {Type: string; Body: string}

let sendMessage (wnd:PhotinoWindow) (message:Message) =
    let msg = JsonSerializer.Serialize(message)
    wnd.SendWebMessage(msg) |> ignore

let receiveMessage (wnd:Object) (message:string) =
    let msg = JsonSerializer.Deserialize<Message>(message)
    printfn "On message %A" msg

...
    win.RegisterWebMessageReceivedHandler(System.EventHandler<string>(receiveMessage))
        .LoadRawString(text)
        .WaitForClose()
```

For client.js side:

```
const sendMessage = (type, body) => {
    window.external.sendMessage(JSON.stringify({Type:type, Body: body}))
}

window.external.receiveMessage(message => {
    const msg = JSON.parse(message)
    alert(msg.Body)
})

```

### Conclusion

To write a small GUI tool for Windows and Mac with WebView, photino + .NET Core is a nice alternative.
You can build rich UI with CSS and JS while packing as a single exe file.