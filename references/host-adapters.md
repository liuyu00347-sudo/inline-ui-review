# 宿主能力与适配器

本文件描述本项目的内部适配接口，不是任何厂商新增的官方 API。宿主名称不能证明能力；同一产品的网页、桌面、移动端和 API 环境也可能不同。

## Codex 原生路径

在当前技能目录中定位 `visualize`，读取完整说明。不要复制其专有运行时资源到本项目，也不写死插件缓存版本。

- 按宿主约定用片段呈现，在最终回复中包含内嵌引用。
- 优先写入本聊天明确提供的可视化目录；归档路径只保留副本。不要用符号链接冒充允许的运行文件。
- 本项目桥接器仅在存在相应函数时调用 `window.openai.sendFollowUpMessage({prompt, title})`。
- 状态使用 `widgetState`、`setWidgetState`、`openai:set_globals`。modelContent 只放页面/选择，privateContent 放未发送草稿，快照小于 16 KiB。
- 用户只操作了复选框、或模型收到了界面状态，不代表修改意见已经发送。

## 其他有 HTML/组件预览的宿主

先确认宿主允许脚本执行和用户输入。仅显示 HTML 代码或静态截图不算交互预览。

`portable` 构建带独立样式，无外部资源。若平台仅接受组件或部分 HTML，将预览和反馈区移植到它正式支持的容器，保留交互行为与相同反馈数据。不可粘贴 Codex 专属输出标记并假定其他平台会识别。

没有正式消息接口时使用手动反馈模式；自动保存默认也不假定存在。不要尝试读取登录信息、抓取私有 API 或把意见发到第三方。

### 内部接口

宿主接入者可在片段脚本执行前，显式提供 `window.inlineUiReviewHost`。这是由集成者定义的对象，不是厂商预置全局变量：

```js
window.inlineUiReviewHost = {
  // Optional. Omit when no documented current-chat submission API exists.
  send({ prompt, title }) { return documentedHostSubmission(prompt, title); },
  // All state methods are optional; use the host's documented private storage.
  getState() { return documentedHostState(); },
  saveState(snapshot) { return documentedHostSave(snapshot); },
  subscribe(onState) { return documentedHostSubscribe(onState); }
};
```

上面的 documentedHost* 仅表示需由接入者替换的本地函数名，不是可直接调用的厂商接口。只有查到当前宿主正式接口后才能实现；不要运行未替换示意代码。

`send` 在调用点直接发起请求以保留用户手势。返回值完成不构成送达证明。`getState` 同步返回 `{modelContent, privateContent}` 或 null；`saveState` 可返回 Promise；`subscribe` 可返回取消监听函数。保存不要走消息发送接口。

`review-bridge.js` 的顺序是：显式自定义适配器 → 经检测存在的 OpenAI 宿主函数 → 本地手动反馈。缺少 send 的显式适配器不会意外继承另一个宿主的发送能力。不存在的可选状态方法保持惰性。

## 安装的含义

- 支持 Agent Skills 的智能体：将整个 `inline-ui-review/` 目录放入它文档指定的 Skill 目录，保留相对引用和 assets。
- 只支持自定义指令/知识文件的智能体：提供 SKILL.md 和所选模式的参考文档，告诉它执行这些说明；这不等于注册了原生 Skill。
- 只有图片工具的智能体：读取生图模式，直接使用它已有的生图能力。图片调用参数依工具定义填写。

不需要为每个品牌复制一份核心规则，也不宣称不存在的官方兼容认证。
