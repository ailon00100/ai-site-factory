import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误: 请在 .env.local 中配置 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 100 个垂直细分领域的站群配置矩阵
const ALL_100_AGENTS = [
  // ================= 1. 文本内容矩阵 (Text) =================
  { subdomain: 'blog', name: 'AI 深度博客', description: '自动生成 SEO 优化的 3000 字长文', category: 'text', icon: '📝', model: 'deepseek-ai/DeepSeek-V3', color: '#6366f1' },
  { subdomain: 'xhs', name: '小红书爆款机', description: '生成带 Emoji 的爆款种草文案', category: 'text', icon: '📕', model: 'deepseek-ai/DeepSeek-V3', color: '#ff4d4f' },
  { subdomain: 'novel', name: '网文小说大纲', description: '生成黄金前三章及百万字大纲', category: 'text', icon: '📖', model: 'deepseek-ai/DeepSeek-V3', color: '#8b5cf6' },
  { subdomain: 'copy', name: '全能文案洗稿', description: '保持原意，重写高质量长短文案', category: 'text', icon: '✍️', model: 'deepseek-ai/DeepSeek-V3', color: '#10b981' },
  { subdomain: 'pr', name: '公关新闻稿', description: '一键生成符合媒体格式的 PR 稿件', category: 'text', icon: '📰', model: 'deepseek-ai/DeepSeek-V3', color: '#3b82f6' },
  { subdomain: 'speech', name: '演讲稿撰写', description: '根据时长和主题定制演讲/发言稿', category: 'text', icon: '🎤', model: 'deepseek-ai/DeepSeek-V3', color: '#f59e0b' },
  { subdomain: 'poem', name: 'AI 藏头诗', description: '输入名字生成优美古典诗词', category: 'text', icon: '📜', model: 'deepseek-ai/DeepSeek-V3', color: '#14b8a6' },
  { subdomain: 'email-reply', name: '高情商邮件回复', description: '丢入老板邮件，生成完美回复语', category: 'text', icon: '✉️', model: 'deepseek-ai/DeepSeek-V3', color: '#0ea5e9' },
  { subdomain: 'diary', name: '手帐日记润色', description: '把流水账日记润色成文艺散文', category: 'text', icon: '📓', model: 'deepseek-ai/DeepSeek-V3', color: '#f43f5e' },
  { subdomain: 'prompt-gen', name: '提示词工程师', description: '输入需求，生成各类 AI 顶级提示词', category: 'text', icon: '🧠', model: 'deepseek-ai/DeepSeek-V3', color: '#8b5cf6' },

  // ================= 2. 视觉设计矩阵 (Vision) =================
  { subdomain: 'logo', name: 'AI Logo 设计站', description: '输入品牌名生成矢量灵感', category: 'vision', icon: '🎨', model: 'black-forest-labs/FLUX.1-schnell', color: '#ec4899' },
  { subdomain: 'fix', name: '老照片修复站', description: '视觉模型修复模糊图片并上色', category: 'vision', icon: '🖼️', model: 'Qwen/Qwen2-VL-72B-Instruct', color: '#10b981' },
  { subdomain: 'avatar', name: '动漫头像生成', description: '上传照片转日系/美漫风格头像', category: 'vision', icon: '🧑‍🎨', model: 'black-forest-labs/FLUX.1-schnell', color: '#8b5cf6' },
  { subdomain: 'interior', name: '室内装修设计', description: '毛坯房照片生成精装效果图', category: 'vision', icon: '🏠', model: 'Qwen/Qwen2-VL-72B-Instruct', color: '#f59e0b' },
  { subdomain: 'tattoo', name: '纹身图腾设计', description: '输入风格和理念生成纹身手稿', category: 'vision', icon: '🐉', model: 'black-forest-labs/FLUX.1-schnell', color: '#14b8a6' },
  { subdomain: 'ui-mockup', name: 'UI 界面生成', description: '文字描述生成 App 界面线框图', category: 'vision', icon: '📱', model: 'Qwen/Qwen2-VL-72B-Instruct', color: '#3b82f6' },
  { subdomain: 'poster', name: '海报排版创意', description: '输入文案生成电影/节日海报灵感', category: 'vision', icon: '📌', model: 'black-forest-labs/FLUX.1-schnell', color: '#f43f5e' },
  { subdomain: 'shoe', name: '潮鞋外观设计', description: '设计你的专属概念球鞋', category: 'vision', icon: '👟', model: 'black-forest-labs/FLUX.1-schnell', color: '#fbbf24' },
  { subdomain: 'packaging', name: '产品包装设计', description: '快消品/礼盒外包装视觉设计', category: 'vision', icon: '📦', model: 'Qwen/Qwen2-VL-72B-Instruct', color: '#2dd4bf' },
  { subdomain: 'comic', name: '漫画分镜脚本', description: '输入故事生成漫画分镜画面描述', category: 'vision', icon: '🗯️', model: 'deepseek-ai/DeepSeek-V3', color: '#6366f1' },

  // ================= 3. 程序员代码矩阵 (Code) =================
  { subdomain: 'audit', name: '代码审计站', description: '上传代码，查找漏洞并修复', category: 'code', icon: '💻', model: 'deepseek-ai/DeepSeek-V3', color: '#0ea5e9' },
  { subdomain: 'sql', name: 'SQL 转换器', description: '自然语言转复杂 SQL 语句', category: 'code', icon: '📊', model: 'deepseek-ai/DeepSeek-V3', color: '#3b82f6' },
  { subdomain: 'regex', name: '正则大师', description: '用人话写出精准正则表达式', category: 'code', icon: '🔍', model: 'deepseek-ai/DeepSeek-V3', color: '#10b981' },
  { subdomain: 'explain', name: '屎山代码解释', description: '把复杂的无注释代码解释成人话', category: 'code', icon: '🧐', model: 'deepseek-ai/DeepSeek-V3', color: '#8b5cf6' },
  { subdomain: 'shell', name: 'Shell 脚本写手', description: '生成自动化运维/部署脚本', category: 'code', icon: '🐧', model: 'deepseek-ai/DeepSeek-V3', color: '#f43f5e' },
  { subdomain: 'css', name: 'Tailwind 生成', description: '描述样式，直接生成 Tailwind 类名', category: 'code', icon: '💅', model: 'deepseek-ai/DeepSeek-V3', color: '#14b8a6' },
  { subdomain: 'leetcode', name: '算法题解通', description: 'LeetCode 题目全语言最优解法', category: 'code', icon: '🧩', model: 'deepseek-ai/DeepSeek-V3', color: '#f59e0b' },
  { subdomain: 'git', name: 'Git 救火队长', description: '解决各种代码冲突和误删撤销', category: 'code', icon: '🔥', model: 'deepseek-ai/DeepSeek-V3', color: '#ef4444' },
  { subdomain: 'docker', name: 'Dockerfile 生成', description: '一键生成项目容器化配置', category: 'code', icon: '🐳', model: 'deepseek-ai/DeepSeek-V3', color: '#3b82f6' },
  { subdomain: 'api-doc', name: '接口文档生成', description: '从代码库或 JSON 生成标准 API 文档', category: 'code', icon: '📄', model: 'deepseek-ai/DeepSeek-V3', color: '#6366f1' },

  // ================= 4. 商业职场矩阵 (Business) =================
  { subdomain: 'interview', name: '模拟面试官', description: '针对特定岗位进行文字/语音对练', category: 'business', icon: '🤝', model: 'deepseek-ai/DeepSeek-V3', color: '#f59e0b' },
  { subdomain: 'contract', name: '合同风险分析', description: '标记合同中的“霸王条款”', category: 'business', icon: '⚖️', model: 'Qwen/Qwen2-VL-72B-Instruct', color: '#ef4444' },
  { subdomain: 'ppt', name: 'PPT 架构师', description: '生成各类汇报演讲的 PPT 逻辑大纲', category: 'business', icon: '📊', model: 'deepseek-ai/DeepSeek-V3', color: '#3b82f6' },
  { subdomain: 'bp', name: '商业计划书', description: '一键生成融资 BP 核心商业模式', category: 'business', icon: '💡', model: 'deepseek-ai/DeepSeek-V3', color: '#8b5cf6' },
  { subdomain: 'okr', name: 'OKR 制定器', description: '帮你写出老板满意的目标与关键结果', category: 'business', icon: '🎯', model: 'deepseek-ai/DeepSeek-V3', color: '#10b981' },
  { subdomain: 'excel', name: 'Excel 函数大拿', description: '自然语言生成复杂表格嵌套函数', category: 'business', icon: '📗', model: 'deepseek-ai/DeepSeek-V3', color: '#14b8a6' },
  { subdomain: 'report', name: '周报生成器', description: '输入碎碎念，输出高大上周报', category: 'business', icon: '📅', model: 'deepseek-ai/DeepSeek-V3', color: '#6366f1' },
  { subdomain: 'meeting', name: '会议纪要总结', description: '上传速记，提炼核心结论与代办', category: 'business', icon: '📝', model: 'deepseek-ai/DeepSeek-V3', color: '#f43f5e' },
  { subdomain: 'swot', name: 'SWOT 分析师', description: '任何产品/个人的全面态势分析', category: 'business', icon: '⚔️', model: 'deepseek-ai/DeepSeek-V3', color: '#fbbf24' },
  { subdomain: 'translate-pro', name: '商务翻译官', description: '地道准确的商务信函多语言互译', category: 'business', icon: '🌐', model: 'deepseek-ai/DeepSeek-V3', color: '#0ea5e9' },

  // ================= 5. 教育学习矩阵 (Edu) =================
  { subdomain: 'tutor', name: '苏格拉底私教', description: '通过提问引导学生思考', category: 'edu', icon: '🎓', model: 'deepseek-ai/DeepSeek-V3', color: '#8b5cf6' },
  { subdomain: 'ielts', name: '雅思作文批改', description: '按官方标准评分并给改进建议', category: 'edu', icon: '✍️', model: 'deepseek-ai/DeepSeek-V3', color: '#f43f5e' },
  { subdomain: 'math', name: '高数解题步骤', description: '详细拆解微积分与线性代数步骤', category: 'edu', icon: '📐', model: 'deepseek-ai/DeepSeek-V3', color: '#3b82f6' },
  { subdomain: 'flashcard', name: '记忆卡片生成', description: '长文转 Anki 抽认卡导入格式', category: 'edu', icon: '📇', model: 'deepseek-ai/DeepSeek-V3', color: '#10b981' },
  { subdomain: 'paper', name: '论文大纲生成', description: '生成符合学术规范的毕业论文大纲', category: 'edu', icon: '📚', model: 'deepseek-ai/DeepSeek-V3', color: '#6366f1' },
  { subdomain: 'history', name: '历史人物聊天', description: '和秦始皇、拿破仑等历史人物对话', category: 'edu', icon: '🏛️', model: 'deepseek-ai/DeepSeek-V3', color: '#f59e0b' },
  { subdomain: 'grammar', name: '外语语法纠错', description: '解释外语语法错误原因及正确用法', category: 'edu', icon: '✅', model: 'deepseek-ai/DeepSeek-V3', color: '#14b8a6' },
  { subdomain: 'kid-story', name: '睡前故事机', description: '定制有教育意义的儿童睡前故事', category: 'edu', icon: '🧸', model: 'deepseek-ai/DeepSeek-V3', color: '#ec4899' },
  { subdomain: 'quiz', name: '考点测验生成', description: '上传讲义，生成十道选择题测验', category: 'edu', icon: '❓', model: 'deepseek-ai/DeepSeek-V3', color: '#fbbf24' },
  { subdomain: 'code-tutor', name: '少儿编程助教', description: '用比喻讲解 Scratch/Python 概念', category: 'edu', icon: '👶', model: 'deepseek-ai/DeepSeek-V3', color: '#0ea5e9' },

  // ================= 6. 营销电商矩阵 (Marketing) =================
  { subdomain: 'seo', name: 'SEO 关键词挖掘', description: '生成高流量、低竞争关键词', category: 'marketing', icon: '📈', model: 'deepseek-ai/DeepSeek-V3', color: '#14b8a6' },
  { subdomain: 'listing', name: '亚马逊 Listing', description: '优化海外市场语境的产品描述', category: 'marketing', icon: '🛒', model: 'deepseek-ai/DeepSeek-V3', color: '#f97316' },
  { subdomain: 'slogan', name: 'Slogan 生成器', description: '想一句能洗脑循环的品牌广告语', category: 'marketing', icon: '📣', model: 'deepseek-ai/DeepSeek-V3', color: '#ef4444' },
  { subdomain: 'ad-copy', name: '信息流广告', description: '头条/广点通高转化信息流文案', category: 'marketing', icon: '💰', model: 'deepseek-ai/DeepSeek-V3', color: '#f59e0b' },
  { subdomain: 'review', name: '假装买家秀', description: '生成逼真的多角度商品评价', category: 'marketing', icon: '⭐', model: 'deepseek-ai/DeepSeek-V3', color: '#8b5cf6' },
  { subdomain: 'tiktok', name: '短视频带货脚本', description: '前三秒抓人眼球的带货脚本', category: 'marketing', icon: '📱', model: 'deepseek-ai/DeepSeek-V3', color: '#ec4899' },
  { subdomain: 'edm', name: 'EDM 邮件营销', description: '提高打开率的转化型群发邮件', category: 'marketing', icon: '📫', model: 'deepseek-ai/DeepSeek-V3', color: '#3b82f6' },
  { subdomain: 'buyer-persona', name: '用户画像分析', description: '产品目标客群深度画像推演', category: 'marketing', icon: '👥', model: 'deepseek-ai/DeepSeek-V3', color: '#6366f1' },
  { subdomain: 'sales-pitch', name: '电销话术', description: '应对客户挂断和拒绝的破冰话术', category: 'marketing', icon: '📞', model: 'deepseek-ai/DeepSeek-V3', color: '#10b981' },
  { subdomain: 'brand-name', name: '品牌取名机', description: '结合易经/现代潮流的品牌起名', category: 'marketing', icon: '✨', model: 'deepseek-ai/DeepSeek-V3', color: '#f43f5e' },

  // ================= 7. 心理与生活矩阵 (Lifestyle) =================
  { subdomain: 'cbt', name: 'AI 心理树洞', description: '基于 CBT 疗法的情绪疏导', category: 'lifestyle', icon: '🌿', model: 'deepseek-ai/DeepSeek-V3', color: '#fbbf24' },
  { subdomain: 'travel', name: '旅行计划师', description: '生成保姆级避人流旅行攻略', category: 'lifestyle', icon: '✈️', model: 'deepseek-ai/DeepSeek-V3', color: '#2dd4bf' },
  { subdomain: 'recipe', name: '剩菜食谱大师', description: '输入冰箱剩菜，输出米其林菜谱', category: 'lifestyle', icon: '🍳', model: 'deepseek-ai/DeepSeek-V3', color: '#f97316' },
  { subdomain: 'fitness', name: '健身编排', description: '无器械/健身房私人训练计划表', category: 'lifestyle', icon: '🏋️', model: 'deepseek-ai/DeepSeek-V3', color: '#3b82f6' },
  { subdomain: 'dream', name: '赛博解梦', description: '结合弗洛伊德与周公解梦解析梦境', category: 'lifestyle', icon: '🌙', model: 'deepseek-ai/DeepSeek-V3', color: '#8b5cf6' },
  { subdomain: 'tarot', name: '塔罗占卜师', description: '在线抽牌解析近期事业爱情运势', category: 'lifestyle', icon: '🔮', model: 'deepseek-ai/DeepSeek-V3', color: '#ec4899' },
  { subdomain: 'pet', name: '宠物翻译官', description: '解答猫狗异常行为与喂养建议', category: 'lifestyle', icon: '🐶', model: 'deepseek-ai/DeepSeek-V3', color: '#10b981' },
  { subdomain: 'outfit', name: '穿搭灵感', description: '根据天气和场合提供男/女穿搭方案', category: 'lifestyle', icon: '👗', model: 'deepseek-ai/DeepSeek-V3', color: '#f43f5e' },
  { subdomain: 'gift', name: '送礼参谋', description: '解决直男/选择困难症的送礼难题', category: 'lifestyle', icon: '🎁', model: 'deepseek-ai/DeepSeek-V3', color: '#f59e0b' },
  { subdomain: 'movie-rec', name: '周末影单', description: '根据极其偏门的情绪推荐冷门好片', category: 'lifestyle', icon: '🍿', model: 'deepseek-ai/DeepSeek-V3', color: '#6366f1' },

  // ================= 8. 影音多媒体矩阵 (Multimedia) =================
  { subdomain: 'pod', name: '播客脚本助手', description: '长文转对谈式播客脚本', category: 'multimedia', icon: '🎙️', model: 'deepseek-ai/DeepSeek-V3', color: '#f43f5e' },
  { subdomain: 'vsum', name: '视频总结器', description: '输入链接总结视频干货内容', category: 'multimedia', icon: '📺', model: 'deepseek-ai/DeepSeek-V3', color: '#ef4444' },
  { subdomain: 'lyrics', name: 'AI 填词人', description: '输入情感故事生成押韵流行歌词', category: 'multimedia', icon: '🎵', model: 'deepseek-ai/DeepSeek-V3', color: '#8b5cf6' },
  { subdomain: 'prompt-mj', name: 'Midjourney 咒语', description: '中文描述转极品画质英文咒语', category: 'multimedia', icon: '🖌️', model: 'deepseek-ai/DeepSeek-V3', color: '#ec4899' },
  { subdomain: 'vlog', name: 'Vlog 分镜', description: '一人团队旅行/探店视频拍摄分镜', category: 'multimedia', icon: '📹', model: 'deepseek-ai/DeepSeek-V3', color: '#3b82f6' },
  { subdomain: 'title', name: 'B站封面标题', description: '生成网感极强的高点击视频标题', category: 'multimedia', icon: '📺', model: 'deepseek-ai/DeepSeek-V3', color: '#f97316' },
  { subdomain: 'subs', name: '字幕时间轴修正', description: '智能整理错乱的 SRT 格式和错别字', category: 'multimedia', icon: '📑', model: 'deepseek-ai/DeepSeek-V3', color: '#10b981' },
  { subdomain: 'review-film', name: '毒舌影评', description: '一键生成引战/深刻的豆瓣长影评', category: 'multimedia', icon: '🎬', model: 'deepseek-ai/DeepSeek-V3', color: '#6366f1' },
  { subdomain: 'music-theory', name: '乐理答疑', description: '解释和弦走向与作曲基础知识', category: 'multimedia', icon: '🎹', model: 'deepseek-ai/DeepSeek-V3', color: '#fbbf24' },
  { subdomain: 'stream', name: '直播互动话术', description: '主播冷场急救与弹幕互动金句', category: 'multimedia', icon: '🕹️', model: 'deepseek-ai/DeepSeek-V3', color: '#14b8a6' },

  // ================= 9. 专业咨询矩阵 (Pro) =================
  { subdomain: 'law', name: '法律咨询助手', description: '劳动法、婚姻法初步建议', category: 'pro', icon: '⚖️', model: 'deepseek-ai/DeepSeek-V3', color: '#1e293b' },
  { subdomain: 'tax', name: '税务计算器', description: '跨国身份最优纳税方案计算', category: 'pro', icon: '💰', model: 'deepseek-ai/DeepSeek-V3', color: '#475569' },
  { subdomain: 'med-info', name: '体检报告解读', description: '把晦涩的医学指标翻译成大白话', category: 'pro', icon: '🏥', model: 'deepseek-ai/DeepSeek-V3', color: '#0ea5e9' },
  { subdomain: 'patent', name: '专利文书润色', description: '提取技术交底书的核心权利要求', category: 'pro', icon: '📜', model: 'deepseek-ai/DeepSeek-V3', color: '#8b5cf6' },
  { subdomain: 'visa', name: '签证拒签分析', description: '分析美签/申根拒签信并提供对策', category: 'pro', icon: '🛂', model: 'deepseek-ai/DeepSeek-V3', color: '#f59e0b' },
  { subdomain: 'finance', name: '财报提炼', description: '上市企业财报数据深度总结', category: 'pro', icon: '📈', model: 'deepseek-ai/DeepSeek-V3', color: '#10b981' },
  { subdomain: 'bidding', name: '招投标文件', description: '生成废话连篇但格式完美的标书', category: 'pro', icon: '📁', model: 'deepseek-ai/DeepSeek-V3', color: '#f43f5e' },
  { subdomain: 'insurance', name: '保险避坑', description: '重疾险/寿险条款陷阱扫描', category: 'pro', icon: '🛡️', model: 'deepseek-ai/DeepSeek-V3', color: '#3b82f6' },
  { subdomain: 'hr-labor', name: '劳动仲裁指导', description: '离职补偿计算与维权证据收集指导', category: 'pro', icon: '🔨', model: 'deepseek-ai/DeepSeek-V3', color: '#ef4444' },
  { subdomain: 'export', name: '外贸关税', description: '进出口 HS 编码与合规基础咨询', category: 'pro', icon: '🚢', model: 'deepseek-ai/DeepSeek-V3', color: '#14b8a6' },

  // ================= 10. 游戏与科幻矩阵 (Game) =================
  { subdomain: 'trpg', name: 'TRPG 跑团主持', description: 'AI 担任 KP/DM 开启无限地下城', category: 'game', icon: '🎲', model: 'deepseek-ai/DeepSeek-V3', color: '#7c3aed' },
  { subdomain: 'future', name: '未来职业预测', description: '预测 10 年后你的技能价值', category: 'game', icon: '🚀', model: 'deepseek-ai/DeepSeek-V3', color: '#c026d3' },
  { subdomain: 'murder', name: '海龟汤迷案', description: '无限提供烧脑海龟汤与解答判官', category: 'game', icon: '🐢', model: 'deepseek-ai/DeepSeek-V3', color: '#10b981' },
  { subdomain: 'rpg-stat', name: '人生属性面板', description: '输入简历生成你的 RPG 六维雷达图', category: 'game', icon: '⚔️', model: 'deepseek-ai/DeepSeek-V3', color: '#f97316' },
  { subdomain: 'zombie', name: '丧尸生存模拟', description: '文字冒险：在爆发丧尸的城市活下去', category: 'game', icon: '🧟', model: 'deepseek-ai/DeepSeek-V3', color: '#ef4444' },
  { subdomain: 'dating', name: '乙女/霸总模拟', description: '与病娇/傲娇虚拟角色谈个恋爱', category: 'game', icon: '💖', model: 'deepseek-ai/DeepSeek-V3', color: '#ec4899' },
  { subdomain: 'whoami', name: '谁是卧底', description: 'AI 作为法官自动分配词语和复盘', category: 'game', icon: '🕵️', model: 'deepseek-ai/DeepSeek-V3', color: '#3b82f6' },
  { subdomain: 'lol', name: '峡谷钢琴家', description: '自动生成不带脏字的高级阴阳怪气', category: 'game', icon: '🎹', model: 'deepseek-ai/DeepSeek-V3', color: '#f59e0b' },
  { subdomain: 'world', name: '世界观设定', description: '为小说/游戏构建魔法或科幻体系', category: 'game', icon: '🌍', model: 'deepseek-ai/DeepSeek-V3', color: '#8b5cf6' },
  { subdomain: 'scifi', name: '赛博朋克重写', description: '把日常小事写成赛博朋克黑客风', category: 'game', icon: '🕶️', model: 'deepseek-ai/DeepSeek-V3', color: '#2dd4bf' }
];

