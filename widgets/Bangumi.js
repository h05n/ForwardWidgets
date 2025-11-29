WidgetMetadata = {
  id: "forward.bangumiMovies",
  title: "影视数据",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "获取电影和电视剧数据，并支持分类",
  author: "Forward",
  site: "https://github.com/InchStudio/ForwardWidgets",
  modules: [
    {
      id: "fetchMovies",
      title: "获取电影",
      functionName: "fetchMovies",
      params: [],
    },
    {
      id: "fetchTVShows",
      title: "获取电视剧",
      functionName: "fetchTVShows",
      params: [],
    },
  ],
};

// 通用获取数据的方法
async function fetchBangumiData() {
  try {
    const url = "https://assets.vvebo.vip/scripts/datas/latest.json";
    console.log("正在获取 Bangumi 数据:", url);
    const response = await Widget.http.get(url);

    if (response && response.data) {
      console.log("Bangumi 数据获取成功");
      return response.data;
    }
  } catch (error) {
    console.error("获取 Bangumi 数据失败:", error.message);
    return null;
  }
}

// 格式化数据
function formatVideoData(data, type) {
  return data
    .filter((item) => item && item.tmdb_info && item.tmdb_info.mediaType === type)
    .map((item) => ({
      id: item.tmdb_info.id,
      type: type,
      title: item.bangumi_name,
      description: item.tmdb_info.description || "",
      releaseDate: item.tmdb_info.releaseDate || "",
      backdropPath: item.tmdb_info.backdropPath || "",
      posterPath: item.tmdb_info.posterPath || "",
      rating: item.tmdb_info.rating || 0,
      mediaType: type,
      genreTitle: item.tmdb_info.genreTitle || "",
      bangumiUrl: item.bangumi_url,
    }));
}

// 获取电影数据
async function fetchMovies() {
  const data = await fetchBangumiData();
  if (data) {
    const movies = formatVideoData(data, "movie");
    console.log(`电影数量: ${movies.length}`);
    return movies;
  }
  return [];
}

// 获取电视剧数据
async function fetchTVShows() {
  const data = await fetchBangumiData();
  if (data) {
    const tvShows = formatVideoData(data, "tv");
    console.log(`电视剧数量: ${tvShows.length}`);
    return tvShows;
  }
  return [];
}