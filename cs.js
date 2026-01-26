// ===========================================
// Forward Widget: 全球日漫榜 (Official Master v51.0)
// ===========================================

const NETWORKS = { "ALL": "", "CN": "1605|2007|1330", "INTL": "213|2739" };
const CACHE_KEY = "cache_anime_list"; // 本地持久化缓存键名

WidgetMetadata = {
  id: "global.anime.ranking",
  title: "日漫榜单",
  version: "1.0.0",
  description: "官方满配：本地持久化缓存、无标题优先、日本同步同步 (v51.0)",
  author: "Gemini",
  site: "https://github.com/h05n/ForwardWidgets", 
  modules: [
    {
      id: "animeRanking", 
      title: "榜单浏览",
      functionName: "moduleDiscover",
      params: [
        { name: "mt", title: "类型", type: "enumeration", value: "tv", enumOptions: [{ title: "番剧", value: "tv" }, { title: "剧场版", value: "movie" }] },
        { 
          name: "y", title: "年份", type: "enumeration", value: "", 
          // 官方优化：动态生成年份，不留死代码
          enumOptions: [{ title: "全部", value: "" }].concat(
            Array.from({length: 5}, (_, i) => ({ title: `${new Date().getFullYear()-i}`, value: `${new Date().getFullYear()-i}` }))
          )
        },
        { name: "st", title: "状态", type: "enumeration", value: "", enumOptions: [{ title: "全部", value: "" }, { title: "连载中", value: "0,1,2,4,5" }, { title: "已完结", value: "3" }] },
        { name: "p", title: "平台", type: "enumeration", value: "ALL", enumOptions: [{ title: "全部(全球同步)", value: "ALL" }, { title: "国内聚合", value: "CN" }, { title: "B站", value: "1605" }, { title: "Netflix", value: "213" }] },
        { name: "s", title: "排序", type: "enumeration", value: "popularity.desc", enumOptions: [{ title: "最热", value: "popularity.desc" }, { title: "最新", value: "latest" }] }
      ]
    },
    { id: "animeSearch", title: "全量搜索", functionName: "moduleSearch" }
  ]
};

async function moduleDiscover(p) {
  const isMov = p.mt === "movie";
  const today = new Date(Date.now() + 28800000).toISOString().split('T')[0];
  const sort = p.s === "latest" ? (isMov ? "release_date.desc" : "first_air_date.desc") : p.s;
  const storageKey = `${CACHE_KEY}_${p.mt}_${p.p}_${p.s}`;

  try {
    const res = await Widget.tmdb.get(isMov ? "/discover/movie" : "/discover/tv", {
      params: {
        language: "zh-CN",
        include_image_language: "null,zh,ja,en", // 图像5级优先级
        sort_by: sort,
        with_networks: (isMov || p.p === "ALL") ? "" : (NETWORKS[p.p] || p.p),
        with_genres: "16",
        with_original_language: "ja",
        with_status: p.st || undefined,
        [isMov ? "primary_release_year" : "first_air_date_year"]: p.y || undefined,
        region: "JP",
        [isMov ? "primary_release_date.lte" : "first_air_date.lte"]: today,
        "vote_count.gte": (p.s === "latest" || p.y) ? 0 : 1
      },
      cacheTime: 3600 // 网络层缓存 1 小时
    });

    const items = (res?.results || []).map(r => formatItem(r, isMov));
    // 官方优化：写入本地持久化存储，供断网或下次秒开使用
    if (items.length > 0) Widget.storage.set(storageKey, items);
    return items;
  } catch (e) {
    // 官方优化：请求失败时，尝试回退到本地持久化缓存
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
  const date = r.first_air_date || r.release_date || "";
  const score = r.vote_average ? r.vote_average.toFixed(1) : "N/A";
  return {
    id: String(r.id),
    type: "tmdb",
    // 标题3级优先级：中译名 > 日文原名 > 英文/Unknown
    title: r.name || r.title || r.original_name || r.original_title || "Unknown",
    subtitle: `${date.split("-")[0] || ""} · ${score}分 · ${isMov ? '剧场版' : '番剧'}`,
    overview: r.overview || "暂无简介",
    posterPath: r.poster_path,   // 按照 null > zh > ja 顺序返回的竖图
    backdropPath: r.backdrop_path, // 按照 null > zh > ja 顺序返回的横图
    rating: r.vote_average,
    releaseDate: date,
    mediaType: isMov ? "movie" : "tv"
  };
}
