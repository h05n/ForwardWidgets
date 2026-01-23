WidgetMetadata = {
  id: "bilibili.rank.official.refactor", // 更改 ID 确保能重新添加
  title: "B站番剧排行",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "仅包含热门番剧榜，100条全数据分页展示，对齐高清海报",
  author: "Forward",
  site: "https://www.bilibili.com/anime/",
  modules: [
    {
      id: "popularRank",
      title: "热门番剧榜",
      functionName: "popularRank",
      params: [
        {
          name: "page",
          title: "选择分页 (1-100名)",
          type: "enumeration",
          enumOptions: [
            { title: "第 1 页 (01-20)", value: "1" },
            { title: "第 2 页 (21-40)", value: "2" },
            { title: "第 3 页 (41-60)", value: "3" },
            { title: "第 4 页 (61-80)", value: "4" },
            { title: "第 5 页 (81-100)", value: "5" }
          ]
        }
      ]
    }
  ]
};

// --- 全局配置 ---
const TMDB_API_KEY = "cf2190683e55fad0f978c719d0bc1c68"; // ← 必须填入你的真实 API Key

/**
 * 官方同款标题清洗逻辑
 */
function cleanTitle(title) {
  if (!title) return "";
  return title
    .replace(/\s*第[一二三四五六七八九十\d]+[季期]/g, "") // 移除“第二季”等
    .replace(/[\(（].*?[\)）]/g, "") // 移除括号内容
    .replace(/！/g, "!")
    .trim();
}

/**
 * 获取 TMDB 数据：强制使用 search/tv 接口过滤真人电影
 */
async function getTmdbData(title) {
  if (!TMDB_API_KEY || TMDB_API_KEY === "请自行填写") return null;
  try {
    const query = cleanTitle(title);
    const url = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=zh-CN`;
    const res = await Widget.http.get(url);
    const result = res.data?.results?.[0];
    
    if (result) {
      return {
        id: result.id.toString(),
        overview: result.overview || "",
        poster: result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : "",
        backdrop: result.backdrop_path ? `https://image.tmdb.org/t/p/original${result.backdrop_path}` : ""
      };
    }
  } catch (e) {
    return null;
  }
  return null;
}

/**
 * 热门番剧榜入口
 */
async function popularRank(params) {
  try {
    const page = parseInt(params.page || "1");
    const pageSize = 20;
    const startIdx = (page - 1) * pageSize;

    // 1. 请求 B站 排行榜接口
    const biliUrl = "https://api.bilibili.com/pgc/season/rank/web/list?season_type=1&day=3";
    const res = await Widget.http.get(biliUrl, {
      headers: { "Referer": "https://www.bilibili.com/" }
    });

    // 2. 解析 B站 列表（三重降级兼容逻辑）
    let list = [];
    if (res.data) {
      list = res.data.result?.list || res.data.data?.list || res.data.list || [];
    }

    if (list.length === 0) return [];

    // 3. 截取分页数据并并行匹配 TMDB
    const pageItems = list.slice(startIdx, startIdx + pageSize);
    const results = await Promise.all(pageItems.map(async (item) => {
      const tmdb = await getTmdbData(item.title);
      if (!tmdb) return null;

      const sid = (item.season_id || item.ss_id || "").toString();

      return {
        id: tmdb.id,
        type: "bangumi",
        title: item.title,
        description: tmdb.overview,
        posterPath: tmdb.poster,
        backdropPath: tmdb.backdrop,
        tmdbInfo: { id: tmdb.id, mediaType: "tv" },
        hasTmdb: true,
        // 对齐官方：显示评分和更新状态
        seasonInfo: `⭐${item.rating ? item.rating.replace('分','') : 'N/A'} | ${item.index_show || ''}`,
        link: `https://www.bilibili.com/bangumi/play/ss${sid}`
      };
    }));

    return results.filter(i => i !== null);

  } catch (e) {
    return [];
  }
}
