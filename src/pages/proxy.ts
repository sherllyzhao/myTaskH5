/**
 * API 代理路由
 * 用于在 SSR 中转发请求到后端，解决 Vite 代理只对浏览器端有效的问题
 */
import type { APIRoute } from 'astro';

  // 测试 GET 路由
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ status: 'ok', message: 'Proxy route is working' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  console.log('🎯 [Proxy] POST 路由被调用！');

  try {
    // 获取请求体
    const body = await request.json();

    // 基础 URL（固定部分）
    const baseUrl = 'https://flexible.china9.cn/api';

    // 从请求体中获取目标路径（可选，默认为 /taskorder/orderindex）
    const path = body.path || '/taskorder/orderindex';

    // 构造完整的后端 URL
    const targetUrl = `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;

    // 构造请求头，完全模拟浏览器请求
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      // 不设置 Origin 和 Referer，避免 CORS 问题
    };

    // 准备请求体，移除代理专用参数
    let requestBody = { ...body };

    // 移除 path 参数（这是给代理用的，不发送给后端）
    delete requestBody.path;

    // 添加 tokens 到请求头（如果存在）
    if (body.tokens) {
      headers['Tokens'] = body.tokens;
      // 从请求体中移除 tokens，只通过请求头发送
      delete requestBody.tokens;
    }

    // 转发所有 Cookie 到后端
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    // 转发请求到后端
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    // 获取响应文本
    const responseText = await response.text();

    // 尝试解析为 JSON
    let data;
    try {
      data = JSON.parse(responseText);
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
