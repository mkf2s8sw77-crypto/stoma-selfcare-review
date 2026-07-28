# 山西白求恩医院陈素清 · 肠造口居家自护 AI 复核助手（stoma-selfcare-review）

本目录是面向山西白求恩医院造口专科团队与肠造口术后患者（含主要照护者）的居家自护记录与 AI 复核助手的全部实现代码。系统由造口专科护士预先审核并按版本维护居家自护要点；患者或照护者按要点提交执行记录；AI 仅做语义比对与依据整理，最终判断由造口专科护士完成。

## 1. 目录结构

```
stoma-selfcare-review/
├── AGENTS.md                       # 本文件（项目说明）
├── package.json
├── next.config.mjs                 # basePath: /stoma-selfcare-review
├── tailwind.config.ts              # 品牌配色（深绿 + 金色 + 米白）
├── drizzle.config.ts
├── data/                           # SQLite 落盘目录（运行时自动创建）
├── public/logo.png                 # 山西白求恩医院 logo
├── docs/
│   ├── stoma-selfcare-review概要设计2026-07-27.md   # 用户手册
│   └── screenshots/                # 手册引用截图（PC 1280×800 / iPhone）
└── src/
    ├── app/
    │   ├── page.tsx                # 双入口首页
    │   ├── m/                      # 患者端（移动优先，底部 5 Tab）
    │   ├── admin/                  # 管理端（PC 优先，侧边栏导航）
    │   └── api/                    # 后端 API
    ├── components/                 # 移动端、管理端、UI 通用组件
    ├── db/                         # Drizzle schema、连接、种子
    └── lib/                        # 路径、AI 复核、要点、服务器工具
```

## 2. 端口与 base path

- **运行端口**：`10375`（10000–20000 区间随机所得，确认空闲）
- **部署访问**：`https://sys.huli.sh.cn/stoma-selfcare-review/`
- **base path**：`/stoma-selfcare-review`（在 `next.config.mjs` 与 `src/lib/path.ts` 中统一注入）
- **本机启动**：`cd stoma-selfcare-review && npm run dev`
- **首次运行**：`npm install` → `npm run db:reset`（写演示数据）→ `npm run dev`

## 3. 品牌与视觉规范

- **客户**：山西白求恩医院
- **Logo**：`public/logo.png`（来源：客户指定 URL，959×639 圆形徽章，深绿环形 + 金色冠形 + 白色"山西白求恩医院 / SHANXI BETHUNE HOSPITAL"）
- **主色**：`#1E4B2C`（深绿，与 Logo 环形一致）
- **次色**：`#173E24`（hover 用深绿）
- **点缀**：`#CEB268`（金色，对应 Logo 中冠形与"1959"字样）
- **底色**：`#F6F7F4`（米白）；卡片背景白色
- **辅助**：成功 `#2F8F5D` / 警告 `#D2913A` / 危险 `#C84A3A`
- **图标**：`lucide-react`（npm 离线可用，不依赖在线图床、不使用 emoji）
- **字体**：系统字体栈（PingFang SC / Hiragino Sans GB / Microsoft YaHei），无网络字体依赖
- **Logo 容器**：因 Logo 本身是白底圆徽章，页面统一以"白色品牌容器 + 圆徽章 + 院名"组合展示，避免在深绿背景上出现突兀白方块

## 4. 8 项护理要点（演示版，待医院正式审核）

| 编号 | 标题 | 类型 |
| --- | --- | --- |
| P1 | 准备与洗手 | 必做 |
| P2 | 造口周围皮肤清洁 | 必做 |
| P3 | 造口与底盘尺寸评估 | 必做 |
| P4 | 旧底盘移除与底盘更换 | 必做 |
| P5 | 排泄物观察 | 必做 |
| P6 | 皮肤与并发症观察 | 必做 |
| P7 | 用物与废弃物处理 | 建议 |
| P8 | 求助与随访安排 | 必做 |

## 5. 演示账号

- **护士（无登录）**：在管理端侧栏切换 `陈素清` / `李文静` 两名造口专科护士，影响复核记录中的「复核人」字段
- **患者（无登录）**：在患者端顶部下拉切换 6 名业务化脱敏患者，默认取首位 `马志远 先生`

## 6. 演示数据规模（`src/db/seed.ts`）

- 6 名业务化脱敏患者（编号 `SXBH-OS-2025-001` 起，覆盖 30–70+ 各年龄段与回/乙状/横结肠造口）
- 2 名造口专科护士 + 1 条演示免责声明
- 3 个要点版本：`v1.0`（历史 6 项）、`v2.0`（当前激活 8 项）、`v3.0-草稿`（未启用 9 项）
- 约 70 条自护记录与 500+ 条记录项；状态分布含「已确认」「需随访」「待复核」「暂不适用」
- 审计日志若干条，含版本发布、记录提交、复核动作、CSV 导出

## 7. 核心模块速查

- **AI 复核**：`src/lib/review.ts` 关键词 + 词拆分 + 字符 n-gram 加权匹配
- **后端 API**：`src/app/api/*` 共 15 个路由（landing、patients、records、points、reviews、analytics、knowledge、export.csv、reset-demo 等）
- **护理要点定义**：`src/lib/points.ts`（演示版 3 个版本）
- **路径注入**：`src/lib/path.ts` 的 `bp()` 与 `apiUrl()` 工具
- **种子与重置**：`src/db/seed.ts` + `src/db/seed-points.ts`

## 8. 重新生成数据

```bash
cd stoma-selfcare-review
npm run db:reset   # 清空 + 建表 + 写种子
```

页面右上/顶部提供「恢复演示数据」按钮，可在客户演示时反复回到初始状态。

## 9. 用户手册

`docs/stoma-selfcare-review概要设计2026-07-27.md`，引用 `docs/screenshots/` 中的截图（路径使用 `./screenshots/xxx.png`）。手册面向客户讲解功能，不写登录、技术栈，使用全角标点。
