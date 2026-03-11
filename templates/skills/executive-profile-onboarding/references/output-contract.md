# 输出写入规则

## 必写文件

- `USER.md`
- `MEMORY.md`

## 条件生成

- `radar/INTERESTS.md`
  - 仅当 `knowledge.pushMode` 为“主动推送型”或“混合型”时生成完整内容
  - 否则维持 disabled 状态占位文件

## 写入方式

- 优先写当前工作区路径：
  - `./USER.md`
  - `./MEMORY.md`
  - `./radar/INTERESTS.md`
- 如果这些路径是共享软链接，直接写即可，系统会同步到共享底座

## 状态注释

- `USER.md` / `MEMORY.md`
  - 顶部状态注释从 `pending` 切到 `ready`
- `radar/INTERESTS.md`
  - 主动推送开启时写 `active`
  - 否则保持 `disabled`

## 用户确认

首次完整初始化时，先给预览，再覆盖文件。
如果用户只改单点字段，可以直接改写并告知结果。
