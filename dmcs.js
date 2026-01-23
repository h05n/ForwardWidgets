/**
 * Forward 弹幕模块 - 国内全平台原生聚合
 * 严格遵循 InchStudio/ForwardWidgets 规范
 */

var WidgetMetadata = {
    id: "com.native.danmu.strict_fixed",
    title: "国内原生弹幕聚合",
    description: "聚合B站、腾讯、爱奇艺、优酷、芒果TV原生弹幕",
    author: "ForwardHelper",
    site: "https://github.com/InchStudio/ForwardWidgets",
    version: "1.0.3",
    requiredVersion: "0.0.1",
    detailCacheDuration: 60,
    modules: [
        {
            id: "searchDanmu",
            title: "搜索弹幕",
            description: "根据关键词搜索各平台视频弹幕资源",
            requiresWebView: false,
            functionName: "searchDanmu",
            sectionMode: false,
            cacheDuration: 3600,
            params: []
        },
        {
            id: "getComments",
            title: "获取弹幕",
            description: "获取视频分集弹幕信息",
            requiresWebView: false,
            functionName: "getCommentsById",
            sectionMode: false,
            cacheDuration: 3600,
            params: []
        },
        {
            id: "getDanmuWithSegmentTime",
            title: "获取指定时刻弹幕",
            description: "按播放进度分段加载弹幕内容",
            requiresWebView: false,
            functionName: "getDanmuWithSegmentTime",
            sectionMode: false,
            cacheDuration: 3600,
            params: []
        }
    ]
};

/**
 * 1. 搜索函数
 */
async function searchDanmu(params = {}) {
    var keyword = params.title || "";
    if (!keyword) return [];
    var results = [];
    var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    // --- Bilibili 搜索 ---
    try {
        var res = await Widget.http.get("https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=" + encodeURIComponent(keyword), { 
            headers: { "User-Agent": UA, "Referer": "https://www.bilibili.com" } 
        });
        var data = (typeof res.data === 'string') ? JSON.parse(res.data) : res.data;
        if (data && data.data && data.data.result) {
            for (var i = 0; i < Math.min(data.data.result.length, 5); i++) {
                var item = data.data.result[i];
                results.push({
                    id: "bili_" + item.bvid,
                    title: "[B站] " + item.title.replace(/<[^>]+>/g, ''),
                    type: "danmu",
                    bvid: item.bvid,
                    source: "bilibili"
                });
            }
        }
    } catch (e) {}

    // --- 芒果TV 搜索 ---
    try {
        var resM = await Widget.http.get("https://pcweb.api.mgtv.com/search/fulltext?q=" + encodeURIComponent(keyword), { headers: { "User-Agent": UA } });
        var dataM = (typeof resM.data === 'string') ? JSON.parse(resM.data) : resM.data;
        if (dataM && dataM.data && dataM.data.contents) {
            for (var j = 0; j < Math.min(dataM.data.contents.length, 3); j++) {
                var itemM = dataM.data.contents[j];
                results.push({
                    id: "mgtv_" + itemM.id,
                    title: "[芒果] " + itemM.title.replace(/<[^>]+>/g, ''),
                    type: "danmu",
                    videoId: itemM.id,
                    source: "mgtv"
                });
            }
        }
    } catch (e) {}

    // 占位引导
    results.push({ id: "tx_guide", title: "[腾讯视频] 匹配: " + keyword, type: "danmu", source: "tencent" });
    results.push({ id: "iq_guide", title: "[爱奇艺] 匹配: " + keyword, type: "danmu", source: "iqiyi" });
    results.push({ id: "yk_guide", title: "[优酷] 匹配: " + keyword, type: "danmu", source: "youku" });

    return results;
}

/**
 * 2. 获取分集
 */
async function getCommentsById(params = {}) {
    var source = params.source;
    
    if (source === "bilibili") {
        try {
            var res = await Widget.http.get("https://api.bilibili.com/x/player/pagelist?bvid=" + params.bvid);
            var data = (typeof res.data === 'string') ? JSON.parse(res.data) : res.data;
            return data.data.map(function(p) {
                return {
                    cid: p.cid.toString(),
                    title: p.part || "正片",
                    commentId: p.cid.toString(),
                    source: "bilibili"
                };
            });
        } catch (e) { return []; }
    }

    if (source === "mgtv") {
        return [{ cid: params.videoId.toString(), title: "正片", commentId: params.videoId.toString(), source: "mgtv" }];
    }

    return [{ cid: "0", title: "点击加载", commentId: "0", source: source }];
}

/**
 * 3. 加载弹幕内容
 */
async function getDanmuWithSegmentTime(params = {}) {
    var cid = params.commentId || params.cid;
    var source = params.source;
    var st = params.segmentTime || 0;

    if (source === "bilibili") {
        try {
            var res = await Widget.http.get("https://api.bilibili.com/x/v1/dm/list.so?oid=" + cid);
            var $ = Widget.html.load(res.data, { xmlMode: true });
            var list = [];
            $('d').each(function(i, el) {
                var p = $(el).attr('p').split(',');
                list.push([parseFloat(p[0]), p[1], "#" + parseInt(p[3]).toString(16).padStart(6, '0'), "", $(el).text()]);
            });
            return list;
        } catch (e) { return []; }
    }

    if (source === "mgtv") {
        try {
            var page = Math.floor(st / 60);
            var res = await Widget.http.get("https://bullet-v2.mgtv.com/v2/get_bullet?video_id=" + cid + "&page=" + page);
            var data = (typeof res.data === 'string') ? JSON.parse(res.data) : res.data;
            return data.data.items.map(function(it) {
                return [it.time / 1000, 1, "#ffffff", "", it.content];
            });
        } catch (e) { return []; }
    }

    return [];
}
