# animate-canvas-lib

[中文](./README.md) | **English**

## Introduction

animate-canvas-lib is a library of tools for converting web rich text into formats supported by game engines (unity, egret).
Simple compatibility with older rich text editors，Recommend using [wangEditor](https://github.com/wangeditor-team/wangEditor) open source rich text editor V4 or V5 version

## Usage
- browser
  
``` HTML
<script src="https://cdn.jsdelivr.net/npm/animate-canvas-lib"></script>
<script>
  const { parseUnity, parseEgret } = window['animate-canvas-lib']
</script>
```

- node
``` bash
$ npm i -g npm
$ npm i animate-canvas-lib
```
``` typescript
// require of two methods
const { parseUnity, parseEgret } = require('animate-canvas-lib');

/***
 * @description The following are used as unity example
 * @params htmlStr It's a web rich text field
 * @params setting{sizeMap} Configuration: Configuration font size conversion
 * */ 
const unityText = parseUnity(htmlStr: string, {
  sizeMap: {
    1: 32,
    2: 28,
    3: 26,
    4: 20,
    5: 16,
    6: 14,
    7: 12,
  }
})·

```

## Format support (to be followed up...)

|         |    unity   |    egret   |
|   :-:   |     :-:    |    :-:   |
|Font size|     ✔️     |     ✔️   |
|Font color|     ✔️     |     ✔️   |
|Bold   |     ✔️     |     ✔️   |
|Underline   |     ✔️     |    ❌  |
|Italic   |     ✔️     |    ❌  |
|Line spacing  |     ✔️     |     ❌   |
|Left/Centre/Right|     ✔️     |     ❌    |
|Jump link<br>[(Jump to internal/jump to external)](Jump-rule "Jump-Rule")|     ✔️     |     ✔️   |


## Jump-Rule
web rich text formatting
``` HTML
<!-- Jump to internal <a name="#Jump code"> -->
<a name="#125,151|2003,197|200003,114" type="gameSystemLink">example</a>

<!-- Jump to external <a name="#Jump link"> -->
<a name="#www.baidu.com" type="gameSystemLink">example</a>
```

To unity format
``` JavaScript
// Jump to internal
<link=openSystem__@@__125,151|2003,197|200003,114>example</link>

// Jump to external
<link=openUrl__@@__www.baidu.com>example</link>
```


To egret format
``` JavaScript
//  Jump to internal
<a href='event:openURL_125,151|2003,197|200003,114'>example</a>

//  Jump to external
<a href='event:openURL_www.baidu.com'>example</a>
```

## Related links
- [unity rich text formatting rules](http://digitalnativestudios.com/textmeshpro/docs/rich-text)
