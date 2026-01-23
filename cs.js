var WidgetMetadata = {
    "id": "weather_cinema",
    "title": "窗外的电影",
    "description": "感知天气与昼夜，为你匹配观影氛围",
    "author": "AI",
    "version": "1.2.2",
    "site": "https://github.com/InchStudio/ForwardWidgets",
    "modules": [
        {
            "functionName": "getWeatherMovies",
            "params": [
                {
                    "name": "tmdbKey",
                    "label": "TMDB API Key",
                    "type": "input",
                    "default": ""
                }
            ]
        }
    ]
};

async function getWeatherMovies(params = {}) {
    var tmdbKey = params.tmdbKey;
    if (!tmdbKey) return [];

    var cityName = "北京";
    var weatherText = "晴";
    var temp = "20";

    try {
        // 1. 国内精准定位
        var ipResp = await Widget.http.get('https://whois.pconline.com.cn/ipJson.jsp?json=true');
        var ipData = JSON.parse(ipResp);
        if (ipData && ipData.city) {
            cityName = ipData.city.replace("市", "");
        }

        // 2. 获取天气
        var weatherUrl = "https://wttr.in/" + encodeURIComponent(cityName) + "?format=j1&lang=zh-cn";
        var weatherResp = await Widget.http.get(weatherUrl);
        var weatherData = JSON.parse(weatherResp);
        
        weatherText = weatherData.current_condition[0].lang_zh 
                      ? weatherData.current_condition[0].lang_zh[0].value 
                      : weatherData.current_condition[0].weatherDesc[0].value;
        temp = weatherData.current_condition[0].temp_C;
    } catch (e) {
        // 定位失败保持默认值
    }

    // 3. 氛围匹配逻辑
    var hour = new Date().getHours();
    var genre = "18"; 
    var moodDesc = "精选时刻";

    if (hour >= 22 || hour <= 4) {
        genre = "27,53";
        moodDesc = "深夜惊悚";
    } else if (weatherText.indexOf("雨") !== -1 || weatherText.indexOf("阴") !== -1) {
        genre = "18,80";
        moodDesc = "雨天氛围";
    } else if (weatherText.indexOf("晴") !== -1) {
        genre = "35,12";
        moodDesc = "明媚心情";
    }

    // 4. 请求 TMDB 资源
    try {
        var randomPage = Math.floor(Math.random() * 10) + 1;
        var tmdbUrl = "https://api.themoviedb.org/3/discover/movie?api_key=" + tmdbKey + "&with_genres=" + genre + "&language=zh-CN&page=" + randomPage;
        var movieResp = await Widget.http.get(tmdbUrl);
        var movieData = JSON.parse(movieResp);

        return movieData.results.map(function(item) {
            return {
                id: item.id.toString(),
                title: item.title,
                description: "【" + moodDesc + "】 " + cityName + " " + weatherText + " " + temp + "°C",
                posterPath: "https://image.tmdb.org/t/p/w500" + item.poster_path,
                backdropPath: "https://image.tmdb.org/t/p/original" + item.backdrop_path,
                mediaType: "movie",
                type: "tmdb"
            };
        });
    } catch (err) {
        return [];
    }
}
