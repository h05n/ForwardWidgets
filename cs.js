WidgetMetadata = {
  id: "bilibili.bangumi.official.standard.v2", 
  title: "B站番剧排行",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "对齐官方自动翻页逻辑，严选 TMDB 高清海报，字段完美封包",
  author: "Forward",
  site: "https://www.bilibili.com/anime/",
  modules: [
    {
      id: "popularRank",
      title: "热门番剧榜",
      functionName: "popularRank",
      // 官方逻辑：定义为 number 类型，App 会在滚动时自动累加 page 参数
      params: [
        {
          name: "page",
          title: "起始页",
          type: "number",
          default: 1
        }
      ]
    }
  ]
};

// --- 全局配置：填入你的 TMDB API KEY ---
const TMDB_API_KEY = "cf2190683e55fad0f978c719d0bc1c68"; 

/**
 * 官方标准清洗逻辑：移除干扰词，确保匹配成功率
 */
function clean(t) {
  if (!t) return "";
  return t.replace(/\s*第[一二三四五六七八九十\d]+[季期]/g, "").replace(/[\(（].*?[\)）]/g, "").trim();
}

/**
 * 官方同款匹配：仅保留匹配成功的高清项
 */
async function fetchItem(item) {
  if (!TMDB_API_KEY || TMDB_API_KEY === "请自行填写") return null;
  try {
    const q = clean(item.title);
    // 强制 TV 搜索
    const url = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}&language=zh-CN`;
    const res = await Widget.http.get(url);
    const m = res.data?.results?.[0];

    // 严选逻辑：只要没有 TMDB 海报地址，直接跳过，绝无 B站原图
    if (m && m.poster_path) {
      return {
        id: m.id.toString(), // 必须是字符串
        type: "bangumi",     // 必须是 bangumi 类型
        title: item.title,
        description: m.overview || item.desc || "",
        posterPath: `https://image.tmdb.org/t/p/w500${m.poster_path}`,
        backdropPath: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : "",
        // 关键字段：必须包含 mediaType
        tmdbInfo: { 
          id: m.id.toString(), 
          mediaType: "tv" 
        },
        hasTmdb: true,
        // 对齐官方：在副标题显示 B站 评分和更新进度
        seasonInfo: `⭐${item.rating || 'N/A'} | ${item.index_show || ''}`,
        link: `https://www.bilibili.com/bangumi/play/ss${item.season_id || item.ss_id}`
      };
    }
  } catch (e) { return null; }
  return null;
}

/**
 * 模块入口：对齐官方自动分页调用逻辑
 */
async function popularRank(params) {
  try {
    // 自动分页逻辑：由 App 自动传入递增的 page 参数
    const page = (params && params.page) ? parseInt(params.page) : 1;
    const pageSize = 20;
    const start = (page - 1) * pageSize;

    // 限制最高请求 100 条 (5页)
    if (start >= 100) return [];

    // 获取 B站 排行榜原始数据
    const res = await Widget.http.get("https://api.bilibili.com/pgc/season/rank/web/list?season_type=1&day=3", {
      headers: { "Referer": "https://www.bilibili.com/" }
    });

    // 官方级多重数据层级解析
    let rawList = [];
    if (res.data) {
      rawList = res.data.result?.list || res.data.data?.list || res.data.list || [];
    }

    if (rawList.length === 0) return [];

    // 截取当前批次的 20 条
    const pageItems = rawList.slice(start, start + pageSize);
    const results = await Promise.all(pageItems.map(item => fetchItem(item)));
    
    // 过滤掉匹配失败的项
    return results.filter(i => i !== null);

  } catch (e) {
    return [];
  }
}
