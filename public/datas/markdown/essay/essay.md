## 🍃Github

### 1、github cli clone

如果你已经在使用 Clash、V2Ray 等网络代理工具，可以将 Git 的流量也通过代理走。

1. 配置代理：在终端中执行以下命令，将 Git 的 HTTP/HTTPS 代理指向你的本地代理端口（以 Clash 默认的 7890 端口为例）：

```bash
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890
```

2. 验证配置：执行 `git config --global --list` 查看代理是否设置成功。

**如何取消代理？**

如果你不再需要代理，或者代理工具已关闭，务必取消 Git 的代理设置，否则会导致连接失败：

```bash
git config --global --unset http.proxy
git config --global --unset https.proxy
```

## 💡Tips 

### Chrome 缓存搬家

- 🚀知乎链接：[C盘告急？一招让Chrome缓存搬家，小白也能轻松搞定！](https://zhuanlan.zhihu.com/p/1892481863823638897)

### 提升 Figma 访问速度

> 参考文章：https://zhuanlan.zhihu.com/p/402819516

1. 下载，解压并运行文件「**FigmaNetOK**」
2. 测速中，等待一会
3. 得到最佳线路的 Hosts 配置

- 你可以授予管理员权限一键修改 Hosts
- 也可以把复制运行结果，手动去修改 Hosts 文件
