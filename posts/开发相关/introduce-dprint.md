---
published: 2023-04-07
---

# 快使用 Dprint 换掉你的 Prettier 罢（迫切

## 正文

2025.11.8：煮包变脸了，开始用 Prettier 了😭

## 前言：什么是代码格式化工具？

在写代码的时候，我们有时候会写出来这些丑陋的代码，没有分号，没有换行，奇怪的缩进和空格，不统一的引号：

<!-- prettier-ignore -->
```ts
/* eslint-disable */
// 手动造的（
const a=1;
let b= 114514,c='1',d="homo"
function
    a(){}
type A={ a:string}
```

可恶，太丑陋力！如果没有代码格式化工具，我们就必须一个一个一个修改，而且还没办法做到全部人员写的代码风格都统一。如果我们使用了代码格式化工具（这里使用 [Dprint](https://github.com/dprint/dprint)），它会自动将以上代码格式化为：

<!-- prettier-ignore -->
```ts
/* eslint-disable */
// 手动造的（
const a = 1;
const b = 114514;
const c = "1";
const d = "homo";
function a() {}
interface A {
  a: string;
}
```

是不是好看多了？自动加上了分号，统一了引号，空格也适当地添加了。（~~代码写得好看的有奖励，写的难看的有惩罚~~）
这就是代码格式化工具的作用：将代码统一为一致的格式。

## Why not Prettier?

如果你曾经做过 JS 开发，那么你或许对 Prettier 有所耳闻。Prettier 在其官网将自己称为“一个固执己见的代码格式化工具”（An opinionated code formatter），同时“拥有极少配置项”（Has few options）。这也使得其开箱即用，不必要为配置而烦恼——它会自动统一你的代码风格（而且默认的并不丑！），可以说是`ni prettier`，`nlx prettier --write .` 就能用。

那么，为什么这篇文章不向你推荐 Prettier 而要用 ~~不知名~~ Dprint？原因有下：

1. Prettier 的配置项很少。前面提到了，它是一个“固执己见”的代码格式化工具，也就意味着它并不能让你自定义代码风格。比如有些人喜欢把等号对齐到一行，不喜欢在花括号前面加空格（虽然我本人对这种风格不感冒），Prettier 就没法做到这一点。一些示例：
   <!-- prettier-ignore -->
   ```ts
    function foo () {} // 这里，括号前面带有空格
    function bar<T>() {} // 泛型函数没有
    ```

   这是我个人比较喜欢的一种码风，Prettier 却并不支持它。而且你也无法申请添加这一功能，因为 Prettier [不再添加新的配置项](https://prettier.io/docs/en/option-philosophy.html)。

2. 速度慢。虽然说 Prettier 相比 ESLint 快了不止一个量级（我知道 ESLint 不是一个专门的格式化工具），但是面对大型代码库时，Prettier 仍然需要数秒时间来解析代码然后格式化。这是脚本语言本身的限制，指不定 Node 在解析 Prettier 代码的时候原生语言写的工具都格式化完了（指 Dprint

出于以上几点，我选择转投 Dprint 的怀抱（

## Dprint

> 注意，Dprint 目前尚未达到 1.0 稳定版，但是 Bug 不多，可以试着用
>
> 反正我的 [eslint-config](https://github.com/so1ve/eslint-config) 用的 Dprint 来格式化

[Dprint](https://github.com/dprint/dprint) 对自己的描述是“Rust 写的插件化、可配置的代码格式化**平台**”（~~虽然我看不懂这个平台`platform`是什么意思，但是 nb 就对了~~），注意奥，Rust 写的，那基本上就意味着高性能（）同时，它使用多线程进行格式化，可配置化也是其一大亮点，像是上面提到的括号前加空格就可以实现。

### Talk is cheap, show me the code

没有使用方法的介绍文章都是耍流氓，上代码（这里使用 [@antfu/ni](https://github.com/antfu/ni) 进行依赖安装)：

```bash
$ ni dprint
```


随后：

```bash
$ nlx dprint help
```


看到输出帮助信息就说明安装成功了。

然后初始化：

```bash
$ nlx dprint init
```


选择需要装的插件按回车（这里装了 `typescript` `json` `markdown` `toml` 插件），应该会在当前目录生成一个 `dprint.json`：

```json
{
  "typescript": {},
  "json": {},
  "markdown": {},
  "toml": {},
  "includes": ["**/*.{ts,tsx,js,jsx,cjs,mjs,json,md,toml}"],
  "excludes": ["**/node_modules", "**/*-lock.json"],
  "plugins": [
    "https://plugins.dprint.dev/typescript-0.84.1.wasm",
    "https://plugins.dprint.dev/json-0.17.1.wasm",
    "https://plugins.dprint.dev/markdown-0.15.2.wasm",
    "https://plugins.dprint.dev/toml-0.5.4.wasm"
  ]
}
```

或者你也可以自己指定：

```bash
$ nlx dprint init --config .dprint.json
```


此时运行 `nlx dprint check` 就能够检测代码中存在的格式问题， `nlx dprint fmt` 就能自动格式化！

可以看到安装步骤也是非常简单（）

### 配置

配置这里不多说，需要自定义请自行查看官网：<https://dprint.dev/config>

### 与编辑器集成

如果不按照编辑器插件，你每次写代码都必须要手动进行格式化，挺烦人的。如果装了编辑器插件，就可以在保存 / 输入时自动格式化！

打开你的用户设置 `settings.json`（不会打开的自己看文档），加入如下内容：

```json
{
  "editor.defaultFormatter": "dprint.dprint",
  "editor.formatOnSave": true
}
```

或者如果你只想让 JS 使用 Dprint（TS 同理）：

```json
{
  "[javascript]": {
    "editor.defaultFormatter": "dprint.dprint",
    "editor.formatOnSave": true
  }
}
```

注意，以上配置只适用于 `全局安装的 Dprint` 。如果是在项目中装的 Dprint，请在工作区配置中添加：

```json
{
  "dprint.path": "./node_modules/dprint/dprint.exe"
}
```

可以看到，上面这种方式是比较麻烦的。而且，它没法显示格式化更改了那些地方，没有 Diff，看着可难受了。有没有什么更好的办法呢？

有！如果你用了 ESLint，请看下一部分！

### 与 ESLint 集成

Prettier 有一个插件可以让 Prettier 作为一个 ESLint 规则来运行，它叫 [eslint-plugin-prettier](https://github.com/prettier/eslint-plugin-prettier)。我也做了个类似的插件，[eslint-plugin-dprint-integration](https://github.com/so1ve/eslint-plugin-dprint-integration) （eslint-plugin-dprint 被人抢了），内置了 `typescript` `json` `markdown` `toml` `dockerfile` 的格式化，以及 Vue 的 Script 部分。（以后会支持 CSS）。使用方法很简单：

```bash
$ ni eslint-plugin-dprint-integration -D
```


随后，在你的 ESLint 配置文件（这里是 `.eslintrc.cjs`）中添加：

```js
module.exports = {
  extends: [
    "plugin:dprint-integration/recommended",
    // 关闭冲突 ESLint 规则
    "plugin:dprint-integration/disable-conflict",
  ],
};
```

齐活！打开你的 VSCode，装上 ESLint 插件，可以看到格式化的修改都可视化了: P
