/**
 * Bilibili 适配模块 - 修复版 V1.2.0
 * 严格对齐 demo.js 规范并修复解码错误
 */
WidgetMetadata = {
  id: "bilibili.forward.pro",
  title: "B站热门",
  icon: "https://www.bilibili.com/favicon.ico",
  version: "1.2.0",
  requiredVersion: "0.0.1",
  description: "修复 Decoding Error，优化资源解析路径",
  author: "ForwardHelper",
  site: "https://www.bilibili.com",
  modules: [
    {
      title: "全站热门",
      description: "哔哩哔哩全站实时热门视频",
      functionName: "getPopular",
      params: [{ name: "page", title: "页码", type: "page", value: "1" }],
    },
    {
      // ID 必须固定为 loadResource 才能被 App 正确识别为资源加载
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

    // 严格构造每一个 Item，确保 type 和 id 符合规范
    return rawList.map((item) => {
      const videoUrl = "https://www.bilibili.com/video/" + item.bvid;
      return {
        id: videoUrl,     // type 为 url 时，id 应设为 URL
        type: "url",      // 必须字段，修复 keyNotFound 报错
        title: item.title,
        posterPath: item.pic.startsWith("//") ? "https:" + item.pic : item.pic,
        link: videoUrl,   // 传递给 loadResource 的核心参数
        description: item.desc || "",
        mediaType: "movie", // 默认设定媒体类型
        durationText: formatSeconds(item.duration)
      };
    });
  } catch (error) {
    console.error("加载列表失败:", error);
    return [];
  }
}

/**
 * 资源解析：对应 demo.js 中的 loadResource
 */
async function loadResource(params) {
  const { link } = params;
  if (!link) return [];

  try {
    const bvid = link.match(/video\/(BV\w+)/)[1];
    
    // 1. 获取 CID
    const viewApi = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
    const viewResp = await Widget.http.get(viewApi, {
        headers: { "Referer": "https://www.bilibili.com" }
    });
    const cid = viewResp.data.data.cid;

    // 2. 解析播放流 (480P MP4 兼容性最佳)
    const playApi = `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=32&type=mp4&platform=html5&high_quality=1`;
    const playResp = await Widget.http.get(playApi, {
      headers: {
        "Referer": "https://www.bilibili.com",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15"
      }
    });

    if (playResp.data && playResp.data.data && playResp.data.data.durl) {
        // 严格遵循 demo.js 返回格式
        return [
          {
            name: "Bilibili 稳定线路 (480P)",
            description: "原生 MP4 直连",
            url: playResp.data.data.durl[0].url,
          }
        ];
    }
    return [];
  } catch (e) {
    console.error("资源解析异常:", e);
    return [];
  }
}

/**
 * 辅助：时间格式化
 */
function formatSeconds(s) {
  if (!s) return "00:00";
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return (m < 10 ? "0" + m : m) + ":" + (rs < 10 ? "0" + rs : rs);
}
