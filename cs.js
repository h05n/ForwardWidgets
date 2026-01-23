var WidgetMetadata = {
  id: "forward.bilibili.tmdb",
  title: "哔哩哔哩榜单",
  version: "1.0.8",
  requiredVersion: "0.0.1",
  description: "基于 B 站榜单索引，关联 TMDB 高清数据模型",
  author: "Forward",
  site: "https://github.com/InchStudio/ForwardWidgets",
  modules: [
    {
      id: "popular",
      title: "热门动漫",
      functionName: "getPopular",
      params: [
        {
          name: "season_type",
          title: "类型",
          type: "enumeration",
          enumOptions: [
            { title: "番剧(海外)", value: "1" },
            { title: "国创(国产)", value: "4" }
          ],
          value: "1"
        }
      ]
    },
    {
      id: "rank",
      title: "番剧排行",
      functionName: "getRank",
      params: [
        {
          name: "day",
          title: "周期",
          type: "enumeration",
          enumOptions: [
            { title: "三日榜", value: "3" },
            { title: "七日榜", value: "7" }
          ],
          value: "3"
        }
      ]
    }
  ]
};

/**
 * 辅助函数：通过标题搜索 TMDB 的 ID
 * 这样可以确保首页组件能获取到真正的视频元数据
 */
async function mapToTMDB(title) {
  try {
    // 调用内置 TMDB 搜索接口，锁定搜索 TV 剧集
    const searchRes = await Widget.tmdb.get("search/tv", {
      params: { query: title, language: "zh-CN" }
    });
    
    if (searchRes && searchRes.results && searchRes.results.length > 0) {
      const item = searchRes.results[0]; // 取最匹配的一个
      return {
        id: item.id,
        type: "tmdb",
        title: item.name || title,
        description: item.overview,
        posterPath: item.poster_path,
        backdropPath: item.backdrop_path,
        rating: item.vote_average,
        releaseDate: item.first_air_date,
        mediaType: "tv"
      };
    }
  } catch (e) {
    console.error(`TMDB 匹配失败: ${title}`, e);
  }
  return null;
}

/**
 * 核心逻辑：从 B 站取榜单名，转为 TMDB 对象
 */
async function fetchAndConvert(url, params) {
  const response = await Widget.http.get(url, {
    params: params,
    headers: { "Referer": "https://www.bilibili.com/" }
  });

  if (!response || response.data.code !== 0) throw new Error("B 站源获取失败");

  const list = response.data.result?.list || response.data.data?.list || [];
  
  // 过滤掉特摄等真人内容
  const blackList = ["真人", "特摄", "奥特曼", "假面骑士", "电视剧"];
  const titles = list
    .filter(item => !blackList.some(k => (item.title || "").includes(k)))
    .slice(0, 15) // 限制条数以保证搜索效率
    .map(item => item.title);

  // 并发搜索 TMDB 匹配信息
  const results = await Promise.all(titles.map(title => mapToTMDB(title)));
  
  // 过滤掉没匹配上的，返回标准模型
  return results.filter(item => item !== null);
}

// 热门
async function getPopular(params) {
  const url = "https://api.bilibili.com/pgc/web/rank/list";
  return await fetchAndConvert(url, { season_type: params.season_type, day: 3 });
}

// 排行
async function getRank(params) {
  const url = "https://api.bilibili.com/pgc/web/rank/list";
  return await fetchAndConvert(url, { day: params.day, season_type: 1 });
}
