---
published: 2025-11-12
---

# 把博客用 Nuxt Content 重写及踩坑记录

## 正文

这次把博客用 [Nuxt Content](https://content.nuxtjs.org/) 重写了一遍，记录一下整个重写过程。当然，过程中也踩了不少坑，一并记录一下以帮助大家少走弯路。

## 实现过程

### 设计与开发

这次重写有个有趣的地方：因为我想从零开始制作一个样式独特的简约风博客，但是奈何没有什么设计天赋，于是选择了 Vibe Coding。用的是 v0.dev，虽然生成的产物是 React 代码，但照猫画虎比起从头学设计、想布局、调样式简单多了，而且 v0 使用 shadcn 作为组件库，在 Vue 生态中有 shadcn-vue 可以无缝切换，如果获得了满意的设计那把 React 转成 Vue 的过程也不过是一些机械性劳动，并没有太大的困难。经过 50 多轮迭代后得到了一个大体还算满意的设计稿，然后就开始手动把 React 组件转换成 Vue 组件了（其实依旧是使唤 Copilot Agent 来改）。

![首页](https://img.mk1.io/img/2025-11-12-166ffea12c9e80bf676e16aa6ef8e6b5.png)
![文章列表](https://img.mk1.io/img/2025-11-12-9957a8848868296258e9bc25241708e8.png)
![分类页面](https://img.mk1.io/img/2025-11-12-d0d043bf55609e16f32138edbb698ea8.png)

在审查了一下设计后，发现分类页面的设计是所有页面里最糟糕的， 巨大的卡片的信息密度很低，也不美观（为什么 v0 这么爱用巨大的卡片和缩放？）。可是正如前文所言，我没有设计天赋，实在想不出更好的设计方案了。在网络上寻找灵感时，偶然看到了 [Noah 的分类页面设计](https://noahchen.me/categories)，真是简洁大方。在征询了 Noah 的同意后，我使用了他的设计，在此非常感谢 Noah 的慷慨许可！

![Noah 的邮件](https://img.mk1.io/img/2025-11-12-c718547ca89d054b4c81fb369c650b57.png)

至此，整体设计已大致完成，后面便是实现数据获取与踩坑了。

### 图片存储方案

图片存储方面，我选择了 Cloudflare R2 + PicGo ~~Old School~~ 的组合。Cloudflare R2 的免费额度非常慷慨：

| 项目     | 免费额度（每月）  |
| -------- | ----------------- |
| 存储     | 10 GB             |
| A 类操作 | 1,000,000 次请求  |
| B 类操作 | 10,000,000 次请求 |
| 出网流量 | 免费              |

什么叫互联网大善人，这就是互联网大善人（大赞

而 PicGo 是一个非常好用的开源图床客户端，记得在几年前我还在玩 hexo 博客时就用过它。配置好 Cloudflare R2 存储桶和 tinypng 图片压缩，图床就搞定了。

## 踩坑记录

正片开始！

### 在哪里能完全自定义 Shiki？

我想给 Shiki 加入一个渲染空格的 Transformer（没有实装）。但是，在查找了 Nuxt Content 和 MDC 的文档后我并没能找到添加自定义 Shiki Transformer 的地方。Nuxt Content 的文档里只提到可以通过 `content.build.markdown.highlight` 来配置部分选项，并没有提到如何添加 transformer。而 [MDC 的文档](https://nuxt.com/modules/mdc/) ~~这玩意儿真能叫文档吗~~ 也是只字未提，只能找到和 Nuxt Content 类似的配置选项。

解决方法在 [`@shikijs/colorized-brackets`](https://shiki-color-highlight.netlify.app/) 和 [Nuxt Content Playground](https://github.com/nuxt/content/blob/4635e42707171552cc4bc09cd222f497cf12a8d5/playground/mdc.config.ts) 里找到。你要不说我还真不知道有这个神奇小文件，在 <https://github.com/nuxt-content/mdc/issues/124> 被提出然后又在 <https://github.com/nuxt-content/mdc/pull/129> 被默默实现，我没招了

不过得知了这个配置文件后新的问题出现了：配置文件不生效。检查了一番后发现是要放在 `srcDir` 下，在我的博客项目里也就是 `app` 😅 [这是 MDC 对应的代码](https://github.com/nuxt-content/mdc/blob/cb6a22795b7925618c8b5470c73eb5fc146a14c9/src/module.ts#L113)

### 自定义 transformer 的缓存问题

好了，现在我们成功添加了自定义的 Shiki Transformer。欸，打开开发服务器一看，怎么代码块的空格没有可视化？！

Debug 了十几分钟后发现解析逻辑在 [这里](https://github.com/nuxt/content/blob/4635e42707171552cc4bc09cd222f497cf12a8d5/src/utils/dev.ts#L144-L156)。原来还有缓存机制，也就是说如果只修改了 `mdc.config.ts` 文件，由于文件内容没有改变所以 Nuxt Content 并不会重新解析对应的 markdown 文件，从而导致自定义的 transformer 不生效。

### where 查询的限制

之前我的文章 frontmatter 里有一些嵌套的对象结构，比如：

```yaml
---
repost:
  source_only: true
---
```

这是代表一篇转载的文章是否应当跳转到原文链接阅读。而我不想让这些转载的文章出现在上一篇/下一篇的导航中，需要使用 where 查询把它们过滤掉。很自然地写出了这样的代码：

我想查询某个 author 的文章，自然就写了这样的代码：

```typescript
queryCollectionItemSurroundings("posts", route.path).where(
  "repost.source_only",
  "=",
  false,
);
```

结果查询不到任何结果。后面翻了 Nuxt Content 源码，发现这个 where 语句是简单的拼接得到最后执行的 SQL 语句，而 SQL 不支持这种点号访问嵌套对象的方式，倒也合理。于是查询了 SQLite 进行这类查询的文档，发现需要使用 JSON 函数来访问嵌套对象，比如 `json_extract`：

```sql
SELECT * FROM posts
WHERE json_extract(repost, '$.source_only') = false;
```

但是 Nuxt Content 把 where 的第一个参数用引号括起来了，所以没法直接写 SQL 函数调用。只能把 `repost` 的这个属性扁平化了。我先提了一个 [issue](https://github.com/nuxt/content/issues/3609)，希望能得到修复。

### 查询数组包含特定元素

之前考虑过要不要做标签功能，后面放弃实现，其中大部分原因是我认为对我而言标签功能好看多于实用；其次则是 [Nuxt Content V3 居然把 `$contains` 操作符给干掉了](https://github.com/nuxt/content/issues/2960)。

也就是说，这样的字段，

```yaml
---
tags: ["vue", "nuxt", "typescript"]
---
```

我想查询包含 `vue` 标签的所有文章，在 V2，应该用 `$contains` 操作符：

```typescript
await queryContent("posts")
  .where({ tags: { $contains: "vue" } })
  .find();
```

但是在 V3 这个功能被移除了。Issue 的回复说用 `LIKE` 来替代，但这种方式很不直观，而且有局限性：

```typescript
await queryContent("posts").where("tags", "LIKE", "%vue%").find();
```

这样写有个问题：如果有个标签叫 `vuejs`，也会被匹配到。不过这种极端情况倒不是大问题，可以接受。

## 额外收获

在重写过程中，还发现了自己之前写的 [`@vue.ts/complex-types`](https://github.com/so1ve/vue.ts/blob/main/packages/complex-types) 库的几个问题。

### `@vue.ts/complex-types` 不生效

缺少 `enforce: "pre"` 导致的。在我的测试流程中 `@vue.ts/ccomplex-types` 插件被放在 `@vitejs/plugin-vue` 之前执行，表现出来就是插件在正常工作，实际上这是依赖于用户的插件顺序，并不可靠。而在 Nuxt 里 `@vitejs/plugin-vue` 是默认存在的插件，用户无法控制顺序，我们加入的插件顺序在 `@vitejs/plugin-vue` 之后，导致插件不生效。

### HMR 后报错

博客开发时，我发现每次打开页面程序都可以正常工作，但是一旦修改文件内容就会报错无法解析复杂类型。用 Nuxt Devtools 的 Inspect 功能查看后发现，HMR 后的文件内容变回了没有经插件处理过的原始内容，百思不得其解。
这个问题调试了挺久，就是各种试、各种 console.log 才找到原因： `transform` hook 在 HMR 场景下根本没有被调用。也不知道是不是预期行为，总之需要加入 `handleHotUpdate` hook 来处理 HMR 才能正常运行，直接使唤 Copilot 代写。[成品](https://github.com/so1ve/vue.ts/blob/main/packages/complex-types/src/index.ts#L23-L58)

### TSConfig `references` 不支持

我的 `complex-types` 是以 [`component-meta`](https://github.com/vuejs/language-tools/blob/master/packages/component-meta/) 为蓝本写的。Nuxt 最近增强了类型定义，把不同运行环境下的代码分割到了不同的 tsconfig 文件中，并在工作目录下的 tsconfig 通过 `references` 来关联它们。结果发现 `complex-types` 插件无法处理这种 tsconfig 结构，询问 [KazariEX](https://github.com/KazariEX) 后得知不支持 `references`，于是创建了一个新 `tsconfig.build.json` extend 旧版的 All-in-One tsconfig 来解决这个问题。

## 总结

总的来说，Nuxt Content 可用但仍然存在不少问题，请酌情使用。但是如果你能成功解决这些问题，那么 MDC 简洁有力的语法能够极大的提升你的写作效率和体验。

希望这篇记录能帮到同样在使用 / 考虑使用 Nuxt Content 的朋友。
