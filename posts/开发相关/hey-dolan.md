---
published: 2022-12-06
---

# 无服务器动态博客系统 Dolan：从设想到现实

为啥要写一个新的博客系统呢？这篇文章会介绍我的心路历程（bushi

## 起因

本站最早于 2020 年建立。当时正值网课时期，我就想着搭建一个博客记录一下自己的编程 / 学习过程。一路磕磕绊绊，尝试了多种不同的博客系统：

1. 免费的 WordPress 部署平台（三蛋 host），不过其国内访问速度实在不尽人意，~~承诺 SLA 为 0%~~，同时还在网站中强制添加广告，这换谁不跑路啊；
2. Hexo，一个静态博客生成器，目前使用人数十分庞大，同时有丰富的插件，是一个比较理想的博客系统。但是 Hexo 的坑实在是太多了，经常碰到因为 Node 版本过高 / 过低引起的问题 ~~虽然用一个 fnm 就能解决~~，同时生成速度在插件多了之后直线下滑，完全无法接受，遂弃用；
3. Gridea，一个国人做的带 GUI 静态博客系统，好用，但是可拓展性不高，主题也不是很丰富，用了一段时间后也抛弃了；
4. Hugo，一个用 Go 编写的静态网站生成器，生成速度很快，同时也具有插件系统与强大的自定义功能，是我使用时间最长的博客系统。

