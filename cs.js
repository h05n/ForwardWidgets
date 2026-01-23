var WidgetMetadata = {
  id: "forward.bilibili.bangumi",
  title: "哔哩哔哩番剧",
  version: "1.0.3",
  requiredVersion: "0.0.1",
  description: "获取 Bilibili 的番剧榜单与分类索引数据",
  author: "Forward",
  site: "https://github.com/InchStudio/ForwardWidgets",
  modules: [
    {
      id: "animeRank",
      title: "番剧排行",
      functionName: "getAnimeRank",
      params: [
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
      id: "animeIndex",
      title: "番剧索引",
      functionName: "getAnimeIndex",
      params: [
        {
          name: "area",
          title: "地区",
          type: "enumeration",
          enumOptions: [
            { title: "全部", value: "-1" },
            { title: "日本", value: "2" },
            { title: "国产", value: "1" },
            { title: "美国", value: "3" }
          ],
          value: "-1"
        },
        {
          name: "style_id",
          title: "风格",
          type: "enumeration",
          enumOptions: [
            { title: "全部", value: "-1" },
            { title: "热血", value: "999" },
            { title: "奇幻", value: "1002" },
            { title: "科幻", value: "1004" },
            { title: "恋爱", value: "1001" },
            { title: "搞笑", value: "1010" }
          ],
          value: "-1"
        },
        {
          name: "page",
          title: "页码",
          type: "page",
          value: "1"
        }
      ],
    }
  ]
};

/**
 * 核心请求与数据转换方法
 * 参考自 tmdb.js 的 fetchData 逻辑
 */
async function fetchBangumiData(url, params = {}) {
  try {
    const response = await Widget.http.get(url, {
      params: params,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://www.bilibili.com/anime/"
      }
    });

    if (!response || response.data.code !== 0) {
      throw new Error(response?.data?.message || "获取番剧数据失败");
    }

    const list = response.data.data.list || [];

    return list.map((item) => {
      return {
        id: item.season_id || item.ss_id,
        type: "url", 
        title: item.title || "未知标题",
        description: item.index_show || item.new_ep?.index_show || item.desc || item.styles,
        posterPath: item.cover,
        rating: item.rating || item.score || "",
        mediaType: "tv", // 番剧统一标识为剧集类型
        link: `https://www.bilibili.com/bangumi/play/ss${item.season_id || item.ss_id}`,
      };
    });
  } catch (error) {
    console.error("Bilibili API 调用失败:", error);
    throw error;
  }
}

// 1. 获取番剧排行
async function getAnimeRank(params) {
  const url = "https://api.bilibili.com/pgc/web/rank/list";
  // season_type: 1 为番剧
  return await fetchBangumiData(url, { day: params.day, season_type: 1 });
}

// 2. 获取番剧索引（分类筛选）
async function getAnimeIndex(params) {
  const url = "https://api.bilibili.com/pgc/season/index/result";
  const query = {
    season_type: 1,
    area: params.area,
    style_id: params.style_id,
    page: params.page,
    pagesize: 20,
    type: 1,
    order: 3, // 默认按播放量排序
    st: 1,
    sort: 0
  };
  return await fetchBangumiData(url, query);
}
