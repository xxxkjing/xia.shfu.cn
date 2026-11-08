---
title: "在Linux里面源码安装python"
timestamp: "2026-11-07T19:31:00.000Z"
tags: ["Software"]
description: "在Linux里面源码安装python"
sensitive: false
toc: false
top: 0
draft: false
---

直接贴到终端里面

```
# 1. 安装依赖
apt install -y build-essential zlib1g-dev libssl-dev libbz2-dev \
libreadline-dev libsqlite3-dev libffi-dev liblzma-dev wget

# 2. 从华为云镜像下载并解压源码
cd /tmp
# 使用华为云镜像加速下载
wget https://mirrors.huaweicloud.com/python/3.12.4/Python-3.12.4.tgz
tar xzf Python-3.12.4.tgz
cd Python-3.12.4

# 3. 配置、编译并安装到独立前缀
./configure --enable-optimizations --prefix=/opt/python3.12
make -j$(nproc)
make altinstall

# 4. 验证
/opt/python3.12/bin/python3.12 --version
```