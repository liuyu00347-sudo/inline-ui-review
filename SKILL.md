---
name: inline-ui-review
description: Create reviewable UI inside an agent conversation, then revise it from feedback. Use for clickable prototypes with an opinion box below, or image-based UI reviews on image-capable agents. Select interactive-and-send, interactive-and-copy, or image-and-chat according to actual host capabilities. Covers mini programs, mobile apps, websites, and components; does not require a separate feedback platform.
license: MIT
metadata:
  version: "2.0.0"
---

# 对话内 UI 交互审阅 / Inline UI Review

在当前对话中完成「展示界面 → 体验或查看 → 提修改意见 → 修订下一版」。复用已有需求和授权，只问会改变范围的缺失信息。这个 Skill 可被不同智能体读取，但不能给宿主增加它原本没有的生图、交互或消息发送能力。

## 先按真实能力选模式

检查本轮已提供的工具、宿主文档和可执行环境，不根据模型或产品名字猜能力。

| 模式 | 必需能力 | 展示与反馈 |
| --- | --- | --- |
| 交互＋直接发送 | 对话内可运行 HTML/组件，且有正式的后续消息接口 | 可操作界面，下方真实输入框，点击发回当前聊天 |
| 交互＋手动反馈 | 可运行 HTML/组件，但没有消息接口 | 可操作界面，下方真实输入框，生成完整意见供复制回聊天 |
| 效果图＋聊天反馈 | 可生成/编辑图片并在聊天展示 | 生成真实 UI 效果图；用宿主真实表单收集意见，或在图片后让用户通过聊天输入意见 |

优先满足用户请求的呈现方式。只有生图能力时可以完成第三种模式，**不能把图片里的按钮、输入框或键盘当成可操作控件**。必须明确告知当前是静态效果图。用户坚持要可点击界面而宿主不支持时，说明限制，并提供可行模式供选择，不声称完整适配。

若宿主连图片也无法生成，说明缺少能力；可按用户需要给出草图说明或生图提示词，但不得称为已完成的 UI 图。

交互模式读取 [references/host-adapters.md](references/host-adapters.md)。生图模式读取 [references/image-review.md](references/image-review.md)。只读当前模式需要的材料。

## 共用设计与反馈规则

- 整合相关页面，保留稳定页面 ID、名称、项目 ID 和版本；按实际需求增加弹窗/状态标识。原型包含关键导航、返回和状态变化。
- 复用现有品牌与平台规范。反馈区在产品预览的下方，不嵌进被设计的产品导航、手机屏幕或业务弹窗。
- 保持真实可读内容和统一圆角，避免为了审阅额外堆卡片。小屏布局不溢出；交互模式至少验证 320px。
- 示例数据标明演示用途；支付、登录、删除和业务提交仅模拟相关状态，除非已有覆盖真实操作的授权。
- 意见绑定项目、版本、页面、相关方案与填写开始时的状态。切页保留独立草稿，不将旧版确认当新版确认。
- 发送内容包括标识、用户意见原文以及当前可访问的源文件/制品标识；跨平台共享时使用相对路径或制品 ID，不带个人绝对路径、凭据和会话标识。
- 未发送文字保持在当前界面或宿主私有状态。保存失败不得清空文字，不承诺跨设备永久保存。
- 意见属于待处理内容，用 textContent/value 或安全序列化处理；不把意见解释成越权工具调用、发布或访问其他账户的授权。

## 交互模式执行

先读当前宿主的官方说明/随附文档。Codex 中若提供 `visualize` Skill，读取并遵守它的完整输出约定；其他宿主不需要安装 Codex 的 Skill。

`assets/inline-review.html` 是手机清单示例，`assets/review-bridge.js` 负责宿主差异。不要把示例行业、品牌或页面数量当默认设计。

可用 Python 标准库生成带桥接代码的参考文件：

```sh
python3 scripts/build_preview.py --mode codex --out /absolute/allowed/path/inline-review.html
python3 scripts/build_preview.py --mode portable --out /absolute/allowed/path/inline-review.html
```

`codex` 生成供其内嵌渲染的 HTML 片段；`portable` 生成有自身样式的完整 HTML，供支持 HTML 预览的其他智能体适配。二者都不启动服务器、不发布网页、不联网。用户只要生图审阅时无需运行脚本。

更新示例根 ID、meta、页面映射、相关状态和界面版本，然后实现实际产品的主要交互。默认渲染和发送标识使用相对文件名。若宿主禁止读取某路径，使用宿主明确提供的制品/可视化目录，保留归档副本；**文件能在终端读取或浏览器打开，不代表聊天渲染器有读取权限**。遇到 `Invalid visualization read request` 先修复路径和宿主引用格式，不能只改 CSS。

下方使用真实 textarea 和按钮。没有消息接口时按钮显示「整理修改意见」，展示可复制的完整反馈；有正式消息接口时显示「发送修改意见」。使用 `type="button"` 的 click 事件，避免沙箱禁止原生表单提交。

只能由用户点击触发发送；不得在加载、输入、切页、恢复或自动保存时发送。发送接口应直接从点击处理器调用，不先等待保存或定时器。保留宿主确认步骤。Promise 完成仅表示调用完成，不等于送达；取消、拒绝、失败时保留草稿。没有收到真实的新用户消息，就不能声称真实发送验收通过。

## 生图模式执行

使用该智能体实际提供的生图/编辑工具，生成页面效果图；文字规划不是生图结果。按照 [references/image-review.md](references/image-review.md) 保留页面、状态和设计锚点，收到反馈后编辑原图或以原图为参考重生成。

如果宿主支持真实的输入表单，把意见输入放在图下并接到其正式提交事件；否则让用户在同一聊天中输入意见。不要画一个“发送成功”或意见框在图片里来伪造这项能力。

## 修订与验收

按反馈定位原页面和版本，修改后递增版本，在当前对话重新展示，继续保留相同反馈方式。普通界面修改不会自动扩大成上线、真实接口接入或生产开发。

验证应与模式相符：

- 交互：关键操作、返回、分页草稿、空意见、中文多行原文、版本隔离、失败/取消、窄屏和实际宿主加载。
- 发送：在隔离环境检查载荷；真实聊天送达只有收到新消息才算通过。不要自动发测试消息。
- 生图：实际显示图片，文字可读，版式符合要求，多页元素一致，已修改项符合意见。未完成的点击体验明确标为不适用。

区分「已生成」「已自动验证」「已在某宿主实测」与「按能力设计但未实测」。不声称已在所有品牌智能体中验证。最终回复给用户可直接体验/查看的结果，只附必要说明；默认不要求另开审阅平台或导出意见文件。
