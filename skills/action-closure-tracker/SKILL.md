---
name: action-closure-tracker
description: 用于把会议纪要、聊天记录、录音转成闭环行动项。适合 owner、deadline、阻塞、下一步标准化提取和督办建议。
---

# Action Closure Tracker

把“聊过了”变成“能闭环”。

## 输入

- 会议纪要
- 群聊记录
- 录音转写
- 用户口述的待办

## 输出结构

```text
【行动项】
1. 事项：
   Owner：
   Deadline：
   完成标准：
   当前状态：
   阻塞：
   下一步：

【缺失信息】
- 待补 owner
- 待补 deadline
- 待补完成标准

【建议追法】
- 给用户一条最短跟进文本
```

## 规则

- 没有 owner 不算闭环
- 没有 deadline 不算闭环
- 没有完成标准不算闭环
- 模糊动作词不算行动项
- 缺信息必须写【待补】，不代填

