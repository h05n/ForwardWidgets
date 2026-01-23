WidgetMetadata = {
  id: "bilibili.bangumi.pagination", 
  title: "B站番剧排行",
  version: "2.1.0",
  requiredVersion: "0.0.1",
  description: "支持分页加载共 100 条数据，防止 TMDB 封控",
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
          title: "分页 (每页20条)",
          type: "enumeration",
          enumOptions: [
            { title: "第 1 页 (1-20)", value: "1" },
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

/**
 * 标题清洗：确保搜索精准
 */
function cleanTitle(title) {
  if (!title) return "";
  return title
    .replace(/\s*第[一二三四五六七八九十\d]+季/g, "")
    .replace(/\s*第[一二三四五六七八九十\d]+期/g, "")
    .replace(/[\(（].*?[\)）]/g, "")
    .trim();
}

/**
 * 仅获取 TMDB ID
 * 使用 search/tv 接口强制避开真人电影
 */
async function getTmdbId(title) {
  // ↓↓↓ 在这里填入你自己的 API KEY ↓↓↓
  const apiKey = "cf2190683e55fad0f978c719d0bc1c68"; 

  if (!apiKey || apiKey === "请自行填写") return null;

  try {
    const query = cleanTitle(title);
    // 强制使用 search/tv 接口，只在剧集/动漫里找
    const url = `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=zh-CN`;
    const res = await Widget.http.get(url);
    
    if (res.data?.results?.length > 0) {
      return res.data.results[0].id.toString(); 
    }
  } catch (e) {
    return null;
  }
  return null;
}

/**
 * 格式化：脚本不提供封面路径，由 App 根据 ID 自动拉取
 */
async function formatItem(item) {
  const tmdbId = await getTmdbId(item.title);
  if (!tmdbId) return null; 

  const sid = (item.season_id || item.ss_id || "").toString();
  
  return {
    id: tmdbId,
    type: "bangumi",
    title: item.title,
    posterPath: "", 
    tmdbInfo: {
      id: tmdbId,
      mediaType: "tv"
    },
    hasTmdb: true,
    seasonInfo: item.index_show || "",
    link: `https://www.bilibili.com/bangumi/play/ss${sid}`
  };
}

/**
 * 模块入口：支持分页加载
 */
async function popularRank(params) {
  try {
    const page = parseInt(params.page || "1");
    const pageSize = 20;
    const startIdx = (page - 1) * pageSize;
    const endIdx = page * pageSize;

    const url = "https://api.bilibili.com/pgc/season/rank/web/list?season_type=1&day=3";
    const res = await Widget.http.get(url, { headers: { "Referer": "https://www.bilibili.com/" } });
    
    // 获取 B站 排行榜全部数据（通常为 100 条）
    const fullList = res.data.result?.list || res.data.data?.list || [];
    
    // 根据分页参数截取当前页的数据
    const pageList = fullList.slice(startIdx, endIdx);

    // 并行处理当前页的 20 个请求，既快又安全
    const results = await Promise.all(pageList.map(item => formatItem(item)));
    
    return results.filter(i => i !== null);
  } catch (e) {
    console.log("加载失败: " + e.message);
    return [];
  }
}
