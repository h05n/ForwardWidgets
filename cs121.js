// ===========================================
// Forward Widget: 全球日漫榜 (v65.0)
// 终极纯净：移除所有废弃变量，纯ES5语法，无const/var修饰
// ===========================================

WidgetMetadata = {
  "requiredVersion": "0.0.1",
  "id": "global.anime.ranking.pro",
  "title": "日漫榜单",
  "author": "Gemini",
  "version": "2.0.0",
  "description": "极简/无残留/原产地兜底",
  "site": "https://github.com/h05n/ForwardWidgets",
  "modules": [
    {
      "id": "animeRanking",
      "title": "榜单浏览",
      "functionName": "moduleDiscover",
      "params": [
        // 既然是极简，只保留这唯一的一个核心参数
        { "name": "mt", "title": "类型", "type": "enumeration", "value": "tv", "enumOptions": [{ "title": "番剧", "value": "tv" }, { "title": "剧场版", "value": "movie" }] }
      ]
    },
    { "id": "animeSearch", "title": "全量搜索", "functionName": "moduleSearch" }
  ]
};

// --- 逻辑层 (已清理所有未使用的全局变量) ---

async function moduleDiscover(p) {
  var isMov = p.mt === "movie";
  var today = new Date(Date.now() + 28800000).toISOString().split("T")[0];
  
  // 缓存Key：极简模式下只依赖 mt
  var sKey = "anime_v65_clean_" + p.mt;

  var apiParams = {
    "language": "zh-CN",
    
    // 【图像兜底】无字 > 中文 > 日文 (绝对无英文)
    "include_image_language": "null,zh,ja", 
    
    // 【排序】强制最新 (时间倒序)
    "sort_by": isMov ? "release_date.desc" : "first_air_date.desc",
    
    // 【区域】强制日本同步
    "region": "JP",
    
    // 【筛选】只看动画，日本原产，全平台
    "with_genres": "16",
    "with_original_language": "ja",
    "with_networks": "", 
    
    // 【防过滤】允许0评分的新番
    "vote_count.gte": 0 
  };

  // 仅保留防止显示“未来番剧”的逻辑
  if (isMov) {
    apiParams["primary_release_date.lte"] = today;
  } else {
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
    // 读取缓存兜底
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
        "include_image_language": "null,zh,ja", 
        "region": "JP" 
      },
      cacheTime: 3600
    });
    
    var results = (res && res.results) ? res.results : [];
    
    return results.filter(function(r) {
      // 兼容性过滤：必须是日本(JP)的动画(16)
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
  
  // 【标题兜底】中文 > 日文原名 (绝对无英文)
  var finalTitle = r.name || r.title || r.original_name || r.original_title;

  return {
    "id": String(r.id),
    "type": "tmdb",
    "title": finalTitle,
    "subtitle": year + " · " + s + "分 · " + (isMov ? "剧场版" : "番剧"),
    "overview": r.overview || "暂无简介",
    "posterPath": r.poster_path,   
    "backdropPath": r.backdrop_path, 
    "rating": r.vote_average,
    "releaseDate": d,
    "mediaType": isMov ? "movie" : "tv"
  };
}
