# AI Site Factory: 100+ 垂直行业 Agent 站群系统

## 1. 项目概览
**AI Site Factory** 是一个基于“主站 + 子站”架构的自动化 AI 工具部署平台。通过聚合顶级 AI 供应商（SiliconFlow, DeepSeek, 阿里云百炼）的能力，实现低成本、高并发、垂直行业的自动化部署。

- **核心目标**：在 60 天内自动化生成并部署 100 个垂直领域的 AI 站点。
- **商业模式**：统一计费体系（Credits），多赛道矩阵式引流，全自动化运维。

---

## 2. 技术栈与架构设计

### 2.1 核心架构
- **控制中心 (Main Hub)**: 部署于主域名，负责用户认证、积分充值、全局配置、站群监控。
- **功能节点 (Agent Nodes)**: 部署于子域名，通过动态路由模板实现高度参数化，共享主站 Session。
- **API 网关**: 基于 Supabase Edge Functions / Next.js API Routes，实现多模型“赛马”与负载均衡。

### 2.2 技术栈 (Tech Stack)
| 维度 | 技术选型 | 作用 |
| :--- | :--- | :--- |
| **前端** | Next.js 14 (App Router), TailwindCSS, Framer Motion | 高保真 UI、动态路由、流式输出 |
| **后端/数据库** | Supabase (Auth, DB, RLS, Edge Functions) | 核心大脑、计费记录、Session 共享 |
| **自动化部署** | Zeabur API + 阿里云 DNS API | “一键分身”自动化容器部署与域名绑定 |
| **AI 能力层** | SiliconFlow, DeepSeek, 阿里云百炼 | 模型调用（DeepSeek V3, Flux.1, Qwen2-VL 等） |

---

## 3. 10 大赛道与站点矩阵 (100 Nodes Plan)

系统划分为 10 个核心垂直赛道，每个赛道由最适合的 AI 模型驱动：

1. **内容进化 (Text)**: 博客生成、小红书爆款、学术润色。
2. **设计美学 (Vision)**: Logo 设计、照片修复、电商白底图转实景。
3. **程序员工具 (Code)**: 代码审计、SQL 转换、正则表达式生成。
4. **职场效率 (Business)**: 模拟面试、合同分析、会议纪要。
5. **教育学习 (Edu)**: 苏格拉底私教、口语陪练、论文综述。
6. **营销电商 (Marketing)**: SEO 挖掘、Amazon Listing、直播话术。
7. **心理生活 (Lifestyle)**: 心理树洞、穿搭建议、旅行计划。
8. **多媒体 (Multimedia)**: 播客脚本、视频总结、音频降噪。
9. **专业咨询 (Pro)**: 法律助手、财报可视化、体检解读。
10. **游戏娱乐 (Game)**: TRPG 跑团、赛博修仙、虚拟分身。

---

## 4. 数据库建模 (Supabase)

### 核心表结构
- **`users_profile`**: 存储用户全局积分（Credits）和订阅等级。
- **`agents`**: 存储站群配置（子域名、模型 ID、UI 配色、计费权重）。
- **`usage_logs`**: 每一笔 AI 调用的审计日志与计费扣除记录。
- **`prompts`**: 存储行业专属的系统提示词（System Prompt）和示例。

---

## 5. 核心实施流程

### 第一阶段：基础设施自动化
- [x] 主域名管理与解析 API 配置。
- [x] Supabase 核心表结构与 RLS 安全策略设计。
- [x] 环境变量注入（API Keys）。

### 第二阶段：通用 Agent 模板开发
- [x] 高保真 Dark Mode 主控台 UI。
- [x] 支持流式输出（SSE）的通用聊天组件 `AgentChat`。
- [x] 多供应商 AI 路由分发逻辑（`ai-router.ts`）。
- [x] 动态路由页面 `/agent/[subdomain]`。

### 第三阶段：批量部署与扩展 (Next Steps)
- [ ] 编写 Zeabur API 批量部署脚本。
- [ ] 集成 Stripe/支付渠道实现积分购买。
- [ ] 站点 SEO 自动生成引擎（针对 100 个子站）。

---

## 6. 环境要求
- **Node.js**: >= 18
- **Supabase**: 需配置 `URL` 和 `Service Role Key`
- **API Keys**:
  - `SILICONFLOW_API_KEY`
  - `DEEPSEEK_API_KEY`
  - `ALIYUN_BAILIAN_KEY`

---

## 7. 快速启动
1. **安装依赖**: `npm install`
2. **数据库初始化**: 执行 `supabase/migrations/001_initial_schema.sql` 中的 SQL。
3. **启动开发**: `npm run dev`
4. **访问**: `http://localhost:3000` 进入主控中心。

---
**Powered by Antigravity AI Engineering.**
