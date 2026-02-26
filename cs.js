WidgetMetadata = {
  id: "dongman",
  title: "动漫模块",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "动态获取不同年份、季度及全年的动漫数据",
  author: "，",
  site: "https://github.com/h05n/ForwardWidgets",
  detailCacheDuration: 86400, // 详情页原生缓存 24 小时
  modules: [
    {
      id: "animeData",
      title: "动漫列表",
      functionName: "getAnimeData",
      cacheDuration: 86400, // 列表原生缓存 24 小时，彻底利用官方特性
      params: [
        {
          name: "tmdbToken",
          title: "TMDB Token",
          type: "input",
          description: "必填：请填写 TMDB 的 API Read Access Token"
        },
        {
          name: "yearOffset",
          title: "年份",
          type: "enumeration",
          enumOptions: [
            { title: "今年", value: "0" },
            { title: "去年", value: "-1" },
            { title: "前年", value: "-2" }
          ]
        },
        {
          name: "timeRange",
          title: "时间范围",
          type: "enumeration",
          enumOptions: [
            { title: "全年", value: "year" },
            { title: "春季", value: "spring" },
            { title: "夏季", value: "summer" },
            { title: "秋季", value: "fall" },
            { title: "冬季", value: "winter" }
          ]
        }
      ]
    }
  ]
};

// --- 唯一核心处理函数 ---

async function getAnimeData(params) {
  // 1. 拦截空 Token
  if (!params.tmdbToken) {
    throw new Error("请在参数设置中填写 TMDB Token");
  }

  // 2. 动态年份与起止日期计算 (极致精简写法)
  const year = new Date().getFullYear() + parseInt(params.yearOffset || "0", 10);
  const range = params.timeRange || "year";
  
  let start, end;
  if (range === "year") {
    start = `${year}-01-01`;
    end = `${year}-12-31`;
  } else {
    // 映射四季对应的月日
    const months = { spring: ["04-01", "06-30"], summer: ["07-01", "09-30"], fall: ["10-01", "12-31"], winter: ["01-01", "03-31"] };
    start = `${year}-${months[range][0]}`;
    end = `${year}-${months[range][1]}`;
  }

  // 3. 构造请求参数 (全年榜单自动附加投票数过滤)
  let query = `with_genres=16&with_original_language=ja&first_air_date.gte=${start}&first_air_date.lte=${end}&sort_by=popularity.desc`;
  if (range === "year") query += "&vote_count.gte=50";

  // 4. 网络请求与数据映射 (自带安全捕获)
  try {
    const response = await Widget.http.get(`https://api.themoviedb.org/3/discover/tv?language=zh-CN&${query}`, {
      headers: {
        "Authorization": `Bearer ${params.tmdbToken.trim()}`,
        "Accept": "application/json"
      }
    });

    if (response && response.data && Array.isArray(response.data.results)) {
      return response.data.results.map(item => ({
        id: `tv.${item.id}`,
        type: "tmdb",
        title: item.name || item.original_name || "",
        description: item.overview || "",
        posterPath: item.poster_path || "",
        backdropPath: item.backdrop_path || "",
        releaseDate: item.first_air_date || "",
        rating: item.vote_average ? String(item.vote_average) : "0",
        mediaType: "tv",
        genreTitle: "动画",
        popularity: item.popularity || 0,
        voteCount: item.vote_count || 0
      }));
    }
  } catch (error) {
    // 网络错误或解析失败时静默拦截，依靠底部的空数组兜底
  }
  
  return [];
}
