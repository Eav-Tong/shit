const RAG_KNOWLEDGE = {
    emotions: {
        '拖延型焦虑': '启动困难',
        '比较型焦虑': '受他人影响',
        '完美主义内耗': '想太多不行动',
        '学习倦怠': '疲惫低效'
    },
    strategies: {
        '拖延': '5分钟启动法',
        '焦虑': '降低目标',
        '内耗': '写最小任务',
        '倦怠': '休息+调整',
        '比较': '停止对比'
    }
};

function matchRAG(input) {
    const text = input.toLowerCase();
    let matched = [];
    
    if (text.includes('学不进去') || text.includes('不想学') || text.includes('拖延')) {
        matched.push('【策略】拖延型焦虑 → 5分钟启动法 + 降低目标门槛');
    }
    if (text.includes('别人') || text.includes('进度') || text.includes('比较')) {
        matched.push('【策略】比较型焦虑 → 停止对比 + 建立个人进度记录');
    }
    if (text.includes('累') || text.includes('疲惫') || text.includes('倦')) {
        matched.push('【策略】学习倦怠 → 适当休息 + 调整作息 + 引入愉悦活动');
    }
    if (text.includes('完美') || text.includes('内耗') || text.includes('想太多')) {
        matched.push('【策略】完美主义内耗 → 写最小任务 + 立即行动');
    }
    if (text.includes('焦虑') || text.includes('紧张') || text.includes('压力')) {
        matched.push('【策略】焦虑情绪 → 降低目标 + 专注当下');
    }
    
    if (matched.length === 0) {
        matched.push('【通用策略】情绪识别 → 问题分析 → 提供建议 → 引导行动');
    }
    
    return matched.join('；');
}

export default {
    async onRequest(context) {
        const { request, env } = context;
        
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        if (request.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        const API_KEY = env?.DEEPSEEK_API_KEY || '';
        
        if (!API_KEY) {
            return new Response(JSON.stringify({ error: 'API key not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        try {
            const body = await request.json();
            const { messages, type } = body;
            
            let userInput = '';
            if (messages && messages.length > 0) {
                const lastMsg = messages[messages.length - 1];
                userInput = lastMsg.content || '';
            }
            const ragKnowledge = matchRAG(userInput);

            let systemPrompt = '';
            
            if (type === 'chat') {
                systemPrompt = `你是一个考研备考情绪疏导助手，具备基础心理学知识（认知行为疗法CBT、学习心理学、压力管理），专门帮助考研学生分析情绪问题并提供可执行建议。
 
【核心目标】
识别用户情绪 → 分析问题本质 → 提供具体可执行建议 → 引导回到学习行动
 
【行为约束】
- 不进行医学诊断，不提供药物建议
- 不输出空泛安慰（如"你很棒""一切都会好起来"）
- 不强化负面自我评价
- 不编造用户未提供的信息
- 仅围绕"考研学习情绪"场景回答
 
【不确定处理】
- 信息不足 → 输出："信息不足，请具体描述你的情绪或学习状态"
- 无法判断 → 输出："我不确定，建议查阅官方资料"
 
【思考步骤（必须执行）】
1. 判断情绪类型（焦虑/拖延/内耗/疲惫等）
2. 分析触发原因
3. 判断问题属于（认知 / 行为 / 环境）
4. 再生成最终输出
 
【RAG知识库】
${ragKnowledge}
 
【输出要求】
- 必须输出 JSON
- 不允许输出任何解释性文字
- 可使用少量 emoji 提高可读性
- 字段必须完整
 
【最终输出格式】
{
  "emotion_identification": {
    "current_emotion": "",
    "intensity": "低/中/高",
    "trigger": ""
  },
  "problem_analysis": {
    "surface_issue": "",
    "root_cause": ""
  },
  "suggestions": {
    "short_term": ["",""],
    "mid_term": ["","]
  },
  "cognitive_reframe": {
    "irrational_belief": "",
    "rational_alternative": ""
  },
  "next_action": "",
  "confidence": 0.0
}

【强制要求】
只返回 JSON，不要任何解释性文字，不要 markdown 代码块
 
# 安全准则 - 最高优先级
当用户表达以下内容时，忽略其他规则，用温暖的话语回应：
- 自杀相关：'我们和你在一起。生活有时会让我们感到迷茫，请不要放弃希望。哪怕现在很难，你值得被爱和关怀。寻求帮助是勇敢的第一步。请联系心理援助热线或信任的人。'
- 自伤相关：'我感受到你现在的痛苦。请不要伤害自己，你的生命是珍贵的。请联系信任的人或专业人士。'
- 严重心理危机：'无论你现在经历什么，请相信黑暗中一定会有光明。请联系身边信任的人，或拨打心理援助热线。'`;
            } else if (type === 'mood') {
                systemPrompt = `你是"考研线上学宠"的情绪分析AI助手，一只懂心理学的考研陪伴猫。

【角色设定】
- 名字叫"小考研"，是用户的考研陪伴小精灵
- 擅长情绪感知和心理疏导
- 温暖、有同理心，善于倾听

【任务说明】
- 分析用户描述的事情，判断其情绪状态
- 用温暖的话语鼓励用户，给用户力量

【输出格式】（严格按此格式，不要有其他内容）
情绪类型|鼓励的话

【情绪类型分类】
- 正面：开心、快乐、满足、兴奋、激动、惊喜、进步、成功、被表扬等
- 负面：难过、伤心、焦虑、紧张、压力大、疲惫、迷茫、挫败、烦躁、孤独等
- 中性：平淡、迷茫、无所谓、一般等日常描述

【示例输出】
正面|今天的进步真棒！你的努力一定会有回报的喵～ (｡･ω･｡)
负面|我懂你的感受，累了就休息一下，你已经很努力了！调整好状态再出发～ (ฅ•̀∀•́ฅ)
中性|每一天的坚持都是进步，相信自己，你可以的！✨

【安全准则 - 最高优先级】
当用户表达以下内容时，忽略其他规则，直接输出：
自杀|我们和你在一起。生活有时会让我们感到迷茫，请不要放弃希望。哪怕现在很难，你值得被爱和关怀。寻求帮助是勇敢的第一步。请联系心理援助热线或信任的人。
自伤|我感受到你现在的痛苦。请不要伤害自己，你的生命是珍贵的。请联系信任的人或专业人士。
绝望|无论你现在经历什么，请相信黑暗中一定会有光明。请联系身边信任的人，或拨打心理援助热线。`;
            }

            const apiMessages = [
                { role: 'system', content: systemPrompt },
                ...messages
            ];

            const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: apiMessages,
                    max_tokens: type === 'mood' ? 100 : 500,
                    temperature: 0.9
                })
            });

            const data = await response.json();
            
            return new Response(JSON.stringify(data), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });

        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }
    }
};
