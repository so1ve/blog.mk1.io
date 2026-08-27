---
published: 2024-08-06
---

# 使用 ip6tables 在群晖 DiskStation 上开启 Docker Bridge 网络 IPV6 支持（不支持 SA6400）

## 正文

> [!WARNING]
> 注意：黑群晖、白群晖适用；SA6400 不适用于本教程。


## 前情提要

我自己组装了一台黑群晖，用于存放代码、运行一些服务和存储电影等。如果能拥有公网 IP，那 BT 客户端的可连接性就大大提高，同时也方便自己在外的时候观看电影。但家里用的是移动宽带，而移动宽带想要获取公网 IPV4 地址的难度想必大家都有所了解。不过运营商下发了 IPV6 地址，因此我可以使用公网 IPV6 地址访问这台 NAS。

但是，在默认情况下 Docker 的 Bridge 网络并没有支持 IPV6，尽管能够通过 NAS 的地址访问到 Docker 中的服务，容器本身是不能访问 IPV6 站点的。虽说 Host 网络可以简单粗暴地为容器开启 IPV6 访问，但是就不能够在同一个 Compose 中使用容器名访问其他容器，十分不便，也无法映射端口。因此，我希望能够为 Docker Bridge 网络开启 IPV6 支持。

## 开干

### 填上群晖的坑

众所周知群晖 DSM 系统使用的是魔改版 Linux，其中并没有内置本文所需的 `ip6tables` 模块。因此我们需要手动添加。

前往 [syno-iptables](https://github.com/sjtuross/syno-iptables) 仓库，根据 README 指示查找对应你的群晖 CPU 架构及内核版本的文件夹（如我的型号是 `DS918` 内核版本为 `4.4.302`，那就选择 `apollolake/kernel-4.4.302`），并下载到本地，随后上传到群晖任意一个文件夹中并解压（我上传到 `homes/ray`）这里建议使用 [Download GitHub directory](https://download-directory.github.io/)

随后找到解压出的文件夹，其中会有 `ko` `so` 两个文件夹，右键 - 属性记录下 `位置`，我这里是 `/volume1/homes/ray/sjtuross syno-iptables master apollolake-kernel-4.4.302`

进入群晖 SSH，`sudo -i` 后进入 root 用户，执行下列代码，记得替换为你的路径

```shell
cp /volume1/homes/ray/sjtuross syno-iptables master apollolake-kernel-4.4.302/ko/* /lib/modules/
cp /volume1/homes/ray/sjtuross syno-iptables master apollolake-kernel-4.4.302/so/* /usr/lib/iptables/
```

接下来依旧需要根据你的内核版本执行对应命令，以我的 `4.4.302` 为例：

```shell
insmod /lib/modules/nfnetlink.ko &> /dev/null
insmod /lib/modules/ip_set.ko &> /dev/null
insmod /lib/modules/ip_set_hash_ip.ko &> /dev/null
insmod /lib/modules/xt_set.ko &> /dev/null
insmod /lib/modules/ip_set_hash_net.ko &> /dev/null
insmod /lib/modules/xt_mark.ko &> /dev/null
insmod /lib/modules/xt_connmark.ko &> /dev/null
insmod /lib/modules/xt_comment.ko &> /dev/null

insmod /lib/modules/nf_conntrack_ipv6.ko &> /dev/null
insmod /lib/modules/nf_defrag_ipv6.ko &> /dev/null

insmod /lib/modules/xt_TPROXY.ko &> /dev/null
insmod /lib/modules/xt_socket.ko &> /dev/null
insmod /lib/modules/iptable_mangle.ko &> /dev/null
insmod /lib/modules/textsearch.ko &> /dev/null
insmod /lib/modules/ts_bm.ko &> /dev/null
insmod /lib/modules/xt_string.ko &> /dev/null

insmod /lib/modules/ip6_tables.ko &> /dev/null
insmod /lib/modules/nf_nat.ko &> /dev/null
insmod /lib/modules/nf_nat_ipv6.ko &> /dev/null
insmod /lib/modules/nf_nat_masquerade_ipv6.ko &> /dev/null
insmod /lib/modules/ip6t_MASQUERADE.ko &> /dev/null
insmod /lib/modules/ip6table_nat.ko &> /dev/null
insmod /lib/modules/ip6table_raw.ko &> /dev/null
insmod /lib/modules/ip6table_mangle.ko &> /dev/null
```

其他版本的内核根据项目 README 走就行，这里不再贴了。

### 配置 Docker

在 DSM 7.2 之后群晖的 Docker 套件更名为 Container Manager，其存放配置文件的目录也进行了更名，因此命令稍有不同

```shell
# DSM 7.2+
sed -i 's/}/,"experimental":true,"ip6tables":true}/' /var/packages/ContainerManager/etc/dockerd.json

# 旧版
sed -i 's/}/,"experimental":true,"ip6tables":true}/' /var/packages/Docker/etc/dockerd.json
```

### 在 Docker Compose 中启用

只需要添加：

```yaml
networks:
  default:
    enable_ipv6: true
    driver: bridge
```
