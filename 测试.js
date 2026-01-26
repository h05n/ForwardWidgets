WidgetMetadata = {
  "id": "bangdan",
  "title": "番剧榜单",
  "version": "1.0.0",
  "requiredVersion": "0.0.1",
  "description": "最新番剧",
  "author": "，",
  "site": "https://github.com/h05n/ForwardWidgets",
  "modules": [{
    "id": "animeRanking",
    "title": "最新番剧",
    "functionName": "moduleDiscover",
    "params": [{ "name": "page", "title": "页码", "type": "page", "startPage": 1 }]
  }]
};

async function moduleDiscover(p) {
  const page = p.page || 1;
  const sKey = "anime_min_p" + page;
  
  try {
    const res = await Widget.tmdb.get("/discover/tv", {
      params: {
        "language": "zh-CN",
        "include_image_language": "null,zh,ja",
        "sort_by": "first_air_date.desc",
        "region": "JP",
        "with_genres": "16",
        "with_original_language": "ja",
        "include_adult": false,
        "vote_count.gte": 3,
        "first_air_date.lte": new Date(Date.now() + 288e5).toISOString().split("T")[0],
        "page": page
      }
    });

    if (res && res.results) {
      const items = res.results.filter(r => r.poster_path).map(formatItem);
      if (items.length) Widget.storage.setItem(sKey, items);
      return items;
    }
  } catch (e) {}
  
  return Widget.storage.getItem(sKey) || [];
}

function formatItem(r) {
  let t = r.name || "", o = r.original_name;
  if (o && !/[\u4e00-\u9fa5]/.test(t)) t = o;
  
  return {
    "id": "tv." + r.id,
    "type": "tmdb",
    "title": t || "Unknown",
    "subtitle": (r.first_air_date || "").split("-")[0] + " · 番剧",
    "posterPath": r.poster_path,
    "backdropPath": r.backdrop_path,
    "coverRatio": 0.67,
    "releaseDate": r.first_air_date,
    "mediaType": "tv"
  };
}
