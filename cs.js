WidgetMetadata = {
  id: "bilibili.rank.debug.100", 
  title: "B站番剧排行",
  version: "3.3.0",
  description: "带日志排查功能，支持 100 条分页",
  author: "Forward",
  modules: [
    {
      id: "popularRank",
      title: "热门番剧榜",
      functionName: "popularRank",
      params: [
        {
          name: "page",
          title: "选择分页",
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

const API_KEY = "cf2190683e55fad0f978c719d0bc1c68"; // ← 必须填入你的真实 TMDB API Key

async function getTmdbStandard(title) {
  if (!API_KEY || API_KEY === "请自行填写") {
    console.log("【错误】未检测到 API Key，请在代码第 31 行填写！");
    return null;
  }
  try {
    const query = title.replace(/\s*第[一二三四五六七八九十\d]+[季期]/g, "").replace(/[\(（].*?[\)）]/g, "").trim();
    const url = `https://api.themoviedb.org/3/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=zh-CN`;
    const res = await Widget.http.get(url);
    if (res.data?.results?.length > 0) {
      const match = res.data.results[0];
      return {
        id: match.id.toString(),
        description: match.overview || "",
        posterPath: match.poster_path ? `https://image.tmdb.org/t/p/w500${match.poster_path}` : ""
      };
    }
  } catch (e) {
    console.log(`【TMDB 异常】${title}: ${e.message}`);
    return null;
  }
  return null;
}

async function popularRank(params) {
  try {
    console.log("【开始】正在请求 B 站排行榜...");
    const page = parseInt(params.page || "1");
    const startIdx = (page - 1) * 20;

    const res = await Widget.http.get("https://api.bilibili.com/pgc/season/rank/web/list?season_type=1&day=3", {
      headers: { "Referer": "https://www.bilibili.com/" }
    });
    
    // 兼容 B 站两种可能的数据结构
    const fullList = res.data.result?.list || res.data.data?.list || [];
    
    if (fullList.length === 0) {
      console.log("【警告】B 站返回列表为空，请检查网络或 Referer 设置");
      return [];
    }

    console.log(`【成功】获取到 ${fullList.length} 条番剧，正在处理第 ${page} 页...`);
    const pageList = fullList.slice(startIdx, startIdx + 20);

    const results = await Promise.all(pageList.map(async (item) => {
      const tmdb = await getTmdbStandard(item.title);
      if (!tmdb) return null;
      return {
        id: tmdb.id,
        type: "bangumi",
        title: item.title,
        description: tmdb.description,
        posterPath: tmdb.posterPath,
        tmdbInfo: { id: tmdb.id, mediaType: "tv" },
        hasTmdb: true,
        seasonInfo: `⭐${item.rating ? item.rating.replace('分','') : 'N/A'} | ${item.index_show}`,
        link: `https://www.bilibili.com/bangumi/play/ss${item.season_id || item.ss_id}`
      };
    }));

    const finalData = results.filter(i => i !== null);
    console.log(`【完成】本页成功匹配 ${finalData.length} 条数据`);
    return finalData;

  } catch (e) {
    console.log("【严重错误】" + e.message);
    return [];
  }
}
