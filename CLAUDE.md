# CLAUDE.md：给在本仓库工作的 AI 助手

和用户讨论一律用中文。项目概况见 `README.md`，完整规格见 `视频图表设计蒸馏.md`（下文简称「规格」）。

## 必须遵守

1. **不要直接改 `chart-studies.html`**。它是 `npm run build` 的产物：改 `src/`，构建，再把源码和产物一起提交。`npm run check` 会核对两者是否一致。
2. **页面与规格同步**。行为、数值、文案、token 改了，就改规格的对应小节；修 bug 在规格第 8 节记一行（位置 · 问题 · 修复）；拍板的决策记进第 9 节「已决」。规格写的是现状，不写「以前…现在…」。
3. **改完跑 `npm test`**，全部 ✓ 才算完成。动了读数浮层（`ChartInspector`）或图表的悬停逻辑，另跑 `npm run test:full`。
4. **页面保持单文件、离线可开**：不引外部字体、脚本、图片，不加运行时依赖。
5. **宿主受限也要能跑**（Artifact 查看器、预览框）：不调用 `console.assert` 等非标准 console 方法，数据自检用模块内的 `check(ok, msg)`；新模块整体包 `try / catch`；`localStorage`、`history` 调用包 `try / catch`。

## 源码结构

| 位置 | 内容 |
|---|---|
| `src/page.html` | 页面模板：`<head>` 与首帧主题 / 输入方式脚本、页面外壳与文案、`ChartKit`、15 个图表（`ChartDemos.<id>`）、`ChartInspector`（读数浮层）、启动代码（`demos` 登记数组、`DIVIDERS`、分类筛选、重播、`IntersectionObserver`）。四对注入标记：`/* KPI:BEGIN */`、`/* FTT:BEGIN */`（CSS）与 `/* KPI-JS:BEGIN */`、`/* FTT-JS:BEGIN */`（JS），标记之间留空，构建时填入 |
| `src/kpi/` | 指标模块，按顺序拼接 `kpi1–5.js`：`KpiKit`（`fmt / change / pace / band / spark / count …`）、`DATA` 事实与派生值、K01–K09、P01–P07；样式在 `kpi.css` |
| `src/ftt/` | 筛选 / 页签 / 表格模块，按顺序拼接 `ftt0–5.js`：`Hash`（地址状态）、`AsOf`（截至日）、`FilterData`（事实立方体与查询）、`FilterKit / TabKit / TableKit`，以及 F01–F11、T01 / T02 / T05–T08、B01 / B03 / B05–B07；样式在 `ftt.css`。`Hash`、`AsOf`、`say`、`touched`、`lookups` 与 `FK / TK / TBK` 只在模块内可见 |
| `tools/build.mjs` | 拼接两个模块 → 用 `vm.Script` 做语法检查 → 注入模板 → 再检查整页每段 `<script>` → 写 `chart-studies.html`；CRLF 一律转成 LF |
| `tests/` | Playwright 脚本（见下）；`tests/lib.mjs` 提供页面路径与 `file://` 地址 |

## 关键约定（细则见规格第 3 节与第 7 节）

- 组件签名 `ChartDemos.<id> = (root, C) => { …; return { reset }; }`，必须给 `root.inspector`，没有读数也要给 `{targets: []}`。在 `src/page.html` 底部的 `demos` 数组登记，并同步分组计数、引言统计与 `collection-count`（规格 7 · 5、7 · 10）。
- **每卡一条播报通道**：读数层在每张卡里建一个 `role=status` 播报区，并把卡内其它 `aria-live` 静音。要播报就写这个区（FTT 模块里用 `say(root, msg)`），不要自建 live 区域。
- **焦点环只给键盘**：`<html data-input>` 记录最后一次输入方式，指针操作后不画环。不要写只靠 `:focus` 的样式；用 JS 画焦点标记时同时判断 `data-input !== 'pointer'`。
- **读数浮层的开销**：`probe.hover(i)` 只移动标记（导引线、空心点），不重新量尺寸、不重画整图；`read()` 里格式化用缓存的 `Intl.NumberFormat`（`KpiKit.nf`）；同一点上的重复移动什么都不写。
- **筛选 / 页签的状态**：写进 `#!` 地址，默认状态不写，多选按固定顺序编码；构造时读到地址状态就调 `touched(root)`；订阅 `AsOf.on(render)`；日期上限写成函数 `max: () => AsOf.key()`。逐日读数用模块内的 `dayAt / spanAt`，不要用不看截至日的 `FilterData.span`。
- **数据**：只写事实，派生值一律现算；表格合计交给 `TableKit` 的 `sum:true`（最大余数分摊），不要手算。

## 测试

| 命令 | 检查什么 | 时长 |
|---|---|---|
| `npm run check` | 产物与源码一致 | 秒级 |
| `npm test` | 上一项 + 筛选 / 页签 / 表格 98 项与指标组件 50 项交互断言（深、浅两套主题）+ 三档视口无溢出且控制台 0 报错 + 键盘焦点环 + 「console 没有 assert」模拟 + 收尾修复回归 26 项 + 读数浮层移开 / 触屏检查 | 约 8 分钟 |
| `npm run test:full` | 另跑读数浮层扫动（51 张卡，面板始终跟到指针）与 6 倍降速下每次移动的开销 | 约 30 分钟 |

每个脚本都能单独跑，例如 `node tests/fint.mjs chart-studies.html light`、`node tests/readout/lag.mjs chart-studies.html kpi_tabs,combo 6`。截图输出到 `tests/out/`（不提交）。脚本靠固定等待时间，机器很慢时个别断言可能要放宽等待。

## 发布到 Claude Artifact

`npm run build:artifact` 生成 `dist/chart-widgets-demo.html`。发布时把 `视频图表设计蒸馏.md` 作为同目录附件一起传上去，页脚链接指向它。现有地址：<https://claude.ai/artifact/Wq1FezNUc9hMVe5pHCVk16>，更新时沿用这个地址。