使用 Hugo 搭建的博客是存活时间最长的。我一共尝试了两个主题：[MemE](https://github.com/reuixiy/hugo-theme-meme)，以及自己移植的 [Tony](https://github.com/ThemeTony/hugo-theme-tony)。这套配置的易用性极高，同时高度可定制化，生成速度也十分令人满意。但是 ~~人心不足蛇吞象~~，有了一个能用的博客，没地方折腾了，怎么办呢？首先想到的一个优化点就是在线编辑文章。在本地 / 云端编辑固然好，还能实时预览，但难免受到开发环境的影响。

有一个轻量级的解决方案是以 [HexoPlusPlus](https://github.com/HexoPlusPlus/HexoPlusPlus)、[Wexagonal](https://github.com/Wexagonal/Wexagonal)、[Qexo](https://github.com/Qexo/Qexo) 等为代表的在线编辑器（不是开发环境）。这一类项目的特点是 **基于 Github API**、**无服务器**，通过前端的富文本预览，然后再利用 Github API 上传博客源文件，从而模拟出一个在线编辑文章的环境，配合上集成部署实时生成网页，能够满足极大部分下的使用场景。不过，它们的适配对象都是 Hexo，Hugo 怎么办呢？？理论上，在这些项目上添加支持也不难，但 CYF 和 Abudu 写的代码确实 ~~屎山~~ 质量不高，难不成自己再造一个轮子？？？

**好吧，确实去造轮子了（）** 既然造了轮子，那我们就造个大的，直接造个博客系统罢！

## 选型

由于我们要做的是一个无服务器的博客系统，由于运行环境的限制（诸如性能、FS），我们无法做到上传主题、实时更改主题、从模板渲染等操作。同时，我们最好做到前后端分离，让每个部分各司其职，发挥最高的效能：比如后台就没必要和 API 捆绑在一起，可以独立部署；前端也如此。那我们的项目大体结构如下：

1. API，提供数据支持。部署在 Serverless 上。
2. 后台，提供管理页面。静态网页，部署在哪都行。
3. 前端，用户访问界面。理论上可以是一个 SPA，也可以进行服务端渲染，这个看自己有没有 SEO 需求了。

API 最初的技术栈是 Node（Koa），打算部署在 Vercel 上。但是 Vercel 的 Node 运行时速度实在感人，常常超时，遂放弃。

后面我了解到 Deno 背后的公司 [Deno Land Inc.](https://deno.com/) 推出了一个在线部署服务，叫做 Deno Deploy，可以将 Deno 项目部署到云端，同时节点众多，访问速度理想；其又针对 Deno 进行了大量的优化，性能极高。于是，API 的技术栈就定为了 Deno（Oak）。

> 这里插一个题外话，Oak 是一个受到 Koa 启发而创建的 Deno HTTP 框架，二者 API 基本相同，可以毫不费力地把 Koa 项目迁移过去。

随后是后台。后台的开发过程稍显曲折，最开始的技术栈是 Vue3 + Quasar，但是 Quasar 的 API 稍显不足，许多功能都需要自己手动实现。后面看到抖音开源了一个 [SemiUI](https://github.com/DouyinFE/semi-design)，说实话，挺漂亮的，于是捣鼓了很久，把完成了一半的后台迁移到了 React。技术栈为：React + SemiUI + UnoCSS。

最后，是前端。写前端我的第一反应是使用一个 SSR 框架，即 Nuxt / Next，但 Next 貌似支持的 Serverless 平台并不丰富，同时 Nuxt3 声称基于 Nitro 原生支持多平台（其中就包括 Deno Deploy）。卧槽这不得给他冲爆，技术栈为 Nuxt3，移植了一个 [hugo-theme-meme](https://github.com/reuixiy/hugo-theme-meme)。

当然，前端并非只能使用我做的这个 [dolan-client-meme](https://github.com/so1ve/dolan-client-meme)。由于其本质只是从 API 获取数据并渲染（这也是为什么它叫做 client 而不是 theme 的原因），因此任何人都能够做自己的 client。

> 再插个嘴：目前 Nuxt3 和 Nitro 对 Deno Deploy 的支持并没有在文档中体现出来，不过 Nitro 已经有了对它的初步支持。我发起了一个 [PR](https://github.com/unjs/nitro/pull/694)（目前已经合并）来修复一些 bug，但目前包含这个 Commit 的版本还没发布，因此我自己先发布了一个包（[@so1ve/nitropack](https://www.npmjs.com/package/@so1ve/nitropack)）暂时用着，同时做了一些黑魔法，见 [dolan-client-meme/deno-fix.ts](https://github.com/so1ve/dolan-client-meme/blob/main/src/rollup-plugins/deno-fix.ts)。

## 开发

### API

众所周知，开发初期搭建项目结构是最搞人心态的一件事了…… 不过好在 Deno 所需的配置并不多，最多就是 `import_map.json`、`deno.jsonc` 两个配置文件。同时 Oak 也是一个很轻量级的框架，因此主要的目录结构如下：

    │   .env
    │   .gitignore
    │   config.ts
    │   deno.jsonc
    │   deno.lock
    │   import_map.json
    │   LICENSE
    │   README.md
    ├───.vscode
    ├───src
    │   ├───protected_routes.ts
    │   ├───server.ts
    │   └───unprotected_routes.ts
    │
    └───────controller
        ├───lib
        │   └───init_values
        ├───middleware
        ├───types
        └───utils

其中两个 `*_routes.ts` 结尾的文件是路由文件，分为需要登录 / 不需要登录的两组路由。

### 后台

后台的 UI 前面已经说过选择了 SemiUI，迎面而来的还有另一个问题：Markdown 编辑器选什么呢？我考虑了以下几个编辑器：

- [Milkdown](https://milkdown.dev)
- [ByteMD](https://bytemd.js.org)
- [for-editor](https://github.com/kkfor/for-editor)
- [react-markdown-editor](https://github.com/uiwjs/react-markdown-editor)

后面两个首先出局，for-editor 界面古早而且很久没更新，react-markdown-editor 倒是挺活跃，不过它的功能不多而且不能通过插件扩展功能，于是放弃。

为什么最后选择了 Milkdown 而不是 ByteMD 呢？~~嗯我也不太清楚为什么，到后面想重构一下换成 ByteMD 发现工作量挺大的，于是搁置了（）~~ 主要原因是 ByteMD 默认会对 HTML 内容进行序列化，无法在文章中直接插入 HTML，但是 Milkdown@7 则支持插入 HTML。

然后是配置编辑器 / MD 第二编辑器，Monaco Editor，这个没啥好说的

### 前端

> TODO

## 如何使用呢？

目前文档在 <https://dolan.js.org>，大家可以先看看

> TODO
