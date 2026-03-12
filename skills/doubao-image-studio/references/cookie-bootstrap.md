# 用户 Cookie/Profile 同步

## 目标

让 OpenClaw Browser 复用用户自己的豆包登录态，避免每次都重新扫码。

## 操作约束

1. 第一次登录必须由用户自己在原浏览器里扫码完成。
2. 同步前必须彻底关闭原浏览器，否则 Cookies / IndexedDB / Local Storage 容易被锁。
3. 同步目标默认就是 OpenClaw Browser 的 `openclaw` profile。

## 推荐命令

```bash
node ~/.openclaw/skills/doubao-image-studio/scripts/sync_user_browser_profile.mjs \
  --source-browser chrome \
  --source-profile Default \
  --target-profile openclaw
```

## 默认行为

- 源：`~/Library/Application Support/Google/Chrome/<profile>`
- 目标：`~/.openclaw/browser/<target-profile>/user-data/Default`
- 会复制：
  - `Local State`
  - 用户 profile 内的 Cookies / Local Storage / IndexedDB / Session 数据
- 会跳过：
  - `Cache`
  - `Code Cache`
  - `GPUCache`

## 失败时先查

- Chrome 还在运行
- OpenClaw Browser 还在运行
- 选错了用户 profile（不是 `Default` 就改成 `Profile 1` 等真实目录）
