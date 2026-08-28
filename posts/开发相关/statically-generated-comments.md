# 从 GitHub Discussions 自动生成静态评论区

不知道你有没有发现，本博客的评论区默认是静态的，只有你点击 `Use Giscus` 的时候才会加载 Giscus 呢？而且当你发送一条评论后，静态的评论区过半分钟将会自动生成最新的评论。

## 动机

在我自己做的博客生成器 [Inkcairn](https://github.com/so1ve/inkcairn) 中，我实现了从 GitHub Discussions 自动生成静态评论区的功能。这个项目的宗旨就是尽可能减少博客的动态请求与 JS 数量，从而专注于内容本身，而且提高了博客的访问速度和安全性。在无 JavaScript，或者你不需要发布评论时，你依旧可以查看别人的评论；只有在需要交互的时候，点击 `Use Giscus` 才会真正加载 Giscus。

## 原理

这个功能的实现原理是：在博客构建时，调用 GitHub GraphQL API 获取当前文章对应的讨论区的评论数据，然后将这些评论数据渲染成静态 HTML，嵌入到博客页面中。而我们需要在评论发布/编辑/删除后，重新构建博客页面，以便让静态评论区显示最新的评论。

因此，页面默认展示的是构建时生成的评论快照，不需要加载 Giscus 的客户端脚本；只有读者点击 `Use Giscus` 后，页面才会加载 Giscus iframe，用于登录、发送和编辑评论。可以简单地说：静态快照负责读取评论，Giscus 负责与评论区实时交互。

其实，这个功能是通过 GitHub Discussions 的 API 实现的。我的博客使用了 GitHub Actions 来自动构建并推送到 Cloudflare Pages 上，因此，只需要在 GitHub Actions 的触发条件加入如下代码：

```yaml
on:
  discussion:
    types: [created, edited, deleted]
  discussion_comment:
    types: [created, edited, deleted]
```

*[具体 Actions 可参考这里](https://github.com/so1ve/blog.mk1.io/blob/main/.github/workflows/deploy.yml)*

即可，这样，当有新的评论发布、编辑或删除时，GitHub Actions 就会触发博客的重新构建，从而生成最新的静态评论区。构建速度越快，评论区的更新就越及时。非常幸运，由于 Inkcairn 足够简单，构建博客本身的速度稳定在一秒内，几乎可以忽略不计。

完整的数据流如下：

```text
文章输出 URL
    ↓ 作为 Giscus 的 specific term
同名 GitHub Discussion
    ↓ 通过 GitHub GraphQL API 拉取评论和回复
渲染为静态 HTML
    ↓
部署到 Cloudflare Pages
    ↓ 点击 Use Giscus
切换到可实时交互的 Giscus iframe
```

可惜 Wrangler 速度真的很慢，即使缓存了它的二进制，从上传到 Cloudflare Pages 可访问，也至少需要十秒的时间，未来可能还可以进行优化，或者换用其他的部署方式。
