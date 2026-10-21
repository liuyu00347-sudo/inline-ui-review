# Inline UI Review · 对话内 UI 交互审阅

在聊天里看 UI、体验交互、提出修改意见，再继续改下一版。支持按能力适配的智能体工作流，无须搭建单独的意见平台。

**生图能力可以完成视觉审阅；可点击界面需要 HTML/组件运行能力；按钮直接回传意见还需要宿主消息接口。** 本 Skill 不会给平台新增不存在的能力，也不把图片中的输入框伪装成真实输入框。

## 三种运行方式

| 宿主能力 | 输出 | 如何反馈 |
| --- | --- | --- |
| 对话内运行界面＋正式消息接口 | 可操作原型 | 界面下方填写意见，点击发送到当前聊天 |
| 对话内运行界面，无消息接口 | 可操作原型 | 界面下方填写，整理并复制意见回聊天 |
| 生图/图像编辑＋聊天 | 静态 UI 效果图 | 宿主真实表单或当前聊天输入框 |

以能力为依据，适用于支持这些能力的不同智能体。不是所有客户端或品牌均已实测，具体接口以所在环境的正式文档为准。

项目仓库：https://github.com/liuyu00347-sudo/inline-ui-review

## 安装与调用

支持 Agent Skills 的环境：下载仓库，将整个目录命名为 `inline-ui-review`，放到该智能体文档指定的 Skill 目录。保留 `SKILL.md`、`references/`、`assets/` 和 `scripts/` 的相对位置。Codex 的个人安装目录通常是 `~/.codex/skills/inline-ui-review`；其他智能体使用各自的文档位置。

只有自定义指令/知识文件能力的环境：提供 `SKILL.md` 和所选模式参考文档，让智能体按其执行。这属于指令适配，不代表原生 Skill 已注册。

可以这样请求：

> 使用 inline-ui-review 做这个小程序的 UI。能运行交互时提供可操作原型和下方意见框；只有生图时生成效果图，并在当前聊天中收集修改意见。

已有 Codex 快捷调用：`$inline-ui-review`。

## 文件与接入

- `SKILL.md`：核心能力选择与审阅流程。
- `references/host-adapters.md`：原生宿主和通用适配器接口。
- `references/image-review.md`：生图、编辑、上下文保留与反馈流程。
- `assets/inline-review.html`：可移植的清单演示模板；需通过构建器注入桥接器。
- `assets/review-bridge.js`：当前聊天的消息/状态适配层，缺少接口时手动反馈。
- `scripts/build_preview.py`：只用 Python 标准库，生成片段或独立 HTML。

```sh
python3 scripts/build_preview.py --mode portable --out ./work/preview.html
python3 scripts/build_preview.py --mode codex --out ./work/fragment.html
node --test tests/bridge.test.cjs
```

生成文件不包含本机个人路径；默认用文件名标识本轮源文件，可用 `--artifact-id` 指定宿主制品 ID。Codex 的内嵌文件仍须放在该聊天明确允许读取的位置；普通归档目录不保证可读。不要将本示例的配色、行业或页面数量当作所有设计的要求。

本项目内部的 `window.inlineUiReviewHost` 允许集成者包装正式宿主接口，不是厂商预置 API。没有接口时不能凭名字猜测，也不会自动连到外部反馈服务。

## 验证范围

2.0.0 已通过 6 项桥接器单元检查、7 组 Codex 包装器浏览器回归，以及手动反馈与自定义适配器两种独立浏览器检查；两种构建模式均已验证。静态图片模式提供生图及修订指引，不声称已在每个图像模型上验证。本轮没有进行各厂商真实客户端的发送验收。真实聊天送达必须由宿主收到新消息确认；按钮调用完成不能替代这个证据。

意见不会自动发送，只有用户点击才触发。未发送草稿按宿主能力保留；不存在私有状态接口时仅保留在当前界面。示例不访问生产业务接口、不收集凭据、不设置外部提交地址。

## English

A portable agent skill for reviewing UI inside a conversation. It selects one of three honest capability tiers: interactive UI with current-chat submission, interactive UI with copyable feedback, or generated UI images with chat feedback. Image generation alone does not make pixels clickable. Read `SKILL.md`, preserve the supporting folders, and use your host's documented preview and submission APIs. The bundled adapter supports explicit host integration and an OpenAI-compatible bridge when those functions actually exist; otherwise it falls back to manual feedback.

MIT License. Version 2.0.0.
