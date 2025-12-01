WidgetMetadata = {
  id: "forward.bangumi",
  title: "动漫数据",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "获取时下热门动漫数据和播出日历",
  author: "，",
  site: "https://github.com/h05n/ForwardWidgets",
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
        }
      ]
    },
    {
      id: "trending",
      title: "近期注目",
      functionName: "trending",
      params: []
    }
  ]
};

//----------------------------------------------
// 1) 替换为你的 GitHub weekly.json
//----------------------------------------------
async function fetchBangumiData() {
  const url =
    "https://raw.githubusercontent.com/h05n/bangumi-builder/refs/heads/main/outputs/weekly.json";

  try {
    console.log("正在获取 Bangumi 每日数据:", url);
    const response = await Widget.http.get(url);

    if (response && response.data) {
      console.log("Bangumi 每日数据获取成功");
      return response.data;
    }
  } catch (error) {
    console.log("获取每日数据失败:", error.message);
  }

  // fallback：空数据
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

//----------------------------------------------
// 2) 替换为你的 GitHub spotlight.json
//----------------------------------------------
async function fetchTrendingData() {
  const url =
    "https://raw.githubusercontent.com/h05n/bangumi-builder/refs/heads/main/outputs/spotlight.json";

  try {
    console.log("正在获取 Bangumi 热度数据:", url);
    const response = await Widget.http.get(url);

    if (response && response.data) {
      console.log("Bangumi 热度数据获取成功");
      return response.data;
    }
  } catch (error) {
    console.log("获取热度数据失败:", error.message);
  }

  return [];
}

//----------------------------------------------
// 工具：获取某天的动画列表
//----------------------------------------------
function getAnimeByDay(data, day, maxItems = 50) {
  let animeList = [];

  if (day === "today") {
    const today = new Date();
    const weekdays = [
      "星期日",
      "星期一",
      "星期二",
      "星期三",
      "星期四",
      "星期五",
      "星期六"
    ];
    const todayWeekday = weekdays[today.getDay()];

    console.log(`今天是: ${todayWeekday}`);
    animeList = data[todayWeekday] || [];
  } else {
    animeList = data[day] || [];
  }

  return animeList.slice(0, maxItems);
}

//----------------------------------------------
// 格式化（保持和你原模块完全一致）
//----------------------------------------------
function formatAnimeData(animeList) {
  const validAnimeList = animeList.filter(anime => {
    return (
      anime &&
      anime.bangumi_name &&
      anime.bangumi_url &&
      anime.tmdb_info &&
      anime.tmdb_info.id
    );
  });

  return validAnimeList.map(anime => {
    const tmdb = anime.tmdb_info;

    return {
      id: tmdb?.id || anime.bangumi_url?.split("/").pop() || Math.random(),
      type: "bangumi",
      title: anime.bangumi_name,
      description: tmdb?.description || "",
      releaseDate: tmdb?.releaseDate || "",
      backdropPath: tmdb?.backdropPath || "",
      posterPath: tmdb?.posterPath || "",
      rating: tmdb?.rating || 0,
      mediaType: tmdb?.mediaType || "tv",
      genreTitle: tmdb?.genreTitle || "",
      bangumiUrl: anime.bangumi_url,
      tmdbInfo: tmdb,
      hasTmdb: !!tmdb,
      seasonInfo: tmdb?.seasonInfo || "",
      originalTitle: tmdb?.originalTitle || "",
      popularity: tmdb?.popularity || 0,
      voteCount: tmdb?.voteCount || 0
    };
  });
}

//----------------------------------------------
// 热度格式化（保持一致）
//----------------------------------------------
function formatTrendingData(trendingList) {
  const validTrendingList = trendingList.filter(anime => {
    return (
      anime &&
      anime.bangumi_name &&
      anime.bangumi_url &&
      anime.tmdb_info &&
      anime.tmdb_info.id
    );
  });

  return validTrendingList.map(anime => {
    const tmdb = anime.tmdb_info;

    return {
      id: tmdb?.id || anime.bangumi_url?.split("/").pop() || Math.random(),
      type: "bangumi",
      title: anime.bangumi_name,
      description: tmdb?.description || "",
      releaseDate: tmdb?.releaseDate || "",
      backdropPath: tmdb?.backdropPath || "",
      posterPath: tmdb?.posterPath || "",
      rating: tmdb?.rating || 0,
      mediaType: tmdb?.mediaType || "tv",
      genreTitle: tmdb?.genreTitle || "",
      bangumiUrl: anime.bangumi_url,
      tmdbInfo: tmdb,
      hasTmdb: !!tmdb,
      seasonInfo: tmdb?.seasonInfo || "",
      originalTitle: tmdb?.originalTitle || "",
      popularity: tmdb?.popularity || 0,
      voteCount: tmdb?.voteCount || 0,
      bangumiRating: anime.bangumi_rating || 0,
      bangumiRank: anime.bangumi_rank || 0
    };
  });
}

//----------------------------------------------
// 最终供 UI 调用的两个方法
//----------------------------------------------
async function dailySchedule(params) {
  const data = await fetchBangumiData();
  const day = params.day || "today";
  const animeList = getAnimeByDay(data, day);
  return formatAnimeData(animeList);
}

async function trending(params) {
  const data = await fetchTrendingData();
  return formatTrendingData(data);
}
