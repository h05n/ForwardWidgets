WidgetMetadata = {
  id: "forward.bangumi",
  title: "动漫数据",
  version: "1.1.0",
  requiredVersion: "0.0.1",
  description: "获取时下热门动漫数据和播出日历（字段归一、ID唯一、自动排序）",
  author: "Forward",
  site: "https://github.com/InchStudio/ForwardWidgets",
  modules: [
    {
      id: "dailySchedule",
      title: "每日播出",
      functionName: "dailySchedule",
      params: [
        {
          name: "day",
          title: "星期",
          type: "enumeration",
          enumOptions: [
            { title: "今天", value: "today" },
            { title: "星期一", value: "星期一" },
            { title: "星期二", value: "星期二" },
            { title: "星期三", value: "星期三" },
            { title: "星期四", value: "星期四" },
            { title: "星期五", value: "星期五" },
            { title: "星期六", value: "星期六" },
            { title: "星期日", value: "星期日" }
          ]
        },
        {
          name: "maxItems",
          title: "最大数量",
          type: "number",
          optional: true
        }
      ]
    },
    {
      id: "trending",
      title: "近期注目",
      functionName: "trending",
      params: [
        {
          name: "maxItems",
          title: "最大数量",
          type: "number",
          optional: true
        }
      ]
    }
  ]
};

// 工具方法：字段归一化
function normalizeTmdbInfo(tmdb) {
  if (!tmdb || typeof tmdb !== 'object') return {};
  return {
    id: tmdb.id || tmdb.tmdb_id || "",
    title: tmdb.title || tmdb.name || "",
    originalTitle: tmdb.original_title || tmdb.originalName || tmdb.originalTitle || "",
    description: tmdb.overview || tmdb.description || "",
    releaseDate: tmdb.release_date || tmdb.first_air_date || "",
    backdropPath: tmdb.backdrop_path || tmdb.backdropPath || tmdb.backdrop || "",
    posterPath: tmdb.poster_path || tmdb.posterPath || tmdb.poster || "",
    rating: tmdb.vote_average || tmdb.rating || 0,
    mediaType: tmdb.media_type || tmdb.mediaType || "tv",
    popularity: tmdb.popularity || 0,
    voteCount: tmdb.vote_count || tmdb.voteCount || 0,
    seasonInfo: tmdb.seasonInfo || tmdb.seasons || ""
  };
}

// 工具方法：ID 稳定/兼容
function generateStableId(str) {
  if (!str) return 'id_null';
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return 'id_' + (hash >>> 0).toString(16);
}

// 数据格式化
function formatAnimeData(animeList) {
  if (!Array.isArray(animeList)) return [];
  return animeList.filter(item => item && item.bangumi_name && item.bangumi_url).map(item => {
    const tmdb = normalizeTmdbInfo(item.tmdb_info);
    return {
      id: tmdb.id || generateStableId(item.bangumi_url),
      type: "bangumi",
      title: item.bangumi_name || tmdb.title,
      description: item.description || tmdb.description || "",
      releaseDate: item.releaseDate || tmdb.releaseDate || "",
      backdropPath: item.backdropPath || tmdb.backdropPath || "",
      posterPath: item.posterPath || tmdb.posterPath || "",
      rating: item.rating || tmdb.rating || 0,
      mediaType: item.mediaType || tmdb.mediaType || "tv",
      genreTitle: item.genreTitle || tmdb.genreTitle || "",
      bangumiUrl: item.bangumi_url,
      tmdbInfo: tmdb,
      hasTmdb: !!tmdb.id,
      seasonInfo: item.seasonInfo || tmdb.seasonInfo || "",
      originalTitle: item.originalTitle || tmdb.originalTitle || "",
      popularity: item.popularity || tmdb.popularity || 0,
      voteCount: item.voteCount || tmdb.voteCount || 0,
      bangumiRating: item.bangumi_rating || 0,
      bangumiRank: item.bangumi_rank || 0
    };
  });
}

function formatTrendingData(list) {
  if (!Array.isArray(list)) return [];
  return formatAnimeData(list)
    .sort((a, b) => (a.bangumiRank || a.popularity || 0) - (b.bangumiRank || b.popularity || 0));
}

function getAnimeByDay(data, day, maxItems = 50) {
  const weekMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  let key = day;
  if (!day || day === "today") key = weekMap[new Date().getDay()];
  return Array.isArray(data[key]) ? data[key].slice(0, maxItems) : [];
}

// --- 主流程：数据获取 ---
async function fetchBangumiData() {
  try {
    const latestUrl = "https://assets.vvebo.vip/scripts/datas/latest.json";
    const response = await Widget.http.get(latestUrl);
    if (response && response.data) return response.data;
  } catch (error) {
    console.log("获取 latest.json 失败，尝试按日期获取:", error.message);
  }
  const maxRetries = 7;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2,'0')}${d.getDate().toString().padStart(2,'0')}`;
      const dataUrl = `https://assets.vvebo.vip/scripts/datas/bangumi_enriched_${dateStr}.json`;
      const response = await Widget.http.get(dataUrl);
      if (response && response.data) return response.data;
    } catch (error) {
      console.log(`获取 ${dateStr} 的数据失败:`, error.message);
    }
  }
  return {
    "星期一": [],
    "星期二": [],
    "星期三": [],
    "星期四": [],
    "星期五": [],
    "星期六": [],
    "星期日": []
  };
}

async function fetchTrendingData() {
  try {
    const latestUrl = "https://assets.vvebo.vip/scripts/datas/latest_bangumi_trending.json";
    const response = await Widget.http.get(latestUrl);
    if (response && response.data) return response.data;
  } catch (error) {
    console.log("获取 latest_bangumi_trending.json 失败:", error.message);
  }
  return [];
}

// --- 核心调用方法 ---
async function dailySchedule(params = {}) {
  const data = await fetchBangumiData();
  const day = params.day || "today";
  const maxItems = params.maxItems || 50;
  return formatAnimeData(getAnimeByDay(data, day, maxItems));
}
async function trending(params = {}) {
  const data = await fetchTrendingData();
  const maxItems = params.maxItems || 50;
  return formatTrendingData(data).slice(0, maxItems);
}
