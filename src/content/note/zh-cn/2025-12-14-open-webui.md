---
title: Open WebUI：配置联网搜索
timestamp: 2025-12-14
tags:
  - Open WebUI
  - 联网搜索
toc: true
---
# 背景

之前乘着十一假期，看着佬友的教程在 Huggingface Space 中部署了 Open WebUI ，随着使用频数提高，渐渐发现联网搜索不时出现问题

# 报错

![](/assets/403918326-09c6e6ce-eb5e-40c2-b654-d754328495ad.png)

发送消息后后可以正常生成索引，但是开始搜索是就会报错：`An error occurred while searching the web`

# 解决

## 第一次尝试（失败）

当时我用的是 Tavily ，想免费的总是会不稳定，想到之前折腾过 NextChat ，里面插件有一个是用自部署的 SearXNG 作为搜索引擎，不如尝试一下？

于是上网一搜，发现还不少，甚至还有一个网站（ [https://searx.space/](https://searx.space/) ）专门收录

![](/assets/1765706725830.png)

这里选择一个看起来比较正规的供参考：

*   [https://opnxng.com](https://opnxng.com/)
    

当然如果想要定制化，可以去 Huggingface 上搜下 Space ，很多，比如我搭建的：

*   [https://xkjing-searxng4owui.hf.space](https://xkjing-searxng4owui.hf.space)
    

_然而并没有解决问题_

仍然产生相同的错误，而且也被搞毛了，于是不了了之，这次尝试以失败告终

## 第二次尝试（解决）

这几天下决心解决这个问题，于是翻看后台日志，还真的找到了些信息：

*   首先，发现搜索后 SearXNG 正确地返回了 JSON 格式的结果，说明问题不在搜索引擎
    
*   其次，阅读一下摘录出来的内容，发现问题出在 `process_web_search` 和 `process_web_search` 中，所以应该是网页加载器的问题
    

```
File "/usr/local/lib/python3.11/socket.py", line 974, in getaddrinfo
for res in _socket.getaddrinfo(host, port, family, type, proto, flags):
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
socket.gaierror: [Errno -2] Name or service not known
ERROR [open_webui.utils.middleware] 400: [ERROR: [Errno -2] Name or service not known]
Traceback (most recent call last):
File "/app/backend/open_webui/routers/retrieval.py", line 1269, in process_web_search
loader = get_web_loader(
^^^^^^^^^^^^^^^
File "/app/backend/open_webui/retrieval/web/utils.py", line 90, in c
if not validate_url(urls):
^^^^^^^^^^^^^^^^^^
File "/app/backend/open_webui/retrieval/web/utils.py", line 41, in validate_url
return all(validate_url(u) for u in url)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
File "/app/backend/open_webui/retrieval/web/utils.py", line 41, in
return all(validate_url(u) for u in url)
^^^^^^^^^^^^^^^
File "/app/backend/open_webui/retrieval/web/utils.py", line 30, in validate_url
ipv4_addresses, ipv6_addresses = resolve_hostname(parsed_url.hostname)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
File "/app/backend/open_webui/retrieval/web/utils.py", line 48, in resolve_hostname
addr_info = socket.getaddrinfo(hostname, None)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
File "/usr/local/lib/python3.11/socket.py", line 974, in getaddrinfo
for res in _socket.getaddrinfo(host, port, family, type, proto, flags):
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
socket.gaierror: [Errno -2] Name or service not known
```

根据关键句 `ERROR [open_webui.utils.middleware] 400: [ERROR: [Errno -2] Name or service not known]` ，搜索到 Discussion （ [https://github.com/open-webui/open-webui/discussions/8625](https://github.com/open-webui/open-webui/discussions/8625) ）中对此的解决方案：

> Apparently, we need to add in env file, ENABLE\_RAG\_LOCAL\_WEB\_FETCH = true, if we are using private address/local setup for searxng. This should solve the issue.

所以我们要在 Huggingface Space 的环境变量里加入 `ENABLE_RAG_LOCAL_WEB_FETCH` 字段，并赋值为 `True`

![](/assets/1765707569282.png)

**一定要记得先备份数据！！！不然全部都会丢失！！！**

保存后容器自动重启，顺便还更新到最新版本

## 配置

最终联网搜索配置如下：

![](/assets/1765707747387.png)

## 成果

联网搜索正常

就是慢了点，以及有些网站如 Wikipedia 和 Reddit 对爬虫做了屏蔽，无法获得结果，但正常使用还是游刃有余的

![](/assets/1765707880281.png)