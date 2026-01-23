/**
 * Bilibili 适配模块 - V1.4.0
 * 严格按照 demo.js 提供的 stream 规范编写
 */
WidgetMetadata = {
  id: "bilibili.forward.v140",
  title: "B站热门",
  icon: "https://www.bilibili.com/favicon.ico",
  version: "1.4.0",
  requiredVersion: "0.0.1",
  description: "对齐 Demo 规范，修复资源加载逻辑",
  author: "Gemini",
  site: "https://www.bilibili.com",
  modules: [
    {
      title: "全站热门",
      description: "哔哩哔哩全站实时热门视频",
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
 * 列表获取函数
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

    const list = response.data.data.list;

    // 必须包含 type 字段以防止解码错误
    return list.map((item) => ({
      id: "https://www.bilibili.com/video/" + item.bvid,
      type: "url", 
      title: item.title,
      posterPath: item.pic.startsWith('http') ? item.pic : 'https:' + item.pic,
      // 这里的 link 会作为参数传递给 loadResource
      link: "https://www.bilibili.com/video/" + item.bvid + "?cid=" + item.cid,
      description: item.desc || "",
    }));
  } catch (error) {
    console.error("列表加载失败", error);
    return [];
  }
}

/**
 * 资源解析函数：严格对齐 demo.js 格式
 */
async function loadResource(params) {
  const { link } = params; 
  if (!link) return [];

  try {
    const bvid = link.match(/video\/(BV\w+)/)[1];
    const cidMatch = link.match(/cid=(\d+)/);
    const cid = cidMatch ? cidMatch[1] : null;

    // 获取播放地址，qn=16 (360P) 或 qn=32 (480P) 在无 Cookie 时最稳定
    const playApi = `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=32&type=mp4&platform=html5`;
    
    const playResp = await Widget.http.get(playApi, {
      headers: {
        "Referer": "https://www.bilibili.com",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15"
      }
    });

    if (playResp.data && playResp.data.data && playResp.data.data.durl) {
      const videoUrl = playResp.data.data.durl[0].url;
      
      // 必须返回数组，对象包含 name, description, url
      return [
        {
          name: "B站稳定线路 (MP4)",
          description: "480P 兼容格式",
          url: videoUrl,
        }
      ];
    }
    
    return [{ name: "解析失败", description: "B站未返回有效流地址", url: "" }];
  } catch (error) {
    console.error("资源解析错误", error);
    return [{ name: "解析错误", description: error.message, url: "" }];
  }
}
