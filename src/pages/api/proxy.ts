/**
 * API 代理路由
 * 用于在 SSR 中转发请求到后端，解决 Vite 代理只对浏览器端有效的问题
 */
import type { APIRoute } from 'astro';

// 测试 GET 路由
export const GET: APIRoute = async () => {
  console.log('🧪 [Proxy] GET 测试路由被调用');
  return new Response(JSON.stringify({ status: 'ok', message: 'Proxy route is working' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const POST: APIRoute = async ({ request }) => {
  console.log('🎯 [Proxy] POST 路由被调用！');

  try {
    // 获取请求体
    const body = await request.json();

    // 构造完整的后端 URL
    const targetUrl = 'https://flexible.china9.cn/api/taskorder/orderindex';

    console.log('🔄 [Proxy] 转发请求:', targetUrl);
    console.log('📤 [Proxy] 请求数据:', JSON.stringify(body, null, 2));

    // 构造请求头，完全模拟浏览器请求
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      // 不设置 Origin 和 Referer，避免 CORS 问题
    };

    // 添加 tokens 到请求头（如果存在）
    if (body.tokens) {
      headers['Tokens'] = body.tokens;
    }

    console.log('📋 [Proxy] 请求头:', JSON.stringify(headers, null, 2));

    // 转发请求到后端
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    console.log('📡 [Proxy] 响应状态:', response.status);
    console.log('📋 [Proxy] 响应头:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

    // 获取响应文本
    const responseText = await response.text();
    console.log('📝 [Proxy] 原始响应:', responseText.substring(0, 500));

    // 尝试解析为 JSON
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('✅ [Proxy] 响应成功 - Code:', data.code);
    } catch (e) {
      console.error('❌ [Proxy] JSON 解析失败，返回原始文本');
      data = {
        code: -1,
        message: 'JSON解析失败',
        data: responseText,
      };
    }

    // 返回响应
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('❌ [Proxy] 请求失败:', error);
    console.error('Stack:', error.stack);
    return new Response(
      JSON.stringify({
        code: -1,
        message: error.message || '代理请求失败',
        data: null,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
