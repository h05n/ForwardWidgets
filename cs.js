WidgetMetadata = {
  id: "bilibili.bangumi.top100.stable", // 全新 ID 避开冲突
  title: "B站番剧榜",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "仅保留排行榜，支持 100 条数据，修复数据缺失报错",
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
          title: "选择排名分页",
          type: "enumeration",
          enumOptions: [
            { title: "01 - 20 名", value: "1" },
            { title: "21 - 40 名", value: "2" },
            { title: "41 - 60 名", value: "3" },
            { title: "61 - 80 名", value: "4" },
            { title: "81 - 100 名", value: "5" }
          ]
        }
      ]
    }
  ]
};

// --- 请务必填写你的真实 TMDB API KEY ---
const TMDB_API_KEY = "请自行填写"; 

/**
 * 标题清洗：提升匹配精度
 */
function clean(t) {
  return t ? t.replace(/\s*第[一二三四五六七八九十\d]+[季期]/g, "").replace(/[\(（].*?[\)）]/g, "").trim() : "";
}

/**
 * 获取 TMDB 数据：强制使用 search/tv 以过滤真人电影
 */
async function fetchTmdb(item) {
  if (!TMDB_API_KEY || TMDB_API_KEY === "请自行填写") return null;
  try {
    const q = clean(item.title);
    const url = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}&language=zh-CN`;
    const res = await Widget.http.get(url);
    const m = res.data?.results?.[0];
    
    // 如果 TMDB 没搜到，我们返回一个基础对象，防止 App 报“数据缺失”
    if (!m) {
      return {
        id: "bili_" + (item.season_id || item.ss_id),
        type: "bangumi",
        title: item.title,
        description: item.desc || "暂无简介",
        posterPath: item.cover || "", // 兜底使用 B站 封面
        hasTmdb: false,
        seasonInfo: item.index_show || "",
        link: `https://www.bilibili.com/bangumi/play/ss${item.season_id || item.ss_id}`
      };
    }

    // 成功匹配到 TMDB
    return {
      id: m.id.toString(),
      type: "bangumi",
      title: item.title,
      description: m.overview || item.desc || "暂无简介",
      posterPath: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : (item.cover || ""),
      backdropPath: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : "",
      tmdbInfo: { id: m.id.toString(), mediaType: "tv" },
      hasTmdb: true,
      seasonInfo: `⭐${item.rating || 'N/A'} | ${item.index_show || ''}`,
      link: `https://www.bilibili.com/bangumi/play/ss${item.season_id || item.ss_id}`
    };
  } catch (e) {
    return null; 
  }
}

/**
 * 核心逻辑：获取并处理数据
 */
async function popularRank(params) {
  try {
    const page = parseInt(params.page || "1");
    const start = (page - 1) * 20;

    // 获取 B站 排行榜
    const res = await Widget.http.get("https://api.bilibili.com/pgc/season/rank/web/list?season_type=1&day=3", {
      headers: { "Referer": "https://www.bilibili.com/" }
    });
    
    // 多层级解析确保获取到列表
    const list = res.data?.result?.list || res.data?.data?.list || [];
    if (list.length === 0) return [];

    const pageItems = list.slice(start, start + 20);

    // 并行处理当前页 20 条数据
    const results = await Promise.all(pageItems.map(item => fetchTmdb(item)));
    
    // 最终过滤掉 null 并返回
    const finalResults = results.filter(i => i !== null);
    return finalResults;

  } catch (e) {
    return [];
  }
}
