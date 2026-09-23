# 图表实验室 · Chart Studies

51 个可交互数据组件的参考模板与设计规格：15 种图表、14 种指标组件、22 种筛选 / 页签 / 表格。组件共用深 / 浅两套图表主题和同一层读数浮层，所有读数都从同一份事实数据现算。页面是单个 HTML 文件，无外部依赖，可离线打开。

- **成品**：[`chart-studies.html`](chart-studies.html)，用浏览器直接打开
- **设计规格**：[`视频图表设计蒸馏.md`](视频图表设计蒸馏.md)，与页面逐节对齐（页脚「阅读原始设计蒸馏文档」也指向它）
- **第二阶段准备**：[`docs/phase-2-kickoff.md`](docs/phase-2-kickoff.md)

## 组件

| 分组 | 数量 | 组件 |
|---|---|---|
| 进度与目标 | 3 | 01 活动圆环 · 03 仪表盘 · 07 目标线 |
| 时间与趋势 | 7 | 02 打卡热力格 · 04 柱状图 · 05 专注分段图 · 06 面积图 · 11 折线图 · 12 双柱＋折线组合图 · 13 瀑布图 |
| 组成与分类 | 3 | 08 分段占比条 · 09 环形占比图 · 10 气泡图 |
| 结构与策略 | 2 | 14 四象限图（波士顿矩阵） · 15 树状图 |
| 指标与概览 | 14 | K01 数值卡 · K02 对比卡 · K03 趋势卡 · K04 目标进度卡 · K05 进度环卡 · K06 阈值状态卡 · K08 排行卡 · K09 日 / 月 / 年三联卡 · P01 指标条 · P02 主次面板 · P03 指标页签驱动图表 · P04 宫格看板 · P05 记分卡表格 · P07 转化链 |
| 筛选与查询 | 11 | F01 快捷时间 · F02 日期区间 · F03 单选下拉 · F04 多选下拉 · F05 级联筛选 · F06 维度 chips · F07 已选条件回显 · F08 筛选抽屉 · F09 图表联动 · F10 结果条与空态 · F11 日期面板 |
| 切换与导航 | 6 | T01 下划线页签 · T02 药丸页签 · T05 徽标页签 · T06 页签溢出 · T07 纵向页签 · T08 动态页签 |
| 表格与明细 | 5 | B01 明细表 · B03 交叉表 · B05 分组小计 · B06 可展开行 · B07 对比列组 |

## 目录

```
chart-studies.html        构建产物（与源码一起提交），直接打开即可
视频图表设计蒸馏.md        设计规格：令牌、交互系统、逐个组件、无障碍、扩展约定、修复记录、待办
src/page.html             页面模板：外壳、15 个图表、ChartKit、ChartInspector（读数浮层）、启动代码，含四对注入标记
src/kpi/                  指标模块：kpi.css + kpi1–5.js（KpiKit、DATA、K01–K09、P01–P07）
src/ftt/                  筛选 / 页签 / 表格模块：ftt.css + ftt0–5.js（Hash、AsOf、FilterData、FilterKit、TabKit、TableKit 与 22 个组件）
tools/build.mjs           构建脚本，只依赖 Node
tools/data/               示例数据的生成脚本（留档，构建不运行）
tests/                    Playwright 验收脚本；tests/run.mjs 一键跑全部
docs/proposals/           第一阶段四份组件方案的离线副本（指标、筛选、页签、表格）
docs/phase-2-kickoff.md   第二阶段准备：交付清单、验收基线、技术债、可选方向、待定问题
```

## 构建与验收

需要 Node 18 或更高版本。

```bash
npm run build            # src/ → chart-studies.html
npm run build:artifact   # 另生成 dist/chart-widgets-demo.html（发布到 Claude Artifact 用）
npm run check            # 只核对 chart-studies.html 是否与源码一致

npm install                      # 安装 Playwright（只有测试需要）
npx playwright install chromium  # 新机器上第一次跑测试前执行
npm test                         # 常规验收，约 8 分钟，逐项给出 ✓ / ✗
npm run test:full                # 另跑读数浮层扫动与 6 倍降速开销，约 30 分钟
```

改动流程：改 `src/` → `npm run build` → `npm test` → 同步规格对应小节（修 bug 在第 8 节记一行）→ 把源码和产物一起提交。不要直接改 `chart-studies.html`。

新增或修改组件的约定见规格第 7 节，AI 助手的工作说明见 [`CLAUDE.md`](CLAUDE.md)。

## 阶段

- **第一阶段（2026-09-22 → 09-23，已完成）**：以 15 图表基线（REFERENCE EDITION / 01）为起点，先后完成：深 / 浅图表主题与 102 个语义 token；14 个指标组件；22 个筛选 / 页签 / 表格组件（附页面级截至日与地址状态）；读数浮层跟随与性能、焦点环、Artifact 宿主兼容等修复；最后逐节核对规格与页面。修复记录见规格第 8 节，已拍板的决策见第 9 节「已决」。
- **第二阶段**：见 [`docs/phase-2-kickoff.md`](docs/phase-2-kickoff.md)。

在线版发布在 Claude Artifact：<https://claude.ai/artifact/Wq1FezNUc9hMVe5pHCVk16>（仅作者可见，分享需在 Artifact 页面设置）。
