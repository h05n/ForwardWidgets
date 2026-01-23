/**
 * Bilibili 适配模块 - V1.3.0
 * 严格按照 demo.js 规范修复了 Decoding Error
 */
WidgetMetadata = {
  id: "bilibili.forward.v130",
  title: "B站热门",
  icon: "https://www.bilibili.com/favicon.ico",
  version: "1.3.0",
  requiredVersion: "0.0.1",
  description: "修复了 type 字段缺失导致的解码错误",
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
      // ID 必须固定为 loadResource 才能被 App 识别为流媒体加载
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
  console.log("Bilibili V1.3.0: getPopular 开始运行");
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

    // 严格构造模型，修复 keyNotFound("type") 报错
    return list.map((item) => {
      const videoUrl = "https://www.bilibili.com/video/" + item.bvid;
      return {
        id: videoUrl,
        type: "url",           // [核心修复] 必须提供的字段
        title: item.title,
        posterPath: item.pic.startsWith('http') ? item.pic : 'https:' + item.pic,
        link: videoUrl + "?cid=" + item.cid, // 传递给 loadResource 的参数
        description: item.desc || "",
        mediaType: "movie",
        durationText: formatSeconds(item.duration)
      };
    });
  } catch (error) {
    console.error("Bilibili 列表加载失败:", error);
    return [];
  }
}

/**
 * 资源解析：严格对齐 demo.js 规范
 */
async function loadResource(params) {
  console.log("Bilibili V1.3.0: loadResource 开始解析", params.link);
  const { link } = params;
  if (!link) return [];

  try {
    const bvid = link.match(/video\/(BV\w+)/)[1];
    const cidMatch = link.match(/cid=(\d+)/);
    const cid = cidMatch ? cidMatch[1] : null;

    // 获取播放地址 (qn=32 为 480P，无需登录最稳定)
    const playApi = `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=32&type=mp4&platform=html5&high_quality=1`;
    
    const playResp = await Widget.http.get(playApi, {
      headers: {
        "Referer": "https://www.bilibili.com",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15"
      }
    });

    if (playResp.data && playResp.data.data && playResp.data.data.durl) {
      // 严格按照 demo.js 返回格式
      return [
        {
          name: "B站直连 (480P)",
          description: "MP4 格式 | 稳定线路",
          url: playResp.data.data.durl[0].url,
        }
      ];
    }
    return [];
  } catch (error) {
    console.error("B站资源解析失败:", error);
    return [];
  }
}

function formatSeconds(s) {
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return (m < 10 ? "0" + m : m) + ":" + (rs < 10 ? "0" + rs : rs);
}
