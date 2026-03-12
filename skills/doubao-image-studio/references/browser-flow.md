# 豆包页面操作顺序

## 已验证路径

- 首页：`https://www.doubao.com/chat/`
- 入口一：顶部 `AI 创作`
- 入口二：首页技能区 `图像生成`
- 登录后可见：
  - 模型按钮：`Seedream 4.5`
  - 比例按钮：`比例`
  - 风格按钮：`风格`
  - Prompt 文本框：占位文案 `描述你想要的图片`

## 稳妥流程

1. `browser start`
2. `browser open https://www.doubao.com/chat/`
3. `browser snapshot`
4. 通过当前 snapshot 找 `图像生成` 或 `AI 创作`
5. 点击后立刻重新 `snapshot`
6. 找到 `描述你想要的图片` 文本框
7. 输入 prompt
8. 找发送按钮
9. 提交后等待图片卡片 / 下载按钮 / 结果图片区出现

## 注意

- 豆包页面的 ref 变化快，不能复用旧 ref。
- 页面偶尔会跳到 `?from_login=1`，但登录后仍可继续走图像生成。
- 如果 `browser tabs` / `targetId` 异常，重启 OpenClaw Browser 再继续。
