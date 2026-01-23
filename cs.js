const WidgetMetadata = {
    "id": "scenario_cinema_official",
    "title": "场景模拟器",
    "description": "基于你虚构的所处场景，自动筛选匹配氛围的影视内容。",
    "author": "ForwardUser",
    "version": "1.1.2",
    "site": "https://github.com/InchStudio/ForwardWidgets",
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
    const tmdbKey = params.tmdbKey;
    const scenario = params.scenario;
    
    // 如果没有 Key，返回空数组以防崩溃
    if (!tmdbKey || tmdbKey.length < 5) return [];

    const configMap = {
        "🌌 漫步太空": { "genre": "878", "keyword": "space", "desc": "星辰大海，孤寂永恒" },
        "🏝️ 荒岛余生": { "genre": "12", "keyword": "island", "desc": "生存法则，绝境求生" },
        "🏮 赛博都市": { "genre": "80,878", "keyword": "cyberpunk", "desc": "霓虹阴影，高空低迷" },
        "🏰 中世纪古堡": { "genre": "14,27", "keyword": "castle", "desc": "古老诅咒，阴影重重" },
        "🕰️ 1920年代": { "genre": "18,36", "keyword": "1920s", "desc": "爵士年代，华丽落幕" }
    };

    const current = configMap[scenario] || configMap["🌌 漫步太空"];
    
    try {
        const url = "https://api.themoviedb.org/3/discover/movie" + 
                    "?api_key=" + tmdbKey + 
                    "&language=zh-CN" + 
                    "&sort_by=popularity.desc" + 
                    "&with_genres=" + current.genre +
                    "&with_keywords=" + current.keyword;

        const response = await Widget.http.get(url);
        const data = JSON.parse(response);

        if (!data || !data.results) return [];

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
