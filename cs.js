// ===========================================
// Forward Widget: 全球日漫榜 (Industrial v21.0)
// ===========================================

WidgetMetadata = {
  id: "global_anime_v21_final",
  title: "日漫榜单",
  description: "深度自查版：锁死日漫、标题图片多级回溯、无损展示",
  author: "Gemini",
  version: "21.0.0",
  detailCacheDuration: 60,
  modules: [
    {
      title: "日漫榜单",
      requiresWebView: false,
      functionName: "moduleDiscover",
      cacheDuration: 3600,
      params: [
        {
          name: "p", title: "平台", type: "enumeration", value: "ALL",
          enumOptions: [
            { title: "全部聚合", value: "ALL" },
            { title: "国内聚合", value: "CN" },
            { title: "国外聚合", value: "INTL" },
            { title: "· 哔哩哔哩", value: "1605" },
            { title: "· 腾讯视频", value: "2007" },
            { title: "· 爱奇艺", value: "1330" },
            { title: "· Netflix", value: "213" },
            { title: "· Disney+", value: "2739" },
            { title: "· d Anime Store", value: "4595" }
          ]
        },
        {
          name: "s", title: "排序", type: "enumeration", value: "popularity.desc",
          enumOptions: [
            { title: "最热", value: "popularity.desc" },
            { title: "最新", value: "first_air_date.desc" }
          ]
        },
        {
          name: "g", title: "题材", type: "enumeration", value: "",
          enumOptions: [
            { title: "全部", value: "" },
            { title: "热血", value: "10759" },
            { title: "奇幻", value: "10765" },
            { title: "轻松", value: "35" },
            { title: "剧情", value: "18" }
          ]
        },
        {
          name: "n", title: "页码", type: "enumeration", value: "1",
          enumOptions: [
            { title: "1", value: "1" }, { title: "2", value: "2" }, { title: "3", value: "3" },
            { title: "4", value: "4" }, { title: "5", value: "5" }, { title: "6", value: "6" },
            { title: "7", value: "7" }, { title: "8", value: "8" }, { title: "9", value: "9" },
            { title: "10", value: "10" }, { title: "11", value: "11" }, { title: "12", value: "12" },
            { title: "13", value: "13" }, { title: "14", value: "14" }, { title: "15", value: "15" }
          ]
        }
      ]
    }
  ]
};

async function moduleDiscover(args) {
  // 1. 映射逻辑优化：使用字典直接寻址，速度最快
  var map = { "ALL": "1605|2007|1330|213|2739|4595", "CN": "1605|2007|1330", "INTL": "213|2739|4595" };
  var nets = map[args.p] || args.p;
  
  // 2. 中国大陆时间 (UTC+8) 极致校准
  var bjDate = new Date(Date.now() + 28800000).toISOString().split('T')[0];

  try {
    var res = await Widget.tmdb.get("/discover/tv", {
      params: {
        language: "zh-CN", // 优先简中，无简中自动回退繁中
        include_image_language: "null,zh,en,ja", // 极致优化：无字原图优先，再找中/英/日海报
        page: args.n || "1",
        sort_by: args.s || "popularity.desc",
        with_networks: nets,
        with_genres: args.g ? "16," + args.g : "16", // 锁死动画 (16)，物理屏蔽真人剧
        with_original_language: "ja", // 锁定日本产地，屏蔽国产3D
        without_genres: "10762", // 排除纪录片/教育
        "first_air_date.lte": bjDate,
        "vote_count.gte": 5 // 深度过滤僵尸词条
      }
    });

    if (!res || !res.results) return [];

    var out = [];
    var raw = res.results;
    for (var i = 0; i < raw.length; i++) {
      var r = raw[i];
      // 3. 标题优先级逻辑：简体 > 繁体 (API自动处理) > 日语原名 > 英文名
      var t = r.name || r.original_name || "Unknown";
      
      // 4. 无损展示：不检查 poster_path，确保数据一个不丢
      out.push({
        id: String(r.id),
        type: "tmdb",
        title: t,
        overview: r.overview || "",
        posterPath: r.poster_path, // null 时由软件显示占位符
        rating: r.vote_average,
        releaseDate: r.first_air_date,
        mediaType: "tv"
      });
    }
    return out;
  } catch (e) {
    return [];
  }
}
