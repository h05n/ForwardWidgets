WidgetMetadata = {
    "id": "scenario_cinema_final",
    "title": "场景模拟器",
    "description": "基于你虚构的所处场景，自动筛选匹配氛围的影视内容。",
    "author": "Forward",
    "version": "1.0.0",
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
    var tmdbKey = params.tmdbKey;
    var scenario = params.scenario;
    
    // 如果没有填写 Key，返回空列表
    if (!tmdbKey) return [];

    var configMap = {
        "🌌 漫步太空": { "genre": "878", "keyword": "space", "desc": "星辰大海" },
        "🏝️ 荒岛余生": { "genre": "12", "keyword": "island", "desc": "绝境求生" },
        "🏮 赛博都市": { "genre": "80,878", "keyword": "cyberpunk", "desc": "霓虹高空" },
        "🏰 中世纪古堡": { "genre": "14,27", "keyword": "castle", "desc": "古老阴影" },
        "🕰️ 1920年代": { "genre": "18,36", "keyword": "1920s", "desc": "华丽落幕" }
    };

    var current = configMap[scenario] || configMap["🌌 漫步太空"];
    
    try {
        var url = "https://api.themoviedb.org/3/discover/movie" + 
                  "?api_key=" + tmdbKey + 
                  "&language=zh-CN" + 
                  "&sort_by=popularity.desc" + 
                  "&with_genres=" + current.genre +
                  "&with_keywords=" + current.keyword;

        var response = await Widget.http.get(url);
        var data = JSON.parse(response);

        if (!data || !data.results) return [];

        return data.results.map(function(item) {
            return {
                "id": item.id.toString(),
                "type": "tmdb",
                "title": item.title,
                "description": "【" + scenario + "】" + current.desc,
                "posterPath": "https://image.tmdb.org/t/p/w500" + item.poster_path,
                "backdropPath": "https://image.tmdb.org/t/p/original" + item.backdrop_path,
                "mediaType": "movie"
            };
        });
    } catch (error) {
        return [];
    }
}
