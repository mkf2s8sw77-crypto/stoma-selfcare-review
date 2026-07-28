# 肠造口居家自护 AI 复核助手（stoma-selfcare-review）

面向山西白求恩医院造口专科团队与肠造口术后患者（含主要照护者）的居家自护记录与 AI 复核助手。系统由造口专科护士预先审核并按版本维护居家自护要点；患者或主要照护者按要点提交执行记录；AI 仅做语义比对与依据整理，最终判断由造口专科护士完成。

## 客户与部署

- **客户**：山西白求恩医院
- **部署访问**：`https://sys.huli.sh.cn/stoma-selfcare-review/`
- **base path**：`/stoma-selfcare-review`（`next.config.mjs` 与 `src/lib/path.ts` 中统一注入）
- **本地端口**：`10375`（落在 10000–20000 区间，便于并发调试）
- **运行形态**：单进程 Next.js 15（App Router），数据保存在本机 SQLite，不与任何外部系统对接

## 目录结构

```
.
├── AGENTS.md                       # 项目说明
├── next.config.mjs                 # basePath: /stoma-selfcare-review
├── tailwind.config.ts              # 品牌配色（深绿 + 金色 + 米白）
├── drizzle.config.ts
├── data/                           # SQLite 落盘目录（运行时自动创建）
├── public/logo.png                 # 山西白求恩医院 logo
├── docs/
│   ├── stoma-selfcare-review概要设计2026-07-27.md   # 用户手册
│   └── screenshots/                # 手册引用截图
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

## 快速开始

```bash
npm install                # 安装依赖（已配置 npmmirror 镜像源）
npm run db:reset           # 写演示数据
npm run dev                # 启动 http://127.0.0.1:10375/stoma-selfcare-review/
```

## 用户手册

完整功能说明见 [docs/stoma-selfcare-review概要设计2026-07-27.md](./docs/stoma-selfcare-review概要设计2026-07-27.md)。该手册面向客户讲解功能，不涉及登录、技术栈与实现细节；所有引用截图位于 [docs/screenshots](./docs/screenshots/)。

## 演示账号

系统无登录，两个端在浏览器内通过下拉切换演示身份。

- **护士**：`陈素清` / `李文静`（造口专科护士）
- **患者**：6 名业务化脱敏患者（编号 `SXBH-OS-2025-001` 起），默认展示首位 `马志远 先生`

任一端顶部 / 侧栏均提供「恢复演示数据」按钮，可一键回到初始状态。

## 数据边界

- AI 仅整理患者原话与要点之间的差异，输出 0–100 匹配百分比与四态结论（与要点一致 / 表达模糊需再次确认 / 未明确提及 / 未提及 / 依据不足），并保留原话证据
- 护士三态复核：已确认 / 需随访再次确认 / 暂不适用
- 全部页面固定显示一条中性提示：「本系统仅整理自护记录与复核依据，最终判断由造口专科护士完成」
- 不输出并发症判断，不给处置建议
