var WidgetMetadata = {
  id: "forward.bilibili.rank.tmdb",
  title: "哔哩哔哩番剧榜",
  version: "1.1.0",
  requiredVersion: "0.0.1",
  description: "同步 B 站番剧/国创实时榜单，匹配 TMDB 影视元数据",
  author: "Forward",
  site: "https://github.com/InchStudio/ForwardWidgets",
  modules: [
    {
      id: "animeRank",
      title: "番剧榜单", // 日本/海外番剧
      functionName: "getBiliRank",
      params: [
        {
          name: "season_type",
          title: "类型",
          type: "constant",
          value: "1" // 固定为番剧
        },
        {
          name: "day",
          title: "排行周期",
          type: "enumeration",
          enumOptions: [
            { title: "三日榜", value: "3" },
            { title: "七日榜", value: "7" }
          ],
          value: "3"
        }
      ],
    },
    {
      id: "guochuangRank",
      title: "国创榜单", // 国产动画
      functionName: "getBiliRank",
      params: [
        {
          name: "season_type",
          title: "类型",
          type: "constant",
          value: "4" // 固定为国创
        },
        {
          name: "day",
          title: "排行周期",
          type: "enumeration",
          enumOptions: [
            { title: "三日榜", value: "3" },
            { title: "七日榜", value: "7" }
          ],
          value: "3"
        }
      ],
    }
  ]
};

/**
 * 核心逻辑 1：通过 B 站标题在 TMDB 中检索标准元数据
 */
async function searchTMDBItem(title) {
  try {
    // 优先搜索剧集 (TV)，符合番剧属性
    const response = await Widget.tmdb.get("search/tv", {
      params: {
        query: title,
        language: "zh-CN",
        include_adult: false
      }
    });

    if (response && response.results && response.results.length > 0) {
      const item = response.results[0]; // 选取匹配度最高的首项
      return {
        id: item.id,
        type: "tmdb",
        title: item.name || title,
        description: item.overview,
        posterPath: item.poster_path,
        backdropPath: item.backdrop_path,
        releaseDate: item.first_air_date,
        rating: item.vote_average,
        mediaType: "tv" // 强制标识为剧集
      };
    }
  } catch (error) {
    console.error(`TMDB 匹配失败 [${title}]:`, error);
  }
  return null;
}

/**
 * 核心逻辑 2：抓取 B 站榜单并进行数据转换
 */
async function getBiliRank(params) {
  try {
    const url = "https://api.bilibili.com/pgc/web/rank/list";
    const response = await Widget.http.get(url, {
      params: {
        day: params.day,
        season_type: params.season_type
      },
      headers: {
        "Referer": "https://www.bilibili.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!response || response.data.code !== 0) {
      throw new Error("无法连接至 Bilibili 接口");
    }

    const rawList = response.data.result.list || [];

    // --- 严苛过滤逻辑 ---
    // 1. 过滤 B 站榜单中的真人/特摄内容
    const blackList = ["真人", "特摄", "奥特曼", "假面骑士", "电视剧", "真人版", "电影版"];
    const animeTitles = rawList
      .filter(item => {
        const title = item.title || "";
        return !blackList.some(key => title.includes(key));
      })
      .slice(0, 15) // 限制处理前 15 条以保证首页加载性能
      .map(item => item.title);

    // 2. 将 B 站标题并发映射为 TMDB 数据对象
    const tmdbResults = await Promise.all(
      animeTitles.map(title => searchTMDBItem(title))
    );

    // 3. 剔除匹配失败的项目，返回纯净的 TMDB 数组
    return tmdbResults.filter(result => result !== null);

  } catch (error) {
    console.error("模块执行异常:", error);
    throw error;
  }
}
