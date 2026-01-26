/**
 * Forward Widget: 全球日漫榜 (Master Build v56.0)
 * 修复说明：严格对齐官方 CodingKeys，确保 id 和 requiredVersion 置顶。
 */

const WidgetMetadata = {
  "id": "global.anime.ranking.pro",
  "requiredVersion": "1.0.0",
  "title": "日漫榜单",
  "author": "Gemini",
  "version": "1.1.0",
  "description": "日本同步/无标题优先/全量缓存",
  "modules": [
    {
      "id": "animeRanking",
      "title": "榜单浏览",
      "functionName": "moduleDiscover",
      "params": [
        { "name": "mt", "title": "类型", "type": "enumeration", "value": "tv", "enumOptions": [{ "title": "番剧", "value": "tv" }, { "title": "剧场版", "value": "movie" }] },
        { "name": "y", "title": "年份", "type: "enumeration", "value": "", "enumOptions": [{ "title": "全部", "value": "" }, { "title": "2026", "value": "2026" }, { "title: "2025", "value: "2025" }, { "title": "2024", "value: "2024" }] },
        { "name": "st", "title": "状态", "type: "enumeration", "value": "", "enumOptions: [{ "title": "全部", "value: "" }, { "title": "连载中", "value: "0,1,2,4,5" }, { "title: "已完结", "value: "3" }] },
        { "name": "p", "title": "平台", "type: "enumeration", "value": "ALL", "enumOptions: [{ "title": "全部(日本同步)", "value": "ALL" }, { "title": "国内聚合", "value: "CN" }, { "title": "B站", "value: "1605" }, { "title": "Netflix", "value: "213" }] },
        { "name": "s", "title": "排序", "type: "enumeration", "value": "popularity.desc", "enumOptions: [{ "title": "最热", "value: "popularity.desc" }, { "title": "最新", "value: "latest" }] }
      ]
    },
    { "id": "animeSearch", "title": "全量搜索", "functionName": "moduleSearch" }
  ]
};

// --- 核心逻辑控制 ---
const NET_MAP = { "CN": "1605|2007|1330" };
const CACHE_ID = "anime_v56_cache";

async function moduleDiscover(p) {
  const isMov = p.mt === "movie";
  const today = new Date(Date.now() + 28800000).toISOString().split('T')[0];
  const sKey = `${CACHE_ID}_${p.mt}_${p.p}_${p.s}`;

  try {
    const res = await Widget.tmdb.get(isMov ? "/discover/movie" : "/discover/tv", {
      params: {
        language: "zh-CN",
        include_image_language: "null,zh,ja,en", // 5级审美：无标题 > 简中 > 繁中 > 日 > 英
        sort_by: p.s === "latest" ? (isMov ? "release_date.desc" : "first_air_date.desc") : p.s,
        with_networks: (isMov || p.p === "ALL") ? "" : (NET_MAP[p.p] || p.p),
        with_genres: "16", // 严格锁定动画，排除真人
        with_original_language: "ja", // 锁定日本产
        with_status: p.st || undefined,
        [isMov ? "primary_release_year" : "first_air_date_year"]: p.y || undefined,
        region: "JP", // 日本首映对齐
        [isMov ? "primary_release_date.lte" : "first_air_date.lte"]: today,
        "vote_count.gte": (p.s === "latest" || p.y) ? 0 : 1
      },
      cacheTime: 3600
    });
    
    const items = (res?.results || []).map(r => formatItem(r, isMov));
    if (items.length > 0) Widget.storage.set(sKey, items);
    return items;
  } catch (e) {
    return Widget.storage.get(sKey) || [];
  }
}

async function moduleSearch(kw) {
  if (!kw) return [];
  try {
    const res = await Widget.tmdb.get("/search/multi", {
      params: { query: kw, language: "zh-CN", include_image_language: "null,zh,ja,en", region: "JP" },
      cacheTime: 3600
    });
    return (res?.results || [])
      .filter(r => (r.media_type === "tv" || r.media_type === "movie") && r.genre_ids?.includes(16) && r.origin_country?.includes("JP"))
      .map(r => formatItem(r, r.media_type === "movie"));
  } catch (e) { return []; }
}

function formatItem(r, isMov) {
  const d = r.first_air_date || r.release_date || "";
  const s = r.vote_average ? r.vote_average.toFixed(1) : "N/A";
  return {
    id: String(r.id),
    type: "tmdb",
    // 标题优先级：中译名 > 日文原名
    title: r.name || r.title || r.original_name || r.original_title,
    subtitle: `${d.split("-")[0] || ""} · ${s}分 · ${isMov ? '剧场版' : '番剧'}`,
    overview: r.overview || "暂无简介",
    posterPath: r.poster_path,   
    backdropPath: r.backdrop_path, 
    rating: r.vote_average,
    releaseDate: d,
    mediaType: isMov ? "movie" : "tv"
  };
}
