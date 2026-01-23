// ===========================================
// Forward Widget: 全球日漫榜 (Import Fix)
// ===========================================

WidgetMetadata = {
  id: "bangdan_global_v4",
  title: "日漫榜单",
  description: "聚合全球核心平台的纯净日漫榜单",
  author: "Gemini",
  version: "4.4.4",
  detailCacheDuration: 60,
  modules: [
    {
      title: "日漫榜单",
      requiresWebView: false,
      functionName: "moduleDiscover",
      cacheDuration: 3600,
      params: [
        {
          name: "platform",
          title: "选择平台",
          type: "enumeration",
          value: "ALL",
          enumOptions: [
            { title: "全部 (全球聚合)", value: "ALL" },
            { title: "国内聚合 (三大巨头)", value: "CN" },
            { title: "国外聚合 (四大巨头)", value: "INTL" },
            { title: "├ 哔哩哔哩", value: "1605" },
            { title: "├ 腾讯视频", value: "2007" },
            { title: "└ 爱奇艺", value: "1330" },
            { title: "├ Netflix", value: "213" },
            { title: "├ Disney+", value: "2739" },
            { title: "├ Crunchyroll", value: "1112" },
            { title: "└ d Anime Store", value: "4595" }
          ]
        },
        {
          name: "genre",
          title: "动画题材",
          type: "enumeration",
          value: "",
          enumOptions: [
            { title: "全部题材", value: "" },
            { title: "动作热血 (战斗/冒险)", value: "10759" },
            { title: "轻松治愈 (搞笑/恋爱)", value: "35" },
            { title: "奇幻冒险 (异界/科幻)", value: "10765" },
            { title: "深度剧情 (悬疑/推理)", value: "18" }
          ]
        },
        {
          name: "page_num",
          title: "选择页码",
          type: "enumeration",
          value: "1",
          enumOptions: [
            { title: "第 1 页", value: "1" },
            { title: "第 2 页", value: "2" },
            { title: "第 3 页", value: "3" },
            { title: "第 4 页", value: "4" },
            { title: "第 5 页", value: "5" }
          ]
        }
      ]
    }
  ]
};

async function moduleDiscover(args) {
  const p = parseInt(args.page_num) || 1;
  const platform = args.platform;
  const genre = args.genre;

  // 平台 ID 映射
  let networkIds = "";
  if (platform === "ALL") {
    networkIds = "1605|2007|1330|1419|1631|213|2739|1112|4595|1857";
  } else if (platform === "CN") {
    networkIds = "1605|2007|1330";
  } else if (platform === "INTL") {
    networkIds = "213|2739|1112|4595";
  } else {
    networkIds = platform;
  }

  try {
    const res = await Widget.tmdb.get("/discover/tv", {
      params: {
        language: "zh-CN",
        page: p,
        sort_by: "popularity.desc",
        with_networks: networkIds,
        with_genres: genre ? "16," + genre : "16",
        with_original_language: "ja",
        without_genres: "10762",
        "first_air_date.lte": new Date().toISOString().split("T")[0]
      }
    });

    if (!res || !res.results || res.results.length === 0) {
      return [{
        id: "msg_empty",
        type: "info",
        title: "无匹配结果",
        description: "当前分类下暂无数据",
        mediaType: "info"
      }];
    }

    return res.results
      .filter(item => item.name && item.poster_path)
      .map(item => ({
        id: String(item.id),
        type: "tmdb",
        title: item.name,
        overview: item.overview || "暂无简介",
        posterPath: item.poster_path,
        rating: item.vote_average,
        releaseDate: item.first_air_date,
        mediaType: "tv"
      }));

  } catch (e) {
    return [{
      id: "msg_error",
      type: "info",
      title: "请求失败",
      description: "TMDB 通道暂时不可用",
      mediaType: "info"
    }];
  }
}
