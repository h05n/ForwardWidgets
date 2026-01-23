var WidgetMetadata = {
    "id": "scenario_simulator_v1",
    "title": "场景模拟器",
    "description": "选择你此时虚构的身处之地，同频观影",
    "author": "AI",
    "version": "1.1.0",
    "modules": [
        {
            "functionName": "getScenarioMovies",
            "params": [
                {
                    "name": "scenario",
                    "label": "假装你在...",
                    "type": "enumeration",
                    "values": ["🌌 漫步太空", "🏝️ 荒岛余生", "🏮 赛博都市", "🏰 中世纪古堡", "🕰️ 1920年代"],
                    "default": "🌌 漫步太空"
                },
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

async function getScenarioMovies(params) {
    var tmdbKey = params.tmdbKey;
    var scenario = params.scenario;
    if (!tmdbKey) return [];

    // 1. 场景与 TMDB 标签/关键词映射
    // 878: 科幻, 12: 冒险, 27: 恐怖, 36: 历史, 80: 犯罪
    var configMap = {
        "🌌 漫步太空": { genre: "878", keyword: "space", desc: "星辰大海，孤寂永恒" },
        "🏝️ 荒岛余生": { genre: "12", keyword: "island", desc: "生存法则，绝境求生" },
        "🏮 赛博都市": { genre: "80,878", keyword: "cyberpunk", desc: "霓虹阴影，高空低迷" },
        "🏰 中世纪古堡": { genre: "14,27", keyword: "castle", desc: "古老诅咒，阴影重重" },
        "🕰️ 1920年代": { genre: "18,36", keyword: "1920s", desc: "爵士年代，华丽落幕" }
    };

    var current = configMap[scenario] || configMap["🌌 漫步太空"];
    
    try {
        // 2. 构建请求地址
        var url = "https://api.themoviedb.org/3/discover/movie" + 
                  "?api_key=" + tmdbKey + 
                  "&language=zh-CN" + 
                  "&sort_by=popularity.desc" + 
                  "&with_genres=" + current.genre +
                  "&with_keywords=" + current.keyword;

        var response = await Widget.http.get(url);
        var data = JSON.parse(response);

        if (!data.results) return [];

        // 3. 返回标准格式对象
        return data.results.map(function(item) {
            return {
                "id": item.id.toString(),
                "title": item.title,
                "description": "【" + scenario + "】" + current.desc,
                "posterPath": "https://image.tmdb.org/t/p/w500" + item.poster_path,
                "backdropPath": "https://image.tmdb.org/t/p/original" + item.backdrop_path,
                "mediaType": "movie",
                "type": "tmdb"
            };
        });
    } catch (e) {
        return [];
    }
}