async function seed100Agents() {
  console.log('🚀 开始向数据库注入 100 个垂直站群节点...');

  // 整理数据格式
  const inserts = ALL_100_AGENTS.map(agent => {
    // 根据分类生成默认提示词
    let suggestions = [];
    switch(agent.category) {
      case 'text':
        suggestions = ['帮我写一段吸引人的开头', '优化一下这段文字的语气', '帮我列出 5 个创意大纲'];
        break;
      case 'vision':
        suggestions = ['设计一个简约风格的 Logo', '生成一张赛博朋克风的海报', '为一个运动品牌设计头像'];
        break;
      case 'code':
        suggestions = ['这段代码哪里有 Bug？', '帮我重构这段逻辑', '这段代码的性能如何优化？'];
        break;
      case 'business':
        suggestions = ['分析这份合同的潜在风险', '帮我准备一下明天的面试', '写一份本周的工作总结'];
        break;
      case 'edu':
        suggestions = ['用简单的语言解释这个概念', '帮我批改一下这篇作文', '出几道题考考我'];
        break;
      default:
        suggestions = ['你可以做什么？', '帮我解决一个具体问题', '给我一些专业建议'];
    }

    return {
      subdomain: agent.subdomain,
      name: agent.name,
      description: agent.description,
      category: agent.category,
      icon: agent.icon,
      model_id: agent.model,
      primary_color: agent.color,
      api_provider: 'siliconflow',
      credits_per_call: agent.category === 'vision' ? 5 : 1,
      is_active: true,
      deploy_status: 'pending',
      suggested_prompts: suggestions
    };
  });

  // 使用 upsert，按 subdomain 防冲突更新
  const { data: result, error } = await supabase
    .from('agents')
    .upsert(inserts, { onConflict: 'subdomain' })
    .select('id, subdomain, name');

  if (error) {
    console.error('❌ 注入 100 站群数据失败:', error.message);
    return;
  }

  console.log(`✅ 成功建立 ${result.length} 个 AI 站点节点数据！`);
  console.log('🚀 正在为所有站点配置独立的专属系统提示词 (System Prompt)...');

  // 配置系统提示词前，先清空这些站点可能存在的老 system prompt
  const agentIds = result.map(a => a.id);
  await supabase.from('prompts').delete().in('agent_id', agentIds).eq('name', 'Default System Prompt');

  const prompts = result.map(agent => ({
    agent_id: agent.id,
    prompt_type: 'system',
    name: 'Default System Prompt',
    content: `你是一个超级专业的 [${agent.name}]。你的目标是提供极致的垂直服务，满足用户关于“${agent.subdomain}”细分领域的需求。语气要专业、幽默且具有针对性。不要提供无关的通用回答。`,
    is_default: true
  }));

  const { error: promptError } = await supabase
    .from('prompts')
    .insert(prompts);

  if (promptError) {
    console.error('❌ 注入提示词失败:', promptError.message);
  } else {
    console.log('✨ 100 个站点的底层设计与数据注入已全部完成！');
    console.log('👉 您可以随意输入 subdomain 测试，例如 http://localhost:3000?subdomain=novel');
  }
}

seed100Agents();
