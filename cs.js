/**
 * Bilibili 适配模块 - V1.7.0
 * 严格对齐 demo.js 规范，修复所有 Decoding Error
 */

WidgetMetadata = {
  id: "bilibili.forward.v170",
  title: "B站热门",
  icon: "https://www.bilibili.com/favicon.ico",
  version: "1.7.0",
  requiredVersion: "0.0.1",
  description: "根据 Demo 规范重构，修复数据缺失及解析失败问题",
  author: "Gemini",
  site: "https://www.bilibili.com",
  modules: [
    {
      title: "全站热门",
      description: "哔哩哔哩实时热门榜单",
      functionName: "getPopular",
      params: [{ name: "page", title: "页码", type: "page", value: "1" }],
    },
    {
      // id 必须固定为 loadResource 以匹配 stream 类型
      id: "loadResource",
      title: "加载资源",
      functionName: "loadResource",
      type: "stream",
      params: [],
    },
  ],
};

/**
 * 列表获取：全站热门
 */
async function getPopular(params) {
  try {
    const page = params.page || 1;
    const url = `https://api.bilibili.com/x/web-interface/popular?ps=20&pn=${page}`;

    const response = await Widget.http.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://www.bilibili.com"
      }
    });

    const rawList = response.data.data.list;

    // 必须确保每个对象都有 type 字段，否则报 Decoding Error
    return rawList.map((item) => {
      const videoLink = "https://www.bilibili.com/video/" + item.bvid;
      return {
        id: videoLink,       // type 为 url 时，id 应设为 URL
        type: "url",        // [核心修复] 必须字段
        title: item.title,
        posterPath: item.pic.startsWith('//') ? 'https:' + item.pic : item.pic,
        link: videoLink + "?cid=" + item.cid, // 传递给 loadResource 的参数
        description: item.desc || "",
      };
    });
  } catch (error) {
    console.error("列表加载失败:", error);
    return [];
  }
}

/**
 * 资源解析：严格对齐 demo.js 返回格式
 */
async function loadResource(params) {
  // 解构 link 参数
  const { link } = params; 
  if (!link) return [];

  try {
    const bvid = link.match(/video\/(BV\w+)/)[1];
    const cidMatch = link.match(/cid=(\d+)/);
    const cid = cidMatch ? cidMatch[1] : null;

    // 获取 480P MP4 视频流（qn=32 稳定性最高）
    const playApi = `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=32&type=mp4&platform=html5`;
    
    const playResp = await Widget.http.get(playApi, {
      headers: {
        "Referer": "https://www.bilibili.com",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15"
      }
    });

    if (playResp.data && playResp.data.data && playResp.data.data.durl) {
      const videoUrl = playResp.data.data.durl[0].url;
      
      // 必须返回数组，每个对象包含 name, description, url
      return [
        {
          name: "B站稳定线路",
          description: "480P | 原生 MP4 格式",
          url: videoUrl,
        }
      ];
    }
    
    return [];
  } catch (error) {
    console.error("资源解析异常:", error);
    return [];
  }
}
