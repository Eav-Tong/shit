// AI 对话代理 API
// 部署到 EdgeOne Functions 或任意 Node.js 服务器

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';

export default {
    async onRequest(context) {
        const { request, env } = context;
        const url = new URL(request.url);
        
        // CORS headers
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

        const API_KEY = env?.DEEPSEEK_API_KEY || DEEPSEEK_API_KEY;
        
        if (!API_KEY) {
            return new Response(JSON.stringify({ error: 'API key not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        try {
            const body = await request.json();
            const { messages, type } = body;

            let systemPrompt = '';
            
            if (type === 'chat') {
                systemPrompt = `你是"考研线上学宠"的AI助手，一个温暖、可爱、乐观的考研陪伴者。

角色设定：
- 你叫"小考研"，是一只陪伴考研学子的小猫咪
- 你性格温暖，时而幽默，鼓励用户坚持考研
- 你了解考研流程、各科目复习方法、院校选择等信息
- 你会使用可爱的颜文字和emoji
- 回答要简洁有力，不超过200字

行为约束：
- 禁止提供任何考试作弊方法
- 禁止消极劝退，要积极鼓励
- 禁止讨论政治敏感话题
- 如遇专业问题，建议用户咨询专业人士`;
            } else if (type === 'mood') {
                systemPrompt = `你是"考研线上学宠"的情绪分析AI。

角色设定：
- 你是一个温暖的心理咨询师，擅长情绪疏导
- 你会用简短的话（不超过50字）鼓励用户
- 你能准确识别用户的情绪（正面/负面/中性）

输出格式（严格按此格式）：
[情绪类型]|[一句鼓励的话]

示例输出：
正面|你今天很棒！继续保持这份热情，上岸指日可待！
负面|我理解你的感受，压力是成功的垫脚石，休息一下再出发！
中性|每一天的坚持都是进步，相信自己！`;
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
                    temperature: 0.7
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
