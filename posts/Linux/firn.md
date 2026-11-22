---
published: 2026-11-23
---

# Firn：用 GHCR 和 Cloudflare D1 搭个 Nix 二进制缓存

ToS，很神奇吧

## 前言

上一篇写 [nix-repin](/posts/Linux/nix-repin.html) 的时候提到了 `cache.so1ve.dev`。之前这个缓存跑的是 [oranc](https://github.com/linyinfeng/oranc)，把编译产物塞进 GHCR（GitHub Container Registry）的镜像层里，前面再套个 Cloudflare Worker 转成 Nix 二进制缓存的接口。

拿公开仓库的 GHCR 存 Nix 包是真的香，不限容量，下载还走 GitHub 的 CDN，相比 Cachix 免费版那 5GB 额度或者自己掏钱买 R2 划算太多了。

不过 `oranc` 为了做成纯无状态服务，把 `.narinfo` 和压缩后的 NAR 文件全都作为 OCI layer 塞进了 GHCR，再用 `<storeHash>` 当镜像 tag。用了一阵子之后，有几个地方实在让人难受：

一个是查 `.narinfo` 太慢。Nix 在算依赖的时候会一口气并发请求一大堆 `<storeHash>.narinfo`。无状态的 Worker 每次收到请求，都得先去 GHCR 换个匿名 pull token，再拉 OCI manifest，最后跟一次 302 跳转把 `.narinfo` 读出来返回。哪怕某个包根本不在缓存里（404），也得去 GHCR 走完这一整套请求。

再就是没法做安全的垃圾回收（GC）。Nix 的 store path 之间是有引用关系的，如果只是按时间把旧的 GHCR package version 删掉，很可能某个常用的上层包还在，但它依赖的某个底层库因为很久没重新编译过，被当成过期版本删了，整个缓存闭包就废了。

另外每次开新仓库配 GitHub Actions 都得往 Secrets 里塞 `NIX_SIGNING_KEY` 和写 GHCR 用的 PAT。我自己的 `so1ve` 和社团的 `bitoolkit` 共用这一个缓存域名，管起来很烦。而且跑 PR 的时候也不敢开缓存推送——直接往主缓存写吧，还没合入的分支万一改坏了就会污染主缓存；不写吧，同一个 PR 跑好几个 job 或者连续推 commit 又没法复用前面编好的东西。

说白了就是服务端不能完全无状态，至少得有个数据库存一下 `.narinfo` 和引用关系。正好 Cloudflare D1 的免费额度拿来存几万条文本元数据绰绰有余，这两天就干脆重写了一套：[Firn](https://github.com/so1ve/firn)。

## 思路

做法很简单：把 `.narinfo` 挪到 D1，`.nar.zst` 大文件继续丢 GHCR。

D1 里就三张表：`blobs` 记 GHCR 上的包名和 digest，`store_paths` 记每个路径的 `.narinfo` 字段（`StorePath`、`NarHash`、`FileHash`、`References`、`Sig` 等）以及最后访问时间，`pr_scopes` 记当前有哪些活跃的 PR。

客户端拉缓存的时候：

- 请求 `/<storeHash>.narinfo`：Worker 直接查 D1 拼出文本返回，顺便用 `waitUntil` 异步更新一下 `last_accessed_at`（为了省 D1 写入额度做了 24 小时节流）。全程不碰 GHCR，在不在缓存里查一下表就知道了。
- 请求 `/nar/<blobDigest>.nar.zst`：Worker 从 D1 查出这个 blob 放在哪个 GHCR package 里，向 GHCR 换个下载链接，直接给客户端回 `302 Redirect`。大文件流量全走 GitHub CDN，不占 Worker 的内存和运行时间。

## 推送与免 Secret 的 GitHub Actions

既然有了服务端，Ed25519 签名私钥就不用到处发了，直接塞在 Worker 的环境变量里，由服务端统一签名。

在 GitHub Actions 里，Firn 直接用 Actions 原生的 OIDC（`id-token: write`）向 Worker 证明身份，再用 runner 自带的 `GITHUB_TOKEN`（`packages: write`）往 GHCR 传文件。所以新仓库接入缓存只需要在 workflow 里加几行，**不需要配任何仓库 Secret**：

```yaml
permissions:
  contents: read
  id-token: write
  packages: write

steps:
  - uses: actions/checkout@v7
  - uses: cachix/install-nix-action@v32
  - uses: so1ve/firn@main
    with:
      server: https://cache.so1ve.dev
  - run: nix flake check
```

推送时客户端和 Worker 会交互两次：

1. 先调 `/api/v1/uploads/plan`，把本地算出来的候选闭包（默认跳过带 `cache.nixos.org-1:` 官方签名的路径）发过去。Worker 校验 OIDC JWT 里的数字 `repository_owner_id`、仓库名和分支，去 D1 查出还没缓存的 store path，把缺失列表和目标 GHCR 仓库名返回给客户端。
2. 客户端只对缺失的 path 跑 `nix-store --dump`，流式接上 Node.js 内置的 `zlib.createZstdCompress` 压成 `.nar.zst`，边压边算好 NAR 和压缩文件的两个 SHA-256，然后直接推到 GHCR（作为单层 OCI artifact，tag 为 `nar-<blobDigest前32位>`）。
3. 传完调 `/api/v1/uploads/commit` 把元数据报给 Worker。Worker 不会直接信客户端报上来的数据，而是会自己去 GHCR 拉一次对应的 OCI manifest 并 `HEAD` 一下 blob，核对 digest 和文件大小确实一致后，才用私钥签名并写进 D1。

这里还卡了一下 Cloudflare Workers 的限制：免费版单次请求最多只能发 50 个 subrequest。每次 commit 校验要先换 1 次 token，每个 path 要向 GHCR 发 2 个请求（查 manifest + `HEAD` blob），所以客户端会自动按 15 个 path 一批分块提交（1 + 15 × 2 = 31 < 50）。

Action 本身直接跑在 `node24` 上：`main` 阶段从 `/api/v1/public-keys` 拉取公钥写进 `nix.conf`，再记下 `/nix/store` 现有的目录列表；等 job 跑完进 `post` 阶段，对比出新构建的 path 推上去。

如果在自己电脑上手动推包，我也用 [Clerc](https://github.com/clercjs/clerc) 写了个 `firn` CLI。本地没有 OIDC，只要配个静态的 `FIRN_TOKEN`，Worker 在 Plan 阶段会用配好的 GitHub App 签发一个临时的、只对目标 GHCR package 生效的上传 token 返回给 CLI，本地也不用存高权限的 GitHub PAT：

```sh
nix build .#default --print-out-paths | firn push --stdin
```

## PR Overlay

为了不让 PR 污染主缓存，D1 里的 `store_paths` 加了个 `scope` 字段，Worker 上也配了 `MAIN_SIGNING_KEY` 和 `PR_SIGNING_KEY` 两把私钥：

- 受保护分支（默认 `refs/heads/main`，在 Worker 配置里改，不需要去 GitHub 开分支保护）的 CI 和本地手动推送会写进 `main` scope，用 `MAIN_SIGNING_KEY` 签名。
- 同仓库的 `pull_request` 事件触发 CI 时，Worker 从 OIDC 的 `refs/pull/<n>/merge` 拿到 PR 编号，只允许写进 `pr:<owner>:<repo>:<number>` 这个 scope，用 `PR_SIGNING_KEY` 签名。
- 外部 Fork 提过来的 PR 或者 `pull_request_target` 事件一律拒绝写入，只允许从主缓存拉取。

当 Nix 请求 `/pr/<owner>/<repo>/<number>/<storeHash>.narinfo` 时，如果 D1 在这个 PR 自己的 scope 里没查到，会自动 fallback 去查 `main` scope。

这样 PR 的 CI 只要把 substituter 设成 `/pr/<owner>/<repo>/<number>` 并同时信任两把公钥（Action 会自动识别 PR 环境配好），就能同时读到主分支的缓存和当前 PR 自己编出来的缓存；而平时用户机器上的 `nix.conf` 只配主缓存地址和 `MAIN_SIGNING_KEY`，完全不会读到 PR 里未合入的东西。

等 PR 合并或关闭时，如果配了 GitHub App 的 `pull_request` Webhook，Worker 收到 `closed` 事件就会把这个 PR 的 scope 从 D1 删掉；没配 Webhook 的话，过期（默认 3 天）后也会被定时 GC 清掉。

## 垃圾回收与 GHCR 的两个坑

Worker 配了每 6 小时跑一次的 Cron（也可以用 `firn gc` 手动触发）。除了清掉过期的 PR scope，主缓存做的是保留依赖闭包的 LRU 淘汰：

GC 启动时把 `main` 下所有路径的 `last_accessed_at` 和 `references` 读出来在内存里建图，拿最近 15 天（`GC_MAIN_LRU_DAYS`）内被访问过的路径当起点跑一次 BFS。只要某个底层库还被任何一个近期用过的上层包直接或间接引用，就保留下来；只有整条引用链都没人碰的路径才从 `store_paths` 里删掉。

删完 `store_paths` 后，再去 `blobs` 表里找没有任何路径引用的孤儿 blob（因为同一个 blob 可能被 PR 和 `main` 同时引用，所以两张表是拆开的），用 GitHub App 调 REST API 把对应的 GHCR package version 删掉。

写删除逻辑的时候踩了 GHCR 的两个坑：

第一个坑是 **package 里的最后一个 version 不让直接删**。当某个 GHCR container package 只剩最后一个 version 时，调 `DELETE /versions/{id}` 会直接报 `400 Bad Request`（提示不能删除最后一个版本）。所以在代码里加了个判断：遇到这个 400 就改成调 `DELETE /packages/container/{package}` 把整个空包删掉，反正下次推包时 GHCR 会自动重建。

第二个坑是 **下载满 5000 次的公开包不让删**。GitHub 规定公开 package 累计下载超过 5000 次后，API 就永久禁止删除（返回 `400`/`403`/`422`）。为了防止每次 GC 都在这几个包上反复报错，碰到这种返回就直接把数据库里的对应记录标成 `gc_blocked = 1` 并记下原因，后面 GC 直接跳过。

## 面板与 CLI

用 Hono 顺手写了个服务端渲染的页面，浏览器直接打开 [`https://cache.so1ve.dev`](https://cache.so1ve.dev) 就能看到当前缓存的路径数、每个 owner 的 GHCR 占用、活跃的 PR Overlay 和被拦截的 `gc-blocked` 列表，也可以直接搜包名点开看 `.narinfo`。点右上角的 **Admin** 填上 `ADMIN_TOKEN` 后，能在网页上直接删 PR Overlay 或者跑 GC。

也可以用 `firn` CLI：

```sh
export FIRN_SERVER=https://cache.so1ve.dev
export FIRN_ADMIN_TOKEN=<admin-token>

firn status
firn ls -q latchshot --owner so1ve
firn pr ls
firn pr rm so1ve latchshot 7
firn gc --dry-run
```

另外整个项目从 Worker、CLI 到 Action 都没有打包构建步骤。Worker 直接用 Wrangler 部署 TS 源码；CLI 和 Action 直接靠 Node.js 24 原生执行 `.ts` 文件的能力跑起来，Zstd 压缩用的也是 Node 内置的 `node:zlib`，所以生产依赖只有 `hono` 和 `clerc` 两个包。Worker 里为了用 Web Crypto 签 GitHub App 的 JWT，直接手写了二十几行 ASN.1 DER 编码把 GitHub 给的 PKCS#1 RSA 私钥包成 PKCS#8 喂给 `crypto.subtle.importKey`，连第三方加密库都省了。

现在 [`cache.so1ve.dev`](https://cache.so1ve.dev) 已经切到 Firn 上了，代码在 [`so1ve/firn`](https://github.com/so1ve/firn)（x
