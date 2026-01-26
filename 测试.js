// ===========================================
// Forward Widget: 全球日漫榜 (Official Build v55.0)
// ===========================================

// 核心修复：使用小写开头的 widgetMetadata，并将 id 置于首位
const widgetMetadata = {
  id: "global.anime.ranking",
  title: "日漫榜单",
  author: "Gemini",
  description: "全量日漫：日本同步、无标题优先、极致精简 (v55.0)",
  version: "1.0.0",
  requiredVersion: "1.0.0",
  site: "https://github.com/h05n/ForwardWidgets",
  modules: [
    {
      id: "animeRanking",
      title: "日漫榜单",
      functionName: "moduleDiscover",
      params: [
        { name: "mt", title: "类型", type: "enumeration", value: "tv", enumOptions: [{ title: "番剧", value: "tv" }, { title: "剧场版", value: "movie" }] },
        { name: "y", title: "年份", type: "enumeration", value: "", enumOptions: [
          { title: "全部", value: "" }, { title: "2026", value: "2026" }, { title: "2025", value: "2025" }, { title: "2024", value: "2024" }, { title: "2023", value: "2023" }
        ]},
        { name: "st", title: "状态", type: "enumeration", value: "", enumOptions: [{ title: "全部", value: "" }, { title: "连载中", value: "0,1,2,4,5" }, { title: "已完结", value: "3" }] },
        { name: "p", title: "平台", type: "enumeration", value: "ALL", enumOptions: [
          { title: "全部(日本同步)", value: "ALL" }, { title: "国内聚合", value: "CN" }, { title: "B站", value: "1605" }, { title: "Netflix", value: "213" }
        ]},
        { name: "s", title: "排序", type: "enumeration", value: "popularity.desc", enumOptions: [
          { title: "最热", value: "popularity.desc" }, { title: "最新", value: "latest" }
        ]}
      ]
    },
    { id: "animeSearch", title: "全量搜索", functionName: "moduleSearch" }
  ]
};

// --- 功能逻辑层 ---

const MAP = { "CN": "1605|2007|1330" };
const STORAGE_PREFIX = "anime_storage_v55_";

async function moduleDiscover(p) {
  const isMov = p.mt === "movie";
  const today = new Date(Date.now() + 28800000).toISOString().split('T')[0];
  const storageKey = `${STORAGE_PREFIX}${p.mt}_${p.p}_${p.s}`;

  try {
    const res = await Widget.tmdb.get(isMov ? "/discover/movie" : "/discover/tv", {
      params: {
        language: "zh-CN",
        include_image_language: "null,zh,ja,en", // 五级审美：无标题 > 简/繁中 > 日 > 英
        sort_by: p.s === "latest" ? (isMov ? "release_date.desc" : "first_air_date.desc") : p.s,
        with_networks: (isMov || p.p === "ALL") ? "" : (MAP[p.p] || p.p),
        with_genres: "16",
        with_original_language: "ja",
        with_status: p.st || undefined,
        [isMov ? "primary_release_year" : "first_air_date_year"]: p.y || undefined,
        region: "JP",
        [isMov ? "primary_release_date.lte" : "first_air_date.lte"]: today,
        "vote_count.gte": (p.s === "latest" || p.y) ? 0 : 1
      },
      cacheTime: 3600
    });
    
    const items = (res?.results || []).map(r => formatItem(r, isMov));
    if (items.length > 0) Widget.storage.set(storageKey, items);
    return items;
  } catch (e) {
    return Widget.storage.get(storageKey) || [];
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
  const score = r.vote_average ? r.vote_average.toFixed(1) : "N/A";
  return {
    id: String(r.id),
    type: "tmdb",
    title: r.name || r.title || r.original_name || r.original_title, // 三级标题对齐
    subtitle: `${d.split("-")[0] || ""} · ${score}分 · ${isMov ? '剧场版' : '番剧'}`,
    overview: r.overview || "暂无简介",
    posterPath: r.poster_path,
    backdropPath: r.backdrop_path,
    rating: r.vote_average,
    releaseDate: d,
    mediaType: isMov ? "movie" : "tv"
  };
}
