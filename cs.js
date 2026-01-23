var WidgetMetadata = {
  id: "forward.bilibili.bangumi",
  title: "哔哩哔哩番剧",
  version: "1.0.4",
  requiredVersion: "0.0.1",
  description: "获取 Bilibili 的番剧与国创榜单，支持分类筛选并过滤真人内容",
  author: "Forward",
  site: "https://github.com/InchStudio/ForwardWidgets",
  modules: [
    {
      id: "animeRank",
      title: "番剧排行",
      functionName: "getAnimeRank",
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
        },
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
      ],
    },
    {
      id: "animeIndex",
      title: "番剧索引",
      functionName: "getAnimeIndex",
      params: [
        {
          name: "season_type",
          title: "大类",
          type: "enumeration",
          enumOptions: [
            { title: "番剧", value: "1" },
            { title: "国创", value: "4" }
          ],
          value: "1"
        },
        {
          name: "area",
          title: "地区",
          type: "enumeration",
          enumOptions: [
            { title: "全部", value: "-1" },
            { title: "日本", value: "2" },
            { title: "国产", value: "1" },
            { title: "美国", value: "3" },
            { title: "其他", value: "5" }
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
            { title: "搞笑", value: "1010" },
            { title: "日常", value: "1009" },
            { title: "科幻", value: "1004" },
            { title: "治愈", value: "1023" },
            { title: "校园", value: "1003" }
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
 * 核心请求与过滤转换方法
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
      throw new Error(response?.data?.message || "获取数据失败");
    }

    // 兼容排行和索引接口的数据位置
    let list = response.data.data.list || response.data.result || [];

    // --- 关键修改：真人内容过滤逻辑 ---
    // 过滤掉标题或描述中包含“真人”、“特摄”、“剧场版”等可能涉及真人的词汇
    // 同时过滤掉 B 站某些电影/电视剧分类误入的内容
    const filteredList = list.filter(item => {
      const title = (item.title || "").toLowerCase();
      const desc = (item.index_show || item.desc || "").toLowerCase();
      const styles = (item.styles || "").toLowerCase();
      
      const liveActionKeywords = ["真人", "特摄", "奥特曼", "假面骑士", "电视剧", "真人版"];
      return !liveActionKeywords.some(key => title.includes(key) || desc.includes(key) || styles.includes(key));
    });

    return filteredList.map((item) => {
      return {
        id: item.season_id || item.ss_id,
        type: "url", 
        title: item.title || "未知标题",
        description: item.index_show || item.new_ep?.index_show || item.styles || "",
        posterPath: item.cover,
        rating: item.rating || item.score || "",
        mediaType: "tv",
        link: `https://www.bilibili.com/bangumi/play/ss${item.season_id || item.ss_id}`,
      };
    });
  } catch (error) {
    console.error("Bilibili 模块执行失败:", error);
    throw error;
  }
}

// 1. 获取排行 (支持番剧/国创切换)
async function getAnimeRank(params) {
  const url = "https://api.bilibili.com/pgc/web/rank/list";
  return await fetchBangumiData(url, { 
    day: params.day, 
    season_type: params.season_type 
  });
}

// 2. 获取索引筛选
async function getAnimeIndex(params) {
  const url = "https://api.bilibili.com/pgc/season/index/result";
  const query = {
    season_type: params.season_type,
    area: params.area,
    style_id: params.style_id,
    page: params.page,
    pagesize: 20,
    type: 1,
    order: 3, 
    st: 1,
    sort: 0
  };
  return await fetchBangumiData(url, query);
}
