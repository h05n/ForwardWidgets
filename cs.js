/**
 * Bilibili 适配模块 - V1.5.0
 * 严格按照用户提供的 demo.js 规范编写
 */
WidgetMetadata = {
  id: "bilibili.forward.v150",
  title: "B站热门",
  icon: "https://www.bilibili.com/favicon.ico",
  version: "1.5.0",
  requiredVersion: "0.0.1",
  description: "严格对齐 Demo 规范，修复 Decoding Error 与资源加载问题",
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
 * 1. 列表获取函数
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

    // 关键修复：每个返回项必须包含 type 字段，否则会报 Decoding Error
    return list.map((item) => ({
      id: "https://www.bilibili.com/video/" + item.bvid,
      type: "url", // 修复日志中的 keyNotFound("type")
      title: item.title,
      posterPath: item.pic.startsWith('http') ? item.pic : 'https:' + item.pic,
      // 这里的 link 会作为参数传递给 loadResource
      link: "https://www.bilibili.com/video/" + item.bvid + "?cid=" + item.cid,
      description: item.desc || "",
    }));
  } catch (error) {
    console.error("列表加载失败:", error);
    return [];
  }
}

/**
 * 2. 资源解析函数 - 严格按照 demo.js 返回数组
 */
async function loadResource(params) {
  const { link } = params; // 从 params 中解构 link
  if (!link) return [];

  try {
    const bvid = link.match(/video\/(BV\w+)/)[1];
    const cidMatch = link.match(/cid=(\d+)/);
    const cid = cidMatch ? cidMatch[1] : null;

    // B站 playurl 接口
    // qn=32(480P) 是无 Cookie 状态下最稳定的画质
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
          name: "B站稳定线路 (MP4)",
          description: "480P 标准画质\n支持系统播放器直接调用",
          url: videoUrl,
        }
      ];
    }
    
    return [{ name: "解析失败", description: "B站接口未返回有效地址", url: "" }];
  } catch (error) {
    console.error("资源解析错误:", error);
    return [{ name: "解析错误", description: error.message, url: "" }];
  }
}
