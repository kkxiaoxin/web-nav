<h1 align="center">
  <img src="./public/favicon.ico" alt="web nav" width="128" />
  <br>
  A Simple <a href="/">Web Nav</a>
  <br>
</h1>

<h3 align="center">
网址导航 | Web Nav
</h3>

## 💫Web Nav

- 网址导航页
- json配置
- 亮暗主题切换
- Markdown 文档

## 🌐链接

| 环境       | 地址                                   |
|----------|--------------------------------------|
| 🚀演示demo | https://kkxiaoxin.github.io/web-nav/ |

## 安装

Node >= 20

```bash
pnpm i

pnpm dev

pnpm build
```

## 截图

![light.png](assets/light.png)

![dark.png](assets/dark.png)

## 项目配置

- 💡修改src/config/app.ts中的配置

```bash
export const APP_CONFIG = {
  // 应用基础路径前缀，比如：BASE_PREFIX: '/nav',
  BASE_PREFIX: '',
  TITLE: '小新导航',
  SITE_NAME: '小新导航-资源合集',
  SITE_LOGO: '/favicon.ico',
  SITE_DESCRIPTION: '🍃记录一些个人收藏的常用网站',
  DEV: {
    PORT: 3000
  }
}
```

## nginx conf

```shell
server {
  listen 10001;
  listen [::]:10001;
  server_name localhost;

  gzip on;
  gzip_min_length 1024;
  gzip_types text/css application/javascript application/json application/xml text/xml;

  # 禁用浏览器缓存
  add_header Cache-Control "no-cache, no-store, must-revalidate";
  add_header Pragma "no-cache";
  add_header Expires "0";
  etag off;

  location /nav {
    alias /home/nav/dist/;
    try_files $uri $uri/ /nav/index.html;
    index index.html;
  }
}
```