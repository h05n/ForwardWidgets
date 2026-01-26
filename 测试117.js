// ===========================================
// Forward Widget: 全球日漫榜 (v61.0)
// 修复：参数排序完全对齐官方 (类型-平台-排序-年份-状态)
// ===========================================

WidgetMetadata = {
  "requiredVersion": "0.0.1",
  "id": "global.anime.ranking.pro",
  "title": "日漫榜单",
  "author": "Gemini",
  "version": "1.6.0",
  "description": "官方排序/无标题优先/全量缓存",
  "site": "https://github.com/h05n/ForwardWidgets",
  "modules": [
    {
      "id": "animeRanking",
      "title": "榜单浏览",
      "functionName": "moduleDiscover",
      "params": [
        // 1. 核心维度：类型 (TV/Movie)
        { "name": "mt", "title": "类型", "type": "enumeration", "value": "tv", "enumOptions": [{ "title": "番剧", "value": "tv" }, { "title": "剧场版", "value": "movie" }] },
        // 2. 核心维度：平台 (B站/Netflix等) - 官方通常放第二位
        { "name": "p", "title": "平台", "type": "enumeration", "value": "ALL", "enumOptions": [{ "title": "全部(日本同步)", "value": "ALL" }, { "title": "国内聚合", "value": "CN" }, { "title": "B站", "value": "1605" }, { "title": "Netflix", "value": "213" }] },
        // 3. 核心维度：排序 (最热/最新)
        { "name": "s", "title": "排序", "type": "enumeration", "value": "popularity.desc", "enumOptions": [{ "title": "最热", "value": "popularity.desc" }, { "title": "最新", "value": "latest" }] },
        // 4. 筛选维度：年份
        { "name": "y", "title": "年份", "type": "enumeration", "value": "", "enumOptions": [{ "title": "全部", "value": "" }, { "title": "2026", "value": "2026" }, { "title": "2025", "value": "2025" }, { "title": "2024", "value": "2024" }] },
        // 5. 筛选维度：状态
        { "name": "st", "title": "状态", "type": "enumeration", "value": "", "enumOptions": [{ "title": "全部", "value": "" }, { "title": "连载中", "value": "0,1,2,4,5" }, { "title": "已完结", "value": "3" }] }
      ]
    },
    { "id": "animeSearch", "title": "全量搜索", "functionName": "moduleSearch" }
  ]
};

// --- 逻辑层 (ES5 Standard) ---
var MAP = { "CN": "1605|2007|1330" };

async function moduleDiscover(p) {
  var isMov = p.mt === "movie";
  // ES5 字符串拼接
  var today = new Date(Date.now() + 28800000).toISOString().split("T")[0];
  var sKey = "anime_v61_" + p.mt + "_" + p.p + "_" + p.s;

  var apiParams = {
    "language": "zh-CN",
    "include_image_language": "null,zh,ja,en",
    "sort_by": p.s === "latest" ? (isMov ? "release_date.desc" : "first_air_date.desc") : p.s,
    "with_networks": (isMov || p.p === "ALL") ? "" : (MAP[p.p] || p.p),
    "with_genres": "16",
    "with_original_language": "ja",
    "with_status": p.st || undefined,
    "region": "JP",
    "vote_count.gte": (p.s === "latest" || p.y) ? 0 : 1
  };

  // 动态 Key 兼容写法
  if (isMov) {
    apiParams["primary_release_year"] = p.y || undefined;
    apiParams["primary_release_date.lte"] = today;
  } else {
    apiParams["first_air_date_year"] = p.y || undefined;
    apiParams["first_air_date.lte"] = today;
  }

  try {
    var res = await Widget.tmdb.get(isMov ? "/discover/movie" : "/discover/tv", {
      params: apiParams,
      cacheTime: 3600
    });
    
    var items = [];
    if (res && res.results) {
      items = res.results.map(function(r) { return formatItem(r, isMov); });
    }
    
    if (items.length > 0) { 
      Widget.storage.set(sKey, items); 
    }
    return items;
  } catch (e) {
    var cached = Widget.storage.get(sKey);
    return cached || [];
  }
}

async function moduleSearch(kw) {
  if (!kw) return [];
  try {
    var res = await Widget.tmdb.get("/search/multi", {
      params: { 
        "query": kw, 
        "language": "zh-CN", 
        "include_image_language": "null,zh,ja,en", 
        "region": "JP" 
      },
      cacheTime: 3600
    });
    
    var results = (res && res.results) ? res.results : [];
    return results.filter(function(r) {
      var isAnime = r.genre_ids && r.genre_ids.indexOf(16) > -1;
      var isJP = r.origin_country && r.origin_country.indexOf("JP") > -1;
      var isValidType = r.media_type === "tv" || r.media_type === "movie";
      return isValidType && isAnime && isJP;
    }).map(function(r) { 
      return formatItem(r, r.media_type === "movie"); 
    });
  } catch (e) { return []; }
}

function formatItem(r, isMov) {
  var d = r.first_air_date || r.release_date || "";
  var s = r.vote_average ? r.vote_average.toFixed(1) : "N/A";
  var year = d ? d.split("-")[0] : "";
  
  return {
    "id": String(r.id),
    "type": "tmdb",
    "title": r.name || r.title || r.original_name || r.original_title,
    "subtitle": year + " · " + s + "分 · " + (isMov ? "剧场版" : "番剧"),
    "overview": r.overview || "暂无简介",
    "posterPath": r.poster_path,   
    "backdropPath": r.backdrop_path, 
    "rating": r.vote_average,
    "releaseDate": d,
    "mediaType": isMov ? "movie" : "tv"
  };
}
