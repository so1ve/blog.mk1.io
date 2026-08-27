---
published: 2022-12-21
---

# Clerc：一个轻量但强大的命令行框架

## 正文

> TODO

Clerc 项目地址：<https://github.com/so1ve/clerc>

感觉 Clerc 写的很牛逼啊，啥功能都有（大嘘

功能列表：

- 插件化
- 高度可定制
- 高度解耦，功能大部分可通过插件实现
- 链式 API
- 子命令 + 嵌套命令
- 可切换的单命令 / 多命令模式
- 自动映射参数
- 强类型参数、Flag
- 把 Flag 转换为驼峰命名
- 通过 [plugin-help](https://github.com/so1ve/clerc/tree/main/packages/plugin-help) 实现自动生成的帮助
- 通过 [plugin-completions](https://github.com/so1ve/clerc/tree/main/packages/plugin-completions) 实现自动补全
- 通过 [plugin-not-found](https://github.com/so1ve/clerc/tree/main/packages/plugin-not-found) 实现在命令未找到的时候给出最接近的命令（即 `Did you mean`）
- 通过 [plugin-version](https://github.com/so1ve/clerc/tree/main/packages/plugin-version) 实现输出版本的命令，及传入 `--version` 或 `-V`（可自定义）时输出版本号
- 通过 [plugin-strict-flags](https://github.com/so1ve/clerc/tree/main/packages/plugin-strict-flags) 实现在传入多余 / 未定义参数时报错
- 通过 [plugin-friendly-error](https://github.com/so1ve/clerc/tree/main/packages/plugin-friendly-error) 实现错误自动美化输出
- 以及强大的 [toolkit](https://github.com/so1ve/clerc/tree/main/packages/toolkit)（也就是重新导出了一下几个好用的 CLI 工具（bushi
- 等等等等……

## 安装

```bash
$ npm install clerc -S
$ yarn add clerc
$ pnpm add clerc
```


## 使用

下面是一个最简单的命令：

```ts,twoslash
import { Clerc } from "clerc";

const cli = Clerc.create()
  .name("foo-cli")
  .description("A simple cli")
  .version("1.0.0")
  .command("foo", "A foo command")
  .on("foo", (ctx) => {
    console.log(ctx);
  })
  .parse();
```

这么几行代码它做了些什么事呢（？）让我们来分析下罢

`Clerc.create()`：没啥好说的，字面意义，创建一个新的 Clerc 实例

`cli.name()`，`cli.description()`，`cli.version()`：也都是字面意思，分别设置 CLI 的名称，描述和版本。注意这三个方法是必须调用的，否则会报错=v=

`cli.command()`：这个方法说是 Clerc 中最重要的方法也不为过，它负责注册命令。它接受 1~3 个参数。

- 2~3 个参数形式：`cli.command(name, description, options?)`。其中 options 的类型为：

```ts
interface CommandOptions {
  alias?: string | string[];
  parameters?: string[];
  flags?: Record<string, FlagOptions>;
  examples?: [string, string][];
  notes?: string[];
}
```

`alias`为一个字符串或一个字符串列表，即该命令的别名

`parameters`为一个字符串列表，即该命令的参数，格式为`<foo>`（必选参数），`[foo]`（可选参数），`<foo...>`（必选展开参数）或`[foo...]`（可选展开参数）。注意可选参数必须在必选参数后，展开参数必须在非展开参数后

`flags`为命令接受的 Flag，一个对象。这个东西我们之后再说

`examples`为该命令的示例，为一个字符串双层数组，每个元素的格式为`[命令示范, 描述]`。

`notes`为该命令的一些提示。

- 单个参数形式：`cli.command(commandObject)`。这里的 commandObject 的类型就是上面提到的 options 类型再加上`name`和`description`两个字段，以及一个`handler`字段（下面会讲）。为什么要添加一个这么奇怪的形式来注册命令呢？有时你不想把命令都写在一个文件里，这样子可以方便地注册命令。

`cli.on(name, handler)`：当某命令被触发时调用 handler。handler 的签名为`(ctx) => void`。其中 ctx

算了之后再写，好烦
