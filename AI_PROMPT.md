# Local AI Bootstrap Prompt

你的任务是在一台刚安装好 OpenClaw 的新电脑上，把当前仓库安装成可运行的 4-Agent 飞书高管助手套件。

先读这些文件：

1. `README.md`
2. `AGENTS.md`
3. `scripts/configure-openclaw-suite.mjs`
4. `scripts/provision-feishu-bots.mjs`
5. `templates/skills/executive-profile-onboarding/SKILL.md`

执行目标：

1. 安装 4 个角色到 `~/.openclaw/executive-feishu-suite/`
2. 写入并绑定 4 个 agent：`strategist`、`chief-of-staff`、`life-concierge`、`second-brain`
3. 安装共享 skill：`executive-profile-onboarding`
4. 如果用户提供了额外 skill 路径，用 `--extra-skills` 一并安装到 `~/.openclaw/skills/`
5. 保证首次私聊时，如果 `USER.md` 仍是 `pending`，agent 会先用中文开场并进入交互式初始化
6. 保证飞书应用名使用：`商业参谋`、`效率管家`、`生活助理`、`知识管家`
7. 不要重复创建同名飞书应用

执行顺序：

1. `npm install`
2. `npm run provision:feishu`
3. `npm run configure:openclaw`

如果用户给了画像 JSON：

```bash
npm run configure:openclaw -- --profile-json /path/to/profile.json
```

如果用户给了额外 skill：

```bash
npm run configure:openclaw -- --extra-skills /abs/path/to/skillA,/abs/path/to/skillB
```

完成后验证：

1. `~/.openclaw/openclaw.json` 中存在 4 个 Feishu account 和 4 个 bindings
2. `~/.openclaw/skills/executive-profile-onboarding` 已安装
3. 用户指定的额外 skills 已安装到 `~/.openclaw/skills/`
4. `~/.openclaw/executive-feishu-suite/agents/*/BOOTSTRAP.md` 存在
5. `USER.md` 为 `pending` 时，agent 首次回复应先触发初始化，而不是直接执行业务任务
