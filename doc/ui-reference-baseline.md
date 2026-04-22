# DebugBear 项目 UI 基线（单 Skill 模式）

## 1. 决策结论
- 从现在开始，项目采用单 skill 模式。
- 唯一主 skill：`impeccable-ui-workbench`。
- 唯一主视觉 reference：`.codex/skills/impeccable-ui-workbench/reference/imported/ready-skills/minimalist-ui.md`。

## 2. 使用范围
- 所有页面视觉风格（颜色、字体、圆角、阴影、背景氛围）只允许遵循 `minimalist-ui`。
- 所有 UI 迭代默认在 `impeccable-ui-workbench` 体系内完成。

## 3. 允许使用的同 Skill 辅助 References
- `.codex/skills/impeccable-ui-workbench/reference/layout.md`
- `.codex/skills/impeccable-ui-workbench/reference/typeset.md`
- `.codex/skills/impeccable-ui-workbench/reference/colorize.md`
- `.codex/skills/impeccable-ui-workbench/reference/adapt.md`
- `.codex/skills/impeccable-ui-workbench/reference/polish.md`
- `.codex/skills/impeccable-ui-workbench/reference/harden.md`

说明：以上仅用于优化结构、可读性、适配与上线质量，不得改变 `minimalist-ui` 的主视觉语言。

## 4. 禁止项
- 禁止混用其他 skill 作为风格来源（包括 `ui-ux-pro-max`、`brand-design-systems`）。
- 禁止叠加其他强风格模板（如 `high-end-visual-design`、`gpt-awwwards-taste`、`overdrive`）。
- 禁止并行采用多个主视觉 reference。

## 5. 变更规则
- 若未来要更换风格，只能“整体替换主视觉 reference”，不能增量叠加。
- 每次更换需先更新本文件，再执行页面改造。
