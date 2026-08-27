---
published: 2026-01-01
---

# 给 2025 年的告别

## 正文

2025 年已经过去，迎来了崭新的 2026 年。过去的一年里经历了许多挑战与成长，现在是时候回顾一下这一年的点滴，给自己一个总结。2025 年经历了高考，进入了大学；买了新的电脑、手机和平板，不知不觉中又一个学期要结束了，令人感慨。

## TODO 完成度

高考前尽力冲刺了一段时间，取得了一个还算令人满意的成绩，进入了理想的大学。~~其实并没有很努力，有次看小说看到早上五点~~

游戏也是有点报复性地在玩，但是玩多了又感觉有些 ED，导致整个人感觉十分空虚，提不起打 Rank 的兴趣。也都刷到了自己想要的皮肤，决定不再充钱。

去了一次 VueConf，见到了许多大佬也拍了一些小照片！

博客也是终于完工了，从 xLog 迁移到了你现在见到的这个博客（x

## 技术

首先得提一下我的编辑器设置。从开始写代码以来，我一直在使用 VSCode 作为主要的代码编辑器，以及 FiraCode 作为等宽字体。经过一段时间的使用，我决定换到自定义的 Maple Mono 变体以换换口味。Maple Mono 是一款开源的等宽字体，专为编程设计，具有良好的可读性和美观的外观。我选择了 Maple Mono 的变体版本，因为它提供了更多的字重和样式选项，使我能够根据不同的编程需求进行调整。Fork [在这里](https://github.com/so1ve/maple-font)，博客里的代码块字体也是这个！

年初直到高考前的那段时间不出意外地没有任何编程相关的项目，毕竟主要精力都放在了学习上。高考结束后，直到十一月份我都在各种摆烂，十一月之后才重新开始写代码。主要的产出有：

- [Vue.ts](https://github.com/so1ve/vue.ts)，一个旨在增强 Vue 3 类型体验的 TypeScript 小插件集。重构了类型打印逻辑，修复了一些没有正常工作的问题。
- [Clerc](https://github.com/clercjs/clerc)，一个可拓展的 CLI 框架。实现了自己的命令行解析器（@clerc/parser），取得了较大的性能提升，并精简了核心实现，重构了大部分插件以及文档。另外，还有点击即送的补全脚本插件以及更多，欢迎试用！（x
- [bitsgui](https://github.com/so1ve/bitsgui)，一个 [bitsrun-rs](https://github.com/spencerwooo/bitsrun-rs) 的 GUI 客户端。用于在神秘大学校园网环境下自动登录。
  - 不得不提深澜原本的客户端真是吃屎，Electron 打包的巨无霸启动慢且占用资源高就不说了，UI 设计也很糟糕，Dialog 无限弹窗都算小事。所以我就使用 Tauri 顺手写了一个 GUI 客户端。
- [Hashi](https://github.com/so1ve/hashi)，一个基于 Cloudflare Workers 的 Telegram 双向机器人，支持使用 Cloudflare Turnstile 作为验证码，防止机器人骚扰。
- [vite-plugin-simple-tsconfig-alias](https://github.com/so1ve/vite-plugin-simple-tsconfig-alias)，一个 Vite 插件，用于根据 tsconfig.json 自动设置 `resolve.alias`，主打一个功能简单
- [prettier-plugin-mdc](https://github.com/so1ve/prettier-plugin-mdc)，一个 Prettier 插件，用于格式化 MDC 组件。Prettier 默认的 Markdown 格式化器无法正确处理 MDC 组件的特殊语法，因此做了这个项目。

然后 [unml](https://github.com/so1ve/unml) 也捡起来了，希望能尽快做完吧！

---

高强度 Vibe Coding 中……大模型真是 tql！！！Gemini 3，GPT 5.2 和 Claude Opus 完全就是降维打击，极大便利了 Debug 和文档编写！

## 设备

在高考结束后自然而然地迎来了换设备的时机。最终选择了以下设备：

```devices
- name: OnePlus 13
  description: 冲着性能和 BL 无锁去的
  image: https://img.mk1.io/img/20260101014023846.png
  specs:
    - 24GB RAM
    - 1TB 存储

- name: OnePlus Pad Pro
  description: 主要是为了和手机联动 + 手写笔，以及均衡价格考虑
  image: https://img.mk1.io/img/20260101014103604.png
  specs:
    - 8GB RAM
    - 256GB 存储

- name: 机械革命 蛟龙
  description: 具体型号忘了，应该够用很久
  image: https://img.mk1.io/img/20260101014335414.png
  specs:
    - AMD Ryzen 9 9955HX
    - 32GB RAM
    - 1TB SSD
    - RTX 5070Ti

- name: ATK 烈空 F1v2 大师版
  description: 主要是花兽自然损坏了，另外发现自己不适合用大鼠标，最终在国产鼠标里选了个手感最好的
  image: https://img.mk1.io/img/20260101014508555.png
  specs:
    - 16000 DPI
    - 39g

- name: 迈从 Mix 87
  description: 价格实惠，而且支持 SOCD
  image: https://img.mk1.io/img/20260101014604889.png
```


不过也苦于游戏本太厚重 + 续航差，一直在思考要不要拥抱🍎。想了想短期内不太可能，毕竟没有这么多钱。

买了 OP 13 怎么能不 Root 呢，正好此前从来没有折腾过 Root，就趁这个机会好好研究了一下。从 Magisk -> APatch -> KernelSU Next -> SukiSU -> KowSU，最终稳定在了 KowSU LKM 上。自定义内核隐藏麻烦+SusFS 续航差，正好 KernelSU 上游解决了 Delayed Syscall 问题，直接上 LKM 版本就好。也得到了秋刀鱼、SukiSU 群组里大佬的帮助，谢谢喵！

## 社交

2025 年在社交方面并没有太多的变化，主要还是以网络为主。

解散了 Ray の小窝 QQ 群，因为发现自己并不想/没能力长期管理一个群聊。

和群友在 10 月进行了一个北京面面大冲击，感谢 chi！

然后依旧是和子兰群友水群的一年呢！感谢 byn，猫猫，sci，chi，muji，mzw，zxq，69，淇淇，awaae，glucy，Rikki 等群友的陪伴！

另外，还要特别感谢 mzw 在半夜陪我聊天 debug 问题！（x

## 博客

如你所见，博客在这一年里根本就没多少新内容，也就只有两篇原创文章，，，实际上是有很多想法的，但是总是提不起兴趣来写。在此列出一些小小的计划：

- 把 [Clerc：一个轻量但强大的命令行框架](/posts/%E5%BC%80%E5%8F%91%E7%9B%B8%E5%85%B3/hey-clerc.html) 写完；
- 把 [Vue Language Tools 解析](/posts/%E5%BC%80%E5%8F%91%E7%9B%B8%E5%85%B3/Vue%20Language%20Tools/1-develop-and-basics.html) 系列写完；
- 写一篇讲解 ESLint 插件开发的文章；
- 写一篇讲解 Prettier 插件开发的文章；

但愿自己不要咕咕咕（

## 反思

嗯……其实高考结束后，真的是感觉一转眼就又到了年末。根本原因还是时间规划太差劲了，在宿舍里很多时间都是昼夜颠倒，熬夜写代码白天睡大觉，导致效率极低而且没啥精神……学习也没有认真学，差点就挂科了。希望在 2026 年能改掉这个坏习惯吧，然后从现在开始好好复习期末考！

## 后记

写到这里感觉就差不多了，感谢看到这里的你。最后，祝大家新年快乐，2026 年一切顺利！

---

## See Also

- mzwing 的年终总结：[碎记 · 一个简单的 2025 总结](https://mzwing.eu.org/index.html?type=article&filename=2026.md)
- byn 的年终总结：[我的 2025 年终总结](https://nekomoe.xyz/index.html?type=article&filename=2025-summary.md)
- chi 的年终总结：[2025 年度总结](https://blog.chihuo2104.dev/posts/%E5%B9%B4%E7%BB%88%E6%80%BB%E7%BB%93/goodbye-2025.html/)
