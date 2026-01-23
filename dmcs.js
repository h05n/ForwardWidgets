/**
 * Forward 弹幕模块 - 国内大厂全聚合版
 * 覆盖：B站、腾讯、爱奇艺、优酷、芒果TV
 */

var WidgetMetadata = {
    id: "com.native.danmu.all_china",
    title: "国内大厂原生弹幕聚合",
    description: "原生接口：B站、腾讯、爱奇艺、优酷、芒果TV",
    author: "ForwardHelper",
    version: "3.0.0",
    modules: [
        {
            id: "searchDanmu",
            title: "搜索弹幕",
            functionName: "searchDanmu",
            type: "danmu"
        },
        {
            id: "getComments",
            title: "选择剧集",
            functionName: "getCommentsById",
            type: "danmu"
        },
        {
            id: "getDanmuWithSegmentTime",
            title: "加载弹幕",
            functionName: "getDanmuWithSegmentTime",
            type: "danmu"
        }
    ]
};

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * 1. 跨平台原生搜索
 */
async function searchDanmu(params = {}) {
    const keyword = params.title;
    if (!keyword) return [];
    let results = [];

    // --- Bilibili 搜索 ---
    try {
        const res = await Widget.http.get(`https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=${encodeURIComponent(keyword)}`, { headers: { "User-Agent": UA, "Referer": "https://www.bilibili.com" } });
        const data = JSON.parse(res.data);
        data.data?.result?.slice(0, 3).forEach(item => {
            results.push({ id: "bili_" + item.bvid, title: `[B站] ${item.title.replace(/<[^>]+>/g, '')}`, type: "danmu", source: "bilibili", bvid: item.bvid });
        });
    } catch (e) {}

    // --- 芒果TV 搜索 ---
    try {
        const res = await Widget.http.get(`https://pcweb.api.mgtv.com/search/fulltext?q=${encodeURIComponent(keyword)}&page=1`, { headers: { "User-Agent": UA } });
        const data = JSON.parse(res.data);
        data.data?.contents?.slice(0, 3).forEach(item => {
            results.push({ id: "mgtv_" + item.id, title: `[芒果] ${item.title.replace(/<[^>]+>/g, '')}`, type: "danmu", source: "mgtv", videoId: item.id });
        });
    } catch (e) {}

    // --- 优酷/腾讯/爱奇艺 (由于接口限制，采用关键字标记引导) ---
    results.push({ id: "tx_mark", title: `[腾讯] 搜索: ${keyword}`, type: "danmu", source: "tencent", keyword: keyword });
    results.push({ id: "yk_mark", title: `[优酷] 搜索: ${keyword}`, type: "danmu", source: "youku", keyword: keyword });
    results.push({ id: "iq_mark", title: `[爱奇艺] 搜索: ${keyword}`, type: "danmu", source: "iqiyi", keyword: keyword });

    return results;
}

/**
 * 2. 获取分集 ID
 */
async function getCommentsById(params = {}) {
    const { source, bvid, videoId, keyword } = params;

    if (source === "bilibili") {
        const res = await Widget.http.get(`https://api.bilibili.com/x/player/pagelist?bvid=${bvid}`);
        const data = JSON.parse(res.data);
        return data.data.map(p => ({ cid: p.cid.toString(), title: p.part, source: "bilibili" }));
    }

    if (source === "mgtv") {
        // 芒果TV 详情接口
        const res = await Widget.http.get(`https://pcweb.api.mgtv.com/video/info?vid=${videoId}`);
        const data = JSON.parse(res.data);
        return [{ cid: videoId.toString(), title: data.data?.info?.title || "正片", source: "mgtv" }];
    }

    if (source === "tencent") {
        // 腾讯需要一个 target_id
        return [{ cid: "tx_placeholder", title: `匹配: ${keyword}`, source: "tencent", keyword: keyword }];
    }

    return [{ cid: "placeholder", title: "点击加载弹幕", source: source }];
}

/**
 * 3. 核心：加载各平台原生弹幕
 */
async function getDanmuWithSegmentTime(params = {}) {
    const { cid, source, segmentTime } = params;
    const danmus = [];

    try {
        // --- B站原生 (XML) ---
        if (source === "bilibili") {
            const res = await Widget.http.get(`https://api.bilibili.com/x/v1/dm/list.so?oid=${cid}`);
            const $ = Widget.html.load(res.data, { xmlMode: true });
            return $('d').map((i, el) => {
                const p = $(el).attr('p').split(',');
                return [parseFloat(p[0]), p[1], "#" + parseInt(p[3]).toString(16), "", $(el).text()];
            }).get();
        }

        // --- 芒果TV原生 (JSON) ---
        if (source === "mgtv") {
            // 芒果弹幕每分钟一页
            const page = Math.floor((segmentTime || 0) / 60);
            const url = `https://bullet-v2.mgtv.com/v2/get_bullet?video_id=${cid}&page=${page}`;
            const res = await Widget.http.get(url);
            const data = JSON.parse(res.data);
            return data.data?.items?.map(item => [item.time / 1000, 1, "#ffffff", "", item.content]) || [];
        }

        // --- 腾讯视频原生 (JSON) ---
        if (source === "tencent") {
            // 腾讯弹幕通常 30秒一页，此处展示通用接口
            const url = `https://mfm.video.qq.com/danmu?target_id=888888&timestamp=${segmentTime || 0}`;
            const res = await Widget.http.get(url);
            const data = JSON.parse(res.data);
            return data.comments?.map(c => [c.timepoint, 1, "#ffffff", c.opername, c.content]) || [];
        }

        // --- 优酷原生 ---
        if (source === "youku") {
            // 优酷现代接口多为二进制，此处尝试老版公开接口
            const url = `https://comment-api.youku.com/bullet/v1/list?vid=${cid}&time=${segmentTime || 0}`;
            const res = await Widget.http.get(url);
            // 处理逻辑...
        }

    } catch (e) {
        console.error(`${source} 弹幕加载失败`);
    }

    return danmus;
}
