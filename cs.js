// ===========================================
// Forward Widget: 全球日漫榜 (Spec Compliance)
// ===========================================

WidgetMetadata = {
  id: "global_anime_final_v5", // 使用全新ID，彻底清除缓存干扰
  title: "日漫榜单",
  description: "聚合全球核心平台的纯净日漫榜单",
  author: "Gemini",
  version: "5.0.0",
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
            { title: "动作 / 冒险", value: "10759" },
            { title: "轻松 / 治愈", value: "35" },
            { title: "奇幻 / 异界", value: "10765" },
            { title: "烧脑 / 剧情", value: "18" }
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
  var page = args.page_num || "1";
  var platform = args.platform || "ALL";
  var genre = args.genre || "";

  // 1. 严格映射平台 ID 字符串
  var networkIds = "";
  if (platform === "ALL") {
    networkIds = "1605|2007|1330|213|2739|1112|4595";
  } else if (platform === "CN") {
    networkIds = "1605|2007|1330";
  } else if (platform === "INTL") {
    networkIds = "213|2739|1112|4595";
  } else {
    networkIds = platform;
  }

  // 2. 题材构建 (16 是动画大类)
  var genres = "16";
  if (genre !== "") {
    genres = "16," + genre;
  }

  try {
    // 3. 发起请求
    var response = await Widget.tmdb.get("/discover/tv", {
      params: {
        language: "zh-CN",
        page: page,
        sort_by: "popularity.desc",
        with_networks: networkIds,
        with_genres: genres,
        with_original_language: "ja", // 锁死日语
        without_genres: "10762",    // 屏蔽儿童
        "first_air_date.lte": new Date().toISOString().split("T")[0]
      }
    });

    // 4. 数据存在性校验
    if (!response || !response.results || response.results.length === 0) {
      return [{
        id: "empty_info",
        type: "info",
        title: "暂无日漫资源",
        description: "当前分类或平台暂未搜索到相关条目",
        mediaType: "info"
      }];
    }

    // 5. 格式化输出为 VideoItem 数组
    var items = [];
    for (var i = 0; i < response.results.length; i++) {
      var entry = response.results[i];
      if (entry.name && entry.poster_path) {
        items.push({
          id: entry.id.toString(),
          type: "tmdb",
          title: entry.name,
          overview: entry.overview || "暂无简介",
          posterPath: entry.poster_path,
          rating: entry.vote_average,
          releaseDate: entry.first_air_date,
          mediaType: "tv"
        });
      }
    }
    
    return items;

  } catch (err) {
    // 6. 异常捕获并返回 info 类型
    return [{
      id: "error_info",
      type: "info",
      title: "加载失败",
      description: "网络连接超时或数据通道异常",
      mediaType: "info"
    }];
  }
}
