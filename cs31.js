// ===========================================
// Forward Widget: 全球日漫榜 (v66.0)
// 终极清洗：只看番剧、强制日文兜底、过滤垃圾数据
// ===========================================

WidgetMetadata = {
  "requiredVersion": "0.0.1",
  "id": "global.anime.ranking.pro",
  "title": "日漫榜单",
  "author": "Gemini",
  "version": "2.1.0",
  "description": "纯番剧/无英文/无垃圾数据",
  "site": "https://github.com/h05n/ForwardWidgets",
  "modules": [
    {
      "id": "animeRanking",
      "title": "最新日漫",
      "functionName": "moduleDiscover",
      // 【修复4】params留空，移除所有下拉选项
      "params": [] 
    }
  ]
};

// --- 逻辑层 (ES5标准) ---

async function moduleDiscover() {
  var today = new Date(Date.now() + 28800000).toISOString().split("T")[0];
  var sKey = "anime_v66_tv_only";

  var apiParams = {
    "language": "zh-CN",
    
    // 【修复2】图像锁死：无字 > 中文 > 日文
    "include_image_language": "null,zh,ja",
    
    // 强制只看番剧(tv)的最新(first_air_date.desc)
    "sort_by": "first_air_date.desc",
    "region": "JP",
    "with_networks": "", 
    "with_genres": "16",
    "with_original_language": "ja",
    "include_adult": false, // 过滤成人内容
    
    // 【修复5】过滤垃圾数据
    // 必须至少有1人评分，防止出现 "REST" 这种占位空壳
    "vote_count.gte": 1,
    
    // 限制时间，不显示未来太远的空饼
    "first_air_date.lte": today
  };

  try {
    var res = await Widget.tmdb.get("/discover/tv", {
      params: apiParams,
      cacheTime: 3600
    });
    
    var items = [];
    if (res && res.results) {
      items = res.results.map(formatItem);
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

function formatItem(r) {
  var d = r.first_air_date || "";
  var s = r.vote_average ? r.vote_average.toFixed(1) : "N/A";
  var year = d ? d.split("-")[0] : "";
  
  // 【修复3】标题强力清洗：绝对不显示英文
  // 1. 获取 TMDB 给的中文译名
  var title = r.name || "";
  var original = r.original_name || "";
  
  // 2. 检测：如果"中文译名"里完全没有汉字（说明 TMDB 回退到了英文），
  //    则强制使用日文原名
  var hasChinese = /[\u4e00-\u9fa5]/.test(title);
  if (!hasChinese && original) {
    title = original;
  }
  
  // 3. 最后的防线：如果连日文名都没有，才用原标题
  if (!title) title = r.original_name || "Unknown";

  return {
    "id": String(r.id),
    "type": "tmdb",
    "title": title,
    "subtitle": year + " · " + s + "分 · 番剧",
    "overview": r.overview || "暂无简介",
    "posterPath": r.poster_path,   
    "backdropPath": r.backdrop_path, 
    "rating": r.vote_average,
    "releaseDate": d,
    "mediaType": "tv" // 强制 TV
  };
}
