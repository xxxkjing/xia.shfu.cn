---
title: "Open WebUI：重复登录的一种可能性"
timestamp: "2026-01-04T08:00:00.000Z"
tags: ["Open WebUI", "Cookie"]
description: "OpenWebUI重复登录的一种可能性"
sensitive: false
toc: true
top: 0
draft: false
---

原因：JWT (JSON Web Token)  设置太小了

![840ffdbf08b84216a62e3601ff1ea3b0.png](/uploads/840ffdbf08b84216a62e3601ff1ea3b0.png)


## 什么是JWT？

JWT 全称 JSON Web Token，是一种 开放标准（RFC 7519），用于在网络应用环境间 安全地传递声明（Claims）。

简单说：

JWT 就是一个 自包含的、 紧凑的、 URL安全的字符串，里面携带了用户身份信息，并且通过签名保证了 不可篡改。 

它最大的特点是 无状态（Stateless）。服务器不需要在Session中存储用户信息，只要验证Token签名正确，就能信任里面的内容。


## 设置太小会怎么样？

设得太短，比如 Access Token 只设 30 秒、1 分钟。

会出现如下问题：
- 用户体验极差：频繁跳登录页，或者请求频繁失败。
- 刷新压力大：客户端必须非常频繁地用 Refresh T- oken 换新 Access Token，增加服务器负担和网络请求。
- 竞态问题：Token 刚好在请求途中过期，容易出现“闪断”或重复刷新。

![5eea655d4a70430c8bc354bb45d23960.png](/uploads/5eea655d4a70430c8bc354bb45d23960.png)

- 移动端/弱网环境更糟：网络延迟高时，体验会明显下降。

设置过短虽然更安全，但会牺牲可用性。