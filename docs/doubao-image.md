# 豆包免费生图

## 结论

当前最稳的免费路径不是接第三方图像 API，而是：

1. 第一次让用户自己在原浏览器里扫码登录豆包
2. 第二次关闭用户浏览器
3. 把用户浏览器 profile/cookie 同步到 OpenClaw Browser
4. 之后由 OpenClaw Browser 驱动豆包 Web 生图
5. 出图后再通过 `message` 工具发回 Feishu

## 本机验证结论

2026-03-12 在本机做过验证：

- OpenClaw Browser 能打开 `https://www.doubao.com/chat/`
- 页面能识别到 `AI 创作` 和 `图像生成` 入口
- 登录后能进入包含以下控件的图像生成页：
  - `Seedream 4.5`
  - `比例`
  - `风格`
  - `描述你想要的图片`
- `peekaboo` 已安装，且 Screen Recording / Accessibility 权限都已通过

## 推荐策略

- 首选：OpenClaw Browser（CDP 控制、结构化、可拿 snapshot）
- 回退：Peekaboo（页面 target 丢失、下载异常、需要 native UI 操作时）

## 首次准备

```bash
node ~/.openclaw/skills/doubao-image-studio/scripts/sync_user_browser_profile.mjs \
  --source-browser chrome \
  --source-profile Default \
  --target-profile openclaw
```

前提：

- 用户已经在自己的 Chrome 里完成豆包扫码登录
- 用户已经彻底关闭 Chrome
- OpenClaw Browser 当前没有运行

## 关键约束

- 不要反复重新登录豆包
- 点击前必须重新抓 snapshot，不复用旧 ref
- 结果图片优先下载，拿不到下载按钮时再截图图片区域
- 发图必须通过 `message` 工具
