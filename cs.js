const WidgetMetadata = {
    "id": "weather_cinema_v3",
    "title": "窗外的电影",
    "description": "自动匹配天气氛围",
    "author": "AI",
    "version": "1.0.0",
    "modules": [
        {
            "functionName": "getWeatherMovies",
            "params": [
                {
                    "name": "tmdbKey",
                    "label": "TMDB Key",
                    "type": "input"
                }
            ]
        }
    ]
};

async function getWeatherMovies(params) {
    const tmdbKey = params.tmdbKey;
    if (!tmdbKey || tmdbKey.length < 10) {
        return [];
    }

    let cityName = "shanghai";
    let weatherText = "clear";

    try {
        // 1. 使用支持 HTTPS 的 IP 定位（国内可用）
        const ipInfo = await Widget.http.get("https://ipapi.co/json/");
        const ipData = JSON.parse(ipInfo);
        if (ipData && ipData.city) {
            cityName = ipData.city;
        }

        // 2. 获取天气信息
        const weatherInfo = await Widget.http.get(`https://wttr.in/${cityName}?format=j1&lang=zh-cn`);
        const weatherData = JSON.parse(weatherInfo);
        weatherText = weatherData.current_condition[0].weatherDesc[0].value.toLowerCase();
    } catch (e) {
        // 忽略定位错误，使用默认值
    }

    // 3. 确定搜索标签 (TMDB Genre ID)
    // 28: 动作, 35: 喜剧, 18: 剧情, 27: 恐怖
    let genre = "18"; 
    if (weatherText.includes("rain") || weatherText.includes("cloud")) {
        genre = "18,80"; // 剧情或犯罪
    } else if (weatherText.includes("sun") || weatherText.includes("clear")) {
        genre = "35,12"; // 喜剧或冒险
    }

    // 4. 拉取数据
    try {
        const page = Math.floor(Math.random() * 5) + 1;
        const apiAddr = `https://api.themoviedb.org/3/discover/movie?api_key=${tmdbKey}&with_genres=${genre}&language=zh-CN&page=${page}`;
        const res = await Widget.http.get(apiAddr);
        const data = JSON.parse(res);

        return data.results.map(item => {
            return {
                "id": item.id.toString(),
                "type": "tmdb",
                "title": item.title,
                "posterPath": "https://image.tmdb.org/t/p/w500" + item.poster_path,
                "backdropPath": "https://image.tmdb.org/t/p/original" + item.backdrop_path,
                "mediaType": "movie"
            };
        });
    } catch (err) {
        return [];
    }
}
