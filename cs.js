var WidgetMetadata = {
    id: "bilibili_bangumi_gallery",
    title: "B站番剧库",
    description: "仅供浏览番剧排行、时间表、索引及选集信息",
    author: "Gemini",
    site: "https://www.bilibili.com/anime/",
    version: "1.4.0",
    modules: [
        {
            title: "番剧排行榜",
            functionName: "getBangumiRanking",
            params: [
                {
                    name: "type",
                    title: "类别",
                    type: "enumeration",
                    value: "1",
                    enumOptions: [
                        { title: "番剧 (日漫)", value: "1" },
                        { title: "国创 (国漫)", value: "4" }
                    ]
                }
            ]
        },
        {
            title: "新番时间表",
            functionName: "getTimeline",
            params: []
        },
        {
            title: "番剧索引",
            functionName: "getBangumiIndex",
            params: [
                {
                    name: "page",
                    title: "页码",
                    type: "page",
                    value: "1"
                }
            ]
        }
    ]
};

/**
 * 格式化番剧项，增加选集展示逻辑
 */
function formatBangumiItem(item) {
    return {
        id: item.season_id || item.ss_id,
        type: "url",
        title: item.title,
        posterPath: (item.cover || item.pic || "").replace("http://", "https://"),
        // 评分展示
        rating: item.rating ? item.rating.replace("分", "") : (item.pts ? (item.pts/10000).toFixed(1) + "万热度" : "N/A"),
        // 更新状态展示 (如: 更新至第12话)
        durationText: item.index_show || item.new_ep?.index_show || "详情",
        // 风格标签
        genreTitle: item.styles ? item.styles.slice(0, 2).join("/") : (item.badge || "番剧"),
        link: `https://www.bilibili.com/bangumi/play/ss${item.season_id || item.ss_id}`,
        description: item.desc || item.evaluate || "",
        playerType: "app" // 仅作为展示，点击通常跳转网页
    };
}

/**
 * 1. 排行榜
 */
async function getBangumiRanking(params) {
    const url = `https://api.bilibili.com/pgc/season/rank/web/list?season_type=${params.type || 1}&day=3`;
    const resp = await Widget.http.get(url, getHeaders());
    return (resp.data.data.list || []).map(formatBangumiItem);
}

/**
 * 2. 时间表
 */
async function getTimeline() {
    const url = `https://api.bilibili.com/pgc/web/timeline/v2?season_type=1&day_before=0&day_after=6`;
    const resp = await Widget.http.get(url, getHeaders());
    let list = [];
    (resp.data.result.latest || []).forEach(day => {
        list = list.concat(day.episodes || []);
    });
    return list.map(formatBangumiItem);
}

/**
 * 3. 索引
 */
async function getBangumiIndex(params) {
    const page = params.page || 1;
    const url = `https://api.bilibili.com/pgc/season/index/condition?season_type=1&area=-1&style_id=-1&order=3&sort=0&page=${page}&pagesize=20`;
    const resp = await Widget.http.get(url, getHeaders());
    return (resp.data.data.list || []).map(formatBangumiItem);
}

/**
 * 核心：点击加载详情（展示选集列表，但不提供播放地址）
 */
async function loadDetail(link) {
    try {
        // 从链接中提取 season_id
        const seasonId = link.match(/ss(\d+)/)[1];
        const url = `https://api.bilibili.com/pgc/view/web/season?season_id=${seasonId}`;
        const resp = await Widget.http.get(url, getHeaders());
        const data = resp.data.result;

        return {
            title: data.title,
            posterPath: data.cover,
            description: data.evaluate,
            // 将每一集作为子项展示
            childItems: (data.episodes || []).map(ep => ({
                id: ep.id,
                title: `${ep.share_copy}`, // 显示如：第1话 启程
                durationText: ep.long_title,
                link: ep.share_url,
                type: "url"
            }))
        };
    } catch (e) {
        return { title: "加载失败" };
    }
}

function getHeaders() {
    return {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://www.bilibili.com/"
        }
    };
}
