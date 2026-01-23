const WidgetMetadata = {
    id: "weather_cinema_cn",
    title: "窗外的电影",
    description: "自动感知国内天气与昼夜，为你匹配当下观影氛围",
    author: "ForwardDesign",
    version: "1.2.1",
    site: "https://github.com/InchStudio/ForwardWidgets",
    modules: [
        {
            functionName: "getWeatherMovies",
            params: [
                {
                    name: "tmdbKey",
                    label: "TMDB API Key (必填)",
                    type: "input",
                    default: ""
                },
                {
                    name: "refresh",
                    label: "拨动刷新",
                    type: "count",
                    default: 1
                }
            ]
        }
    ]
};

async function getWeatherMovies(params = {}) {
    const { tmdbKey, refresh } = params;

    // 如果没填 Key，直接提示，防止模块报错
    if (!tmdbKey) {
        return [{
            id: "error",
            title: "请在设置中填写 TMDB API Key",
            description: "这个模块需要 TMDB Key 才能拉取海报和数据。",
            type: "text"
        }];
    }

    let cityName = "北京";
    let weatherText = "晴";
    let temp = "20";

    try {
        // 1. 国内精准定位：利用太平洋电脑网接口（免 Key，国内极准）
        const ipResp = await Widget.http.get('https://whois.pconline.com.cn/ipJson.jsp?json=true');
        const ipData = JSON.parse(ipResp);
        if (ipData && ipData.city) {
            cityName = ipData.city.replace("市", "");
        }

        // 2. 获取天气：强制指定城市名给 wttr.in
        const weatherUrl = `https://wttr.in/${encodeURIComponent(cityName)}?format=j1&lang=zh-cn`;
        const weatherResp = await Widget.http.get(weatherUrl);
        const weatherData = JSON.parse(weatherResp);
        
        weatherText = weatherData.current_condition[0].lang_zh 
                      ? weatherData.current_condition[0].lang_zh[0].value 
                      : weatherData.current_condition[0].weatherDesc[0].value;
        temp = weatherData.current_condition[0].temp_C;
    } catch (e) {
        // 定位或天气失败的兜底逻辑
    }

    // 3. 氛围匹配逻辑
    const hour = new Date().getHours();
    let config = { genre: "18", mood: "静享时光" };

    if (hour >= 22 || hour <= 4) {
        config = { genre: "27,53", mood: "深夜档：悬疑惊悚" };
    } else if (weatherText.includes("雨") || weatherText.includes("阴")) {
        config = { genre: "18,80", mood: "雨天氛围：剧情犯罪" };
    } else if (weatherText.includes("晴")) {
        config = { genre: "35,12", mood: "明媚心情：喜剧冒险" };
    } else if (weatherText.includes("雪")) {
        config = { genre: "10751,14", mood: "冬日浪漫：家庭奇幻" };
    }

    // 4. 请求 TMDB 资源
    try {
        const randomPage = Math.floor(Math.random() * 20) + 1;
        const tmdbUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${tmdbKey}&with_genres=${config.genre}&language=zh-CN&page=${randomPage}`;
        const movieResp = await Widget.http.get(tmdbUrl);
        const movieData = JSON.parse(movieResp);

        return movieData.results.map(item => ({
            id: item.id.toString(),
            title: item.title,
            description: `【${config.mood}】| 定位：${cityName} | 此时：${weatherText} ${temp}°C`,
            posterPath: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
            backdropPath: `https://image.tmdb.org/t/p/original${item.backdrop_path}`,
            mediaType: "movie",
            type: "tmdb"
        }));
    } catch (err) {
        throw new Error("TMDB 请求失败，请检查 Key 是否正确");
    }
}
