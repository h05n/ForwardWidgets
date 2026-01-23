/**
 * Bilibili 适配模块 - 稳定修复版
 * 严格对齐 demo.js 规范，解决 Decoding Error
 */
WidgetMetadata = {
  id: "bilibili.forward.pro.v5",
  title: "B站热门",
  icon: "https://www.bilibili.com/favicon.ico",
  version: "1.2.5",
  requiredVersion: "0.0.1",
  description: "修复了 type 字段缺失导致的解码错误",
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
 * 模块：获取热门视频列表
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

    // 容错处理：确保返回的是数组
    if (!response.data || !response.data.data || !response.data.data.list) {
      return [];
    }

    const rawList = response.data.data.list;

    // 严格映射：确保每个 key 都不为 undefined
    return rawList.filter(item => item.bvid).map((item) => {
      const videoLink = "https://www.bilibili.com/video/" + item.bvid;
      return {
        type: "url",             // [核心修复] 必须字段，否则报 keyNotFound
        id: videoLink,           // [规范] type 为 url 时，id 应设为对应 URL
        title: item.title || "无标题",
        posterPath: item.pic ? (item.pic.startsWith("//") ? "https:" + item.pic : item.pic) : "",
        link: videoLink + "?cid=" + (item.cid || ""), // 传递给 loadResource
        description: item.desc || "",
        durationText: formatSeconds(item.duration || 0),
        mediaType: "movie"
      };
    });
  } catch (error) {
    console.error("加载列表失败:", error);
    return []; // 发生错误时返回空数组，避免 Decoding Error
  }
}

/**
 * 资源解析：对应 demo.js 中的 loadResource 规范
 */
async function loadResource(params) {
  const { link } = params;
  if (!link) return [];

  try {
    const bvid = link.match(/video\/(BV\w+)/)[1];
    let cidMatch = link.match(/cid=(\d+)/);
    let cid = (cidMatch && cidMatch[1] !== "undefined") ? cidMatch[1] : null;

    // 备选：如果 link 没带 cid，则查一次 view 接口
    if (!cid) {
      const viewApi = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
      const viewResp = await Widget.http.get(viewApi, {
          headers: { "Referer": "https://www.bilibili.com" }
      });
      cid = viewResp.data.data.cid;
    }

    // 解析播放流 (480P MP4 兼容性最佳)
    const playApi = `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=32&type=mp4&platform=html5&high_quality=1`;
    const playResp = await Widget.http.get(playApi, {
      headers: {
        "Referer": "https://www.bilibili.com",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15"
      }
    });

    if (playResp.data && playResp.data.data && playResp.data.data.durl) {
        // 严格遵循 demo.js 的资源返回格式
        return [
          {
            name: "Bilibili 稳定线路",
            description: "480P | 原生 MP4 直连",
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
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return (m < 10 ? "0" + m : m) + ":" + (rs < 10 ? "0" + rs : rs);
}
