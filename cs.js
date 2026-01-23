/**
 * Bilibili 适配模块 (基于官方 Demo 规范)
 * 修复了资源加载逻辑
 */
WidgetMetadata = {
  id: "bilibili.forward.v3",
  title: "B站热门",
  icon: "https://www.bilibili.com/favicon.ico",
  version: "1.1.0",
  requiredVersion: "0.0.1",
  description: "符合最新 stream 规范的 B站热门视频模块",
  author: "Gemini",
  site: "https://www.bilibili.com",
  modules: [
    {
      title: "全站热门",
      description: "查看 B 站实时热门内容",
      functionName: "getPopular",
      params: [{ name: "page", title: "页码", type: "page", value: "1" }],
    },
    {
      // id 必须固定为 loadResource
      id: "loadResource",
      title: "加载资源",
      functionName: "loadResource",
      type: "stream",
      params: [],
    },
  ],
};

/**
 * 浏览模块：获取热门视频列表
 */
async function getPopular(params = {}) {
  try {
    const page = params.page || 1;
    const url = `https://api.bilibili.com/x/web-interface/popular?ps=20&pn=${page}`;

    const response = await Widget.http.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://www.bilibili.com"
      }
    });

    const list = response.data.data.list;

    return list.map((item) => ({
      id: item.bvid,
      title: item.title,
      posterPath: item.pic.replace("http://", "https://"),
      // 这里的 link 会在点击时传递给 loadResource 函数
      link: `https://www.bilibili.com/video/${item.bvid}?cid=${item.cid}`,
      description: item.desc,
    }));
  } catch (error) {
    console.error("列表加载失败", error);
    return [];
  }
}

/**
 * 资源加载模块：解析真实的播放地址
 * 严格匹配 demo.js 的返回格式
 */
async function loadResource(params) {
  const { link } = params;
  if (!link) return [];

  try {
    // 1. 提取参数
    const bvid = link.match(/video\/(BV\w+)/)[1];
    let cidMatch = link.match(/cid=(\d+)/);
    let cid = cidMatch ? cidMatch[1] : null;

    // 如果没有 cid 则查询一次
    if (!cid) {
      const viewResp = await Widget.http.get(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`);
      cid = viewResp.data.data.cid;
    }

    // 2. 获取播放地址 (使用 HTML5 接口以获得兼容性最好的 MP4 格式)
    // qn=64 为 720P, qn=32 为 480P。建议先用 32 测试稳定性
    const playUrlApi = `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=32&type=mp4&platform=html5&high_quality=1`;
    
    const playResp = await Widget.http.get(playUrlApi, {
      headers: {
        "Referer": "https://www.bilibili.com",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15"
      }
    });

    if (playResp.data.code !== 0 || !playResp.data.data.durl) {
        throw new Error("接口未返回有效地址");
    }

    const videoUrl = playResp.data.data.durl[0].url;

    // 3. 按照 Demo 要求的格式返回数组
    return [
      {
        name: "Bilibili 直连 (480P)",
        description: "由 B站 HTML5 接口提供解析\nMP4 格式",
        url: videoUrl,
      }
    ];
  } catch (error) {
    console.error("资源解析失败", error);
    return [
      {
        name: "解析失败",
        description: error.message,
        url: "",
      }
    ];
  }
}
