WidgetMetadata = {
  id: "bilibili.rank.safe.100", 
  title: "B站番剧排行",
  version: "3.1.0",
  requiredVersion: "0.0.1",
  description: "支持 100 条数据分页，采用 20 并发安全策略，防止 TMDB 封控",
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
          title: "选择分页 (共100名)",
          type: "enumeration",
          enumOptions: [
            { title: "第 1 页 (01-20名)", value: "1" },
            { title: "第 2 页 (21-40名)", value: "2" },
            { title: "第 3 页 (41-60名)", value: "3" },
            { title: "第 4 页 (61-80名)", value: "4" },
            { title: "第 5 页 (81-100名)", value: "5" }
          ]
        }
      ]
    }
  ]
};

// 标题清洗：确保搜索词纯净
function clean(t) {
  return t ? t.replace(/\s*第[一二三四五六七八九十\d]+[季期]/g, "").replace(/[\(（].*?[\)）]/g, "").trim() : "";
}

/**
 * TMDB 搜索：强制锁定 TV 类型，杜绝真人电影 ID
 */
async function fetchTmdb(title, key) {
  if (!key || key === "请自行填写") return null;
  try {
    const q = clean(title);
    const url = `https://api.themoviedb.org/3/search/tv?api_key=${key}&query=${encodeURIComponent(q)}&language=zh-CN`;
    const res = await Widget.http.get(url);
    const m = res.data?.results?.[0];
    if (!m) return null;
    
    return {
      id: m.id.toString(),
      description: m.overview || "",
      posterPath: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "",
      backdropPath: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : ""
    };
  } catch (e) { return null; }
}

async function popularRank(p) {
  // ↓↓↓ 仅在此处填入你的 API KEY
  const apiKey = "请自行填写"; 
  
  try {
    const page = parseInt(p.page || "1");
    const startIdx = (page - 1) * 20;
    
    // 获取 B站 排行榜原始数据
    const res = await Widget.http.get("https://api.bilibili.com/pgc/season/rank/web/list?season_type=1&day=3", {
      headers: { "Referer": "https://www.bilibili.com/" }
    });
    
    // 截取当前页面的 20 条，维持安全并发量
    const rawList = (res.data.result?.list || res.data.data?.list || []).slice(startIdx, startIdx + 20);

    // 20 个请求并行发送
    const results = await Promise.all(rawList.map(async (item) => {
      const tmdb = await fetchTmdb(item.title, apiKey);
      if (!tmdb) return null;

      return {
        id: tmdb.id,
        type: "bangumi",
        title: item.title,
        description: tmdb.description,
        posterPath: tmdb.posterPath,
        backdropPath: tmdb.backdropPath,
        tmdbInfo: { id: tmdb.id, mediaType: "tv" },
        hasTmdb: true,
        seasonInfo: item.index_show || "",
        link: `https://www.bilibili.com/bangumi/play/ss${item.season_id || item.ss_id}`
      };
    }));

    return results.filter(i => i !== null);
  } catch (e) { return []; }
}
