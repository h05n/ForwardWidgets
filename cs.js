/**
 * Bilibili 适配模块 - 最终修复版
 * 修复了 type 字段缺失导致的 Decoding Error
 */
WidgetMetadata = {
  id: "bilibili.forward.final",
  title: "B站热门",
  icon: "https://www.bilibili.com/favicon.ico",
  version: "1.1.2",
  requiredVersion: "0.0.1",
  description: "已修复数据结构缺失问题",
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
      // id 必须固定为 loadResource 用于解析播放地址
      id: "loadResource",
      title: "加载资源",
      functionName: "loadResource",
      type: "stream",
      params: [],
    },
  ],
};

/**
 * 修复后的列表获取函数
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
      // 关键修复：添加 type 字段，否则应用会报 Decoding Error
      type: "url", 
      title: item.title,
      posterPath: item.pic.replace("http://", "https://"),
      // 这个 link 会作为参数传递给 loadResource
      link: `https://www.bilibili.com/video/${item.bvid}?cid=${item.cid}`,
      description: item.desc,
      durationText: formatSeconds(item.duration)
    }));
  } catch (error) {
    console.error("列表加载失败", error);
    return [];
  }
}

/**
 * 资源解析函数
 */
async function loadResource(params) {
  const { link } = params;
  if (!link) return [];

  try {
    const bvid = link.match(/video\/(BV\w+)/)[1];
    const cidMatch = link.match(/cid=(\d+)/);
    const cid = cidMatch ? cidMatch[1] : null;

    // 获取 480P MP4 视频流（qn=32 兼容性最强）
    const playUrlApi = `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=32&type=mp4&platform=html5&high_quality=1`;
    
    const playResp = await Widget.http.get(playUrlApi, {
      headers: {
        "Referer": "https://www.bilibili.com",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15"
      }
    });

    const videoUrl = playResp.data.data.durl[0].url;

    return [
      {
        name: "Bilibili 高清直连",
        description: "MP4 格式 | 480P",
        url: videoUrl,
      }
    ];
  } catch (error) {
    return [{ name: "解析失败", description: error.message, url: "" }];
  }
}

function formatSeconds(s) {
  return [Math.floor(s / 60), s % 60].map(v => v < 10 ? "0" + v : v).join(":");
}
