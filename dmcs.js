var WidgetMetadata = {
    id: "com.native.danmu.china_all",
    title: "国内原生弹幕聚合",
    description: "聚合B站、腾讯、爱奇艺、优酷、芒果TV原生弹幕",
    author: "ForwardHelper",
    site: "https://github.com/InchStudio/ForwardWidgets",
    version: "1.2.0",
    requiredVersion: "0.0.1",
    detailCacheDuration: 60,
    modules: [
        {
            id: "searchDanmu",
            title: "搜索弹幕",
            functionName: "searchDanmu",
            type: "danmu",
            params: []
        },
        {
            id: "getComments",
            title: "获取弹幕列表",
            functionName: "getCommentsById",
            type: "danmu",
            params: []
        },
        {
            id: "getDanmuWithSegmentTime",
            title: "获取指定时刻弹幕",
            functionName: "getDanmuWithSegmentTime",
            type: "danmu",
            params: []
        }
    ]
};

// 1. 搜索逻辑
async function searchDanmu(params = {}) {
    const keyword = params.title || "";
    if (!keyword) return [];
    const results = [];
    const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    // --- B站原生搜索 ---
    try {
        const res = await Widget.http.get(`https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=${encodeURIComponent(keyword)}`, { headers: { "User-Agent": UA, "Referer": "https://www.bilibili.com" } });
        const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
        if (data.data && data.data.result) {
            data.data.result.slice(0, 5).forEach(item => {
                results.push({
                    id: "bili_" + item.bvid,
                    title: "[B站] " + item.title.replace(/<[^>]+>/g, ''),
                    type: "danmu",
                    source: "bilibili",
                    bvid: item.bvid
                });
            });
        }
    } catch (e) {}

    // --- 芒果TV原生搜索 ---
    try {
        const res = await Widget.http.get(`https://pcweb.api.mgtv.com/search/fulltext?q=${encodeURIComponent(keyword)}`, { headers: { "User-Agent": UA } });
        const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
        if (data.data && data.data.contents) {
            data.data.contents.slice(0, 3).forEach(item => {
                results.push({
                    id: "mgtv_" + item.id,
                    title: "[芒果] " + item.title.replace(/<[^>]+>/g, ''),
                    type: "danmu",
                    source: "mgtv",
                    videoId: item.id
                });
            });
        }
    } catch (e) {}

    // 占位符引导（腾讯、优酷、爱奇艺）
    results.push({ id: "tx_m", title: "[腾讯] 匹配: " + keyword, type: "danmu", source: "tencent", kw: keyword });
    results.push({ id: "iq_m", title: "[爱奇艺] 匹配: " + keyword, type: "danmu", source: "iqiyi", kw: keyword });
    results.push({ id: "yk_m", title: "[优酷] 匹配: " + keyword, type: "danmu", source: "youku", kw: keyword });

    return results;
}

// 2. 获取剧集/CID
async function getCommentsById(params = {}) {
    const source = params.source;
    if (source === "bilibili") {
        try {
            const res = await Widget.http.get(`https://api.bilibili.com/x/player/pagelist?bvid=${params.bvid}`);
            const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
            return data.data.map(p => ({
                cid: p.cid.toString(),
                title: p.part || "正片",
                commentId: p.cid.toString(),
                source: "bilibili"
            }));
        } catch (e) { return []; }
    }
    
    if (source === "mgtv") {
        return [{ cid: params.videoId.toString(), title: "正片", commentId: params.videoId.toString(), source: "mgtv" }];
    }

    return [{ cid: "p_" + source, title: "点击加载弹幕", commentId: "0", source: source }];
}

// 3. 加载弹幕内容
async function getDanmuWithSegmentTime(params = {}) {
    const cid = params.commentId || params.cid;
    const source = params.source;
    const st = params.segmentTime || 0;

    if (source === "bilibili") {
        try {
            const res = await Widget.http.get(`https://api.bilibili.com/x/v1/dm/list.so?oid=${cid}`);
            const $ = Widget.html.load(res.data, { xmlMode: true });
            return $('d').map((i, el) => {
                const p = $(el).attr('p').split(',');
                return [parseFloat(p[0]), p[1], "#" + parseInt(p[3]).toString(16), "", $(el).text()];
            }).get();
        } catch (e) { return []; }
    }

    if (source === "mgtv") {
        try {
            const page = Math.floor(st / 60);
            const res = await Widget.http.get(`https://bullet-v2.mgtv.com/v2/get_bullet?video_id=${cid}&page=${page}`);
            const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
            return data.data.items.map(it => [it.time / 1000, 1, "#ffffff", "", it.content]);
        } catch (e) { return []; }
    }

    // 腾讯/爱奇艺/优酷 默认返回空，待特定版本注入解密库
    return [];
}
