// Forward Widgets - Bangumi (重写版)
// id: forward.bangumi
// 说明: 获取时下热门动漫数据和播出日历（带缓存、重试、字段规范化、日期回退）

/**
 * Widget Metadata
 */
const WidgetMetadata = {
  id: "forward.bangumi",
  title: "动漫数据",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "获取时下热门动漫数据和播出日历（含缓存与回退机制）",
  author: "Forward",
  site: "https://github.com/InchStudio/ForwardWidgets",
  modules: [
    {
      id: "dailySchedule",
      title: "每日播出",
      functionName: "dailySchedule",
      params: [
        {
          name: "day",
          title: "星期",
          type: "enumeration",
          enumOptions: [
            { title: "今天", value: "today" },
            { title: "星期一", value: "星期一" },
            { title: "星期二", value: "星期二" },
            { title: "星期三", value: "星期三" },
            { title: "星期四", value: "星期四" },
            { title: "星期五", value: "星期五" },
            { title: "星期六", value: "星期六" },
            { title: "星期日", value: "星期日" },
          ],
        },
        {
          name: "maxItems",
          title: "最大数量",
          type: "number",
        },
        {
          name: "useUTC",
          title: "使用 UTC 计算今天",
          type: "boolean",
        },
      ],
    },
    {
      id: "trending",
      title: "近期注目",
      functionName: "trending",
      params: [
        {
          name: "maxItems",
          title: "最大数量",
          type: "number",
        },
      ],
    },
  ],
};

/* ---------------------------
   配置常量
   --------------------------- */
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000; // latest.json 缓存：5 分钟
const DATE_BACKOFF_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 按日期文件缓存：12 小时
const HTTP_MAX_ATTEMPTS = 3;
const DATE_BACKOFF_DAYS = 7; // 回退天数
const WEEKDAY_MAP = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];

/* 简单日志封装（可按需扩展） */
const log = {
  info: (...args) => { try { console.log('[INFO]', ...args); } catch(e){} },
  warn: (...args) => { try { console.warn('[WARN]', ...args); } catch(e){} },
  error: (...args) => { try { console.error('[ERROR]', ...args); } catch(e){} },
  debug: (...args) => { try { console.debug('[DEBUG]', ...args); } catch(e){} },
};

/* ---------------------------
   Storage - 封装 Widget.storage（带回退）
   --------------------------- */
const Storage = (function () {
  // runtime may provide Widget.storage, or localStorage in some contexts.
  const storeAvailable = (typeof Widget !== 'undefined' && Widget.storage && typeof Widget.storage.getItem === 'function');
  const localAvailable = (typeof localStorage !== 'undefined');
  const memory = {};

  return {
    getItem(key) {
      try {
        if (storeAvailable) {
          return Widget.storage.getItem(key);
        } else if (localAvailable) {
          return localStorage.getItem(key);
        } else {
          return memory[key] || null;
        }
      } catch (e) {
        return null;
      }
    },
    setItem(key, value) {
      try {
        if (storeAvailable) {
          Widget.storage.setItem(key, value);
        } else if (localAvailable) {
          localStorage.setItem(key, value);
        } else {
          memory[key] = value;
        }
      } catch (e) {
        // ignore
      }
    },
    removeItem(key) {
      try {
        if (storeAvailable) {
          Widget.storage.removeItem(key);
        } else if (localAvailable) {
          localStorage.removeItem(key);
        } else {
          delete memory[key];
        }
      } catch (e) {
        // ignore
      }
    }
  };
})();

/* ---------------------------
   工具函数
   --------------------------- */

/**
 * 返回空的周结构
 */
function emptyWeekData() {
  return {
    "星期一": [],
    "星期二": [],
    "星期三": [],
    "星期四": [],
    "星期五": [],
    "星期六": [],
    "星期日": []
  };
}

/**
 * 判断数据是否看起来像 Bangumi 数据：至少包含一个星期键并且对应数组
 * @param {*} data
 * @returns {boolean}
 */
function isValidBangumiData(data) {
  if (!data || typeof data !== 'object') return false;
  const keys = ["星期一","星期二","星期三","星期四","星期五","星期六","星期日"];
  return keys.some(k => Array.isArray(data[k]));
}

/**
 * 简单稳定哈希（DJB2）用于生成稳定 id（当 tmdb id 缺失时）
 * @param {string} str
 * @returns {string}
 */
function stableIdFromString(str) {
  if (!str) return 'id_null';
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) + str.charCodeAt(i);
  }
  return 'id_' + (h >>> 0).toString(16);
}

/**
 * 规范化后端的 tmdb_info 字段（兼容不同命名）
 * @param {*} tmdb
 */
function normalizeTmdbInfo(tmdb) {
  if (!tmdb || typeof tmdb !== 'object') return null;
  return {
    id: tmdb.id || tmdb.tmdb_id || null,
    title: tmdb.title || tmdb.name || '',
    originalTitle: tmdb.original_title || tmdb.originalName || tmdb.originalTitle || '',
    description: tmdb.overview || tmdb.description || '',
    releaseDate: tmdb.release_date || tmdb.first_air_date || '',
    backdropPath: tmdb.backdrop_path || tmdb.backdropPath || tmdb.backdrop || '',
    posterPath: tmdb.poster_path || tmdb.posterPath || tmdb.poster || '',
    rating: tmdb.vote_average || tmdb.rating || 0,
    mediaType: tmdb.media_type || tmdb.mediaType || 'tv',
    popularity: tmdb.popularity || 0,
    voteCount: tmdb.vote_count || tmdb.voteCount || 0,
    seasonInfo: tmdb.seasonInfo || tmdb.seasons || null
  };
}

/* ---------------------------
   HTTP 层（带重试、状态 & 数据类型校验）
   - 适配 Widget.http.get 返回的不同形态
   --------------------------- */

/**
 * 发送 GET 并返回解析后的 JSON 对象（若无效抛错）
 * @param {string} url
 * @param {{maxAttempts?: number, timeoutMs?: number}} opts
 * @returns {Promise<object>}
 */
async function httpGetJson(url, opts = {}) {
  const maxAttempts = opts.maxAttempts || HTTP_MAX_ATTEMPTS;
  let attempt = 0;
  let lastErr = null;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      log.debug(`httpGetJson attempt ${attempt} -> ${url}`);
      // 在某些 runtime 中 Widget.http.get 可用
      if (typeof Widget !== 'undefined' && Widget.http && typeof Widget.http.get === 'function') {
        const response = await Widget.http.get(url);
        if (!response) throw new Error('No response');
        // 有些 runtime 包含 status 字段
        if (typeof response.status !== 'undefined') {
          if (response.status < 200 || response.status >= 300) {
            throw new Error(`HTTP status ${response.status}`);
          }
        }
        const data = response.data !== undefined ? response.data : response;
        // 确认是对象或数组
        if (!data || (typeof data !== 'object')) {
          throw new Error('Response is not JSON object/array');
        }
        return data;
      } else if (typeof fetch === 'function') {
        // fallback: fetch (若环境支持)
        const r = await fetch(url);
        if (!r.ok) throw new Error(`HTTP status ${r.status}`);
        const data = await r.json();
        if (!data || typeof data !== 'object') throw new Error('Response is not JSON object/array');
        return data;
      } else {
        throw new Error('No HTTP client available');
      }
    } catch (err) {
      lastErr = err;
      log.warn(`httpGetJson failed (attempt ${attempt}) for ${url}: ${err.message}`);
      if (attempt < maxAttempts) {
        const waitMs = 150 * Math.pow(2, attempt);
        await new Promise(res => setTimeout(res, waitMs));
      }
    }
  }

  throw lastErr || new Error('Failed to fetch JSON after retries');
}

/* ---------------------------
   缓存层：getCachedOrFetch
   - key: 存储键
   - fetcher: async 函数返回数据
   - ttlMs: 缓存有效时长
   --------------------------- */

/**
 * 获取缓存或执行 fetcher 并缓存结果
 * 返回值直接为 fetcher 返回的数据（未封装 error）
 */
async function getCachedOrFetch(key, fetcher, ttlMs = DEFAULT_CACHE_TTL_MS) {
  try {
    const raw = Storage.getItem(key);
    if (raw) {
      try {
        const obj = JSON.parse(raw);
        if (obj && typeof obj === 'object' && obj.fetchedAt && (Date.now() - obj.fetchedAt < ttlMs) && obj.data) {
          log.debug(`cache hit: ${key}`);
          return obj.data;
        } else {
          log.debug(`cache stale/malformed: ${key}`);
        }
      } catch (e) {
        log.debug(`cache parse error for ${key}: ${e.message}`);
      }
    }
  } catch (e) {
    // ignore storage read errors
  }

  // fetch fresh
  const data = await fetcher();
  try {
    Storage.setItem(key, JSON.stringify({ fetchedAt: Date.now(), data }));
  } catch (e) {
    // ignore storage write errors
  }
  return data;
}

/* ---------------------------
   数据获取逻辑（Bangumi 数据与 Trending 数据）
   - 优先尝试 latest 文件（短 TTL），失败则按日期回退（长 TTL）
   --------------------------- */

/**
 * 获取 bangumi 全量数据（带回退）
 * 策略：
 *  1. 尝试 latest.json（短缓存）
 *  2. 按日期回退尝试 bangumi_enriched_{YYYYMMDD}.json（日期缓存）
 *  3. 若都失败，返回空周数据
 *
 * @returns {Promise<object>}
 */
async function fetchBangumiData() {
  const latestUrl = "https://assets.vvebo.vip/scripts/datas/latest.json";
  const latestCacheKey = "forward_bangumi_latest_v1";

  // 1. latest 优先（缓存短）
  try {
    const data = await getCachedOrFetch(latestCacheKey, async () => {
      try {
        return await httpGetJson(latestUrl, { maxAttempts: 2 });
      } catch (e) {
        // propagate to indicate latest failed so caller will try fallback
        throw e;
      }
    }, DEFAULT_CACHE_TTL_MS);

    if (isValidBangumiData(data)) {
      log.info("Bangumi 数据获取成功 (latest.json)");
      return data;
    } else {
      log.warn("latest.json 格式不符合预期，继续按日期回退");
    }
  } catch (err) {
    log.warn("获取 latest.json 失败:", err.message);
  }

  // 2. 按日期回退（使用 UTC 以减少时区问题）
  for (let i = 0; i < DATE_BACKOFF_DAYS; i++) {
    try {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const dateStr = `${d.getUTCFullYear()}${String(d.getUTCMonth()+1).padStart(2,'0')}${String(d.getUTCDate()).padStart(2,'0')}`;
      const dataUrl = `https://assets.vvebo.vip/scripts/datas/bangumi_enriched_${dateStr}.json`;
      const cacheKey = `forward_bangumi_date_${dateStr}_v1`;

      const data = await getCachedOrFetch(cacheKey, async () => {
        return await httpGetJson(dataUrl, { maxAttempts: 2 });
      }, DATE_BACKOFF_CACHE_TTL_MS);

      if (isValidBangumiData(data)) {
        log.info(`Bangumi 数据获取成功（按日期），使用: ${dateStr}`);
        return data;
      } else {
        log.warn(`${dateStr} 数据格式异常，继续回退`);
      }
    } catch (err) {
      log.warn(`按日期获取失败（回退 ${i} 天）: ${err.message}`);
      // 继续下一天
    }
  }

  log.error("所有日期的数据都无法获取，返回空数据结构");
  return emptyWeekData();
}

/**
 * 获取 Trending 数据（热度列表）
 * 策略与 fetchBangumiData 一致：优先 latest_bangumi_trending.json -> 按日期回退 latest_bangumi_trending_{YYYYMMDD}.json
 */
async function fetchTrendingData() {
  const latestUrl = "https://assets.vvebo.vip/scripts/datas/latest_bangumi_trending.json";
  const latestCacheKey = "forward_bangumi_trending_latest_v1";

  try {
    const data = await getCachedOrFetch(latestCacheKey, async () => {
      return await httpGetJson(latestUrl, { maxAttempts: 2 });
    }, DEFAULT_CACHE_TTL_MS);

    if (Array.isArray(data) || isValidBangumiData(data)) {
      log.info("Bangumi 热度数据获取成功 (latest_bangumi_trending.json)");
      return data;
    } else {
      log.warn("latest_bangumi_trending.json 格式不对，继续按日期回退");
    }
  } catch (err) {
    log.warn("获取 latest_bangumi_trending.json 失败:", err.message);
  }

  // 回退按日期（尝试同命名规律）
  for (let i = 0; i < DATE_BACKOFF_DAYS; i++) {
    try {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const dateStr = `${d.getUTCFullYear()}${String(d.getUTCMonth()+1).padStart(2,'0')}${String(d.getUTCDate()).padStart(2,'0')}`;
      const dataUrl = `https://assets.vvebo.vip/scripts/datas/latest_bangumi_trending_${dateStr}.json`;
      const cacheKey = `forward_bangumi_trending_date_${dateStr}_v1`;

      const data = await getCachedOrFetch(cacheKey, async () => {
        return await httpGetJson(dataUrl, { maxAttempts: 2 });
      }, DATE_BACKOFF_CACHE_TTL_MS);

      if (Array.isArray(data) || isValidBangumiData(data)) {
        log.info(`Bangumi 热度数据获取成功（按日期），使用: ${dateStr}`);
        return data;
      } else {
        log.warn(`${dateStr} 热度数据格式异常，继续回退`);
      }
    } catch (err) {
      log.warn(`按日期获取热度数据失败（回退 ${i} 天）: ${err.message}`);
    }
  }

  log.warn("所有热度数据获取失败，返回空数组");
  return [];
}

/* ---------------------------
   数据格式化（输出给前端的统一模型）
   目标字段：
   {
     id, type, title, description, releaseDate, backdropPath, posterPath,
     rating, mediaType, genreTitle, bangumiUrl, tmdbInfo, hasTmdb, seasonInfo,
     originalTitle, popularity, voteCount, bangumiRating?, bangumiRank?
   }
   --------------------------- */

/**
 * 格式化单日列表
 * @param {*} animeList 原始数组
 * @returns {Array}
 */
function formatAnimeData(animeList) {
  if (!Array.isArray(animeList)) return [];

  const valid = animeList.filter(item => item && item.bangumi_name && item.bangumi_url);
  const mapped = valid.map(item => {
    const tmdbNorm = normalizeTmdbInfo(item.tmdb_info) || {};
    const id = tmdbNorm.id || (item.bangumi_url ? stableIdFromString(item.bangumi_url) : stableIdFromString(item.bangumi_name || 'unknown'));
    return {
      id,
      type: "bangumi",
      title: item.bangumi_name || tmdbNorm.title || '',
      description: tmdbNorm.description || item.description || '',
      releaseDate: tmdbNorm.releaseDate || item.releaseDate || '',
      backdropPath: tmdbNorm.backdropPath || item.backdropPath || '',
      posterPath: tmdbNorm.posterPath || item.posterPath || '',
      rating: tmdbNorm.rating || item.rating || 0,
      mediaType: tmdbNorm.mediaType || item.mediaType || "tv",
      genreTitle: item.tmdb_info && item.tmdb_info.genreTitle ? item.tmdb_info.genreTitle : (item.genreTitle || ''),
      bangumiUrl: item.bangumi_url,
      tmdbInfo: tmdbNorm,
      hasTmdb: !!(tmdbNorm && tmdbNorm.id),
      seasonInfo: tmdbNorm.seasonInfo || item.seasonInfo || '',
      originalTitle: tmdbNorm.originalTitle || item.originalTitle || '',
      popularity: tmdbNorm.popularity || item.popularity || 0,
      voteCount: tmdbNorm.voteCount || item.voteCount || 0,
    };
  });

  log.info(`formatAnimeData -> filtered ${animeList.length} => ${mapped.length}`);
  return mapped;
}

/**
 * 格式化热度数据
 * @param {*} trendingList
 * @returns {Array}
 */
function formatTrendingData(trendingList) {
  if (!Array.isArray(trendingList)) return [];

  const valid = trendingList.filter(item => item && item.bangumi_name && item.bangumi_url);
  const mapped = valid.map(item => {
    const tmdbNorm = normalizeTmdbInfo(item.tmdb_info) || {};
    const id = tmdbNorm.id || (item.bangumi_url ? stableIdFromString(item.bangumi_url) : stableIdFromString(item.bangumi_name || 'unknown'));
    return {
      id,
      type: "bangumi",
      title: item.bangumi_name || tmdbNorm.title || '',
      description: tmdbNorm.description || item.description || '',
      releaseDate: tmdbNorm.releaseDate || item.releaseDate || '',
      backdropPath: tmdbNorm.backdropPath || item.backdropPath || '',
      posterPath: tmdbNorm.posterPath || item.posterPath || '',
      rating: tmdbNorm.rating || item.rating || 0,
      mediaType: tmdbNorm.mediaType || item.mediaType || "tv",
      genreTitle: item.tmdb_info && item.tmdb_info.genreTitle ? item.tmdb_info.genreTitle : (item.genreTitle || ''),
      bangumiUrl: item.bangumi_url,
      tmdbInfo: tmdbNorm,
      hasTmdb: !!(tmdbNorm && tmdbNorm.id),
      seasonInfo: tmdbNorm.seasonInfo || item.seasonInfo || '',
      originalTitle: tmdbNorm.originalTitle || item.originalTitle || '',
      popularity: tmdbNorm.popularity || item.popularity || 0,
      voteCount: tmdbNorm.voteCount || item.voteCount || 0,
      // 热度特有
      bangumiRating: item.bangumi_rating || item.bangumiRating || 0,
      bangumiRank: item.bangumi_rank || item.bangumiRank || 0,
    };
  });

  log.info(`formatTrendingData -> filtered ${trendingList.length} => ${mapped.length}`);
  return mapped;
}

/* ---------------------------
   Helper: 根据 day 参数获取当天列表
   - day 可以为 'today' 或 '星期一'..'星期日'
   - useUTC: true 则基于 UTC 计算今天
   --------------------------- */
function getAnimeByDay(data, day = 'today', maxItems = 50, useUTC = true) {
  if (!data || typeof data !== 'object') return [];

  let key;
  if (!day || day === 'today') {
    const d = new Date();
    const idx = useUTC ? d.getUTCDay() : d.getDay(); // 0 = Sunday
    key = WEEKDAY_MAP[idx];
    log.debug(`getAnimeByDay -> today resolved to ${key} (useUTC=${useUTC})`);
  } else if (WEEKDAY_MAP.includes(day)) {
    key = day;
  } else {
    log.warn(`getAnimeByDay -> unknown day "${day}", fallback to today`);
    const d = new Date();
    const idx = useUTC ? d.getUTCDay() : d.getDay();
    key = WEEKDAY_MAP[idx];
  }

  const list = Array.isArray(data[key]) ? data[key] : [];
  return list.slice(0, maxItems || 50);
}

/* ---------------------------
   Exported Module Functions
   --------------------------- */

/**
 * dailySchedule(params)
 * params:
 *   - day: "today" | "星期一" .. "星期日"
 *   - maxItems: number
 *   - useUTC: boolean
 */
async function dailySchedule(params = {}) {
  try {
    const day = params.day || 'today';
    const maxItems = typeof params.maxItems === 'number' ? params.maxItems : 50;
    const useUTC = (typeof params.useUTC === 'boolean') ? params.useUTC : true;

    const data = await fetchBangumiData();
    const animeList = getAnimeByDay(data, day, maxItems, useUTC);
    const formatted = formatAnimeData(animeList);
    return formatted;
  } catch (err) {
    log.error('dailySchedule error:', err.message);
    // 失败时返回空数组（UI 可根据长度判断）
    return [];
  }
}

/**
 * trending(params)
 * params:
 *  - maxItems: number
 */
async function trending(params = {}) {
  try {
    const maxItems = typeof params.maxItems === 'number' ? params.maxItems : 50;
    const raw = await fetchTrendingData();
    // raw 可能既是 array（列表）也可能是 object（包含星期分类） -> 处理 array 或 extract all items
    let trendingList = [];
    if (Array.isArray(raw)) {
      trendingList = raw;
    } else if (typeof raw === 'object') {
      // flatten all weekday arrays into one list
      const days = ["星期一","星期二","星期三","星期四","星期五","星期六","星期日"];
      for (const d of days) {
        if (Array.isArray(raw[d])) trendingList = trendingList.concat(raw[d]);
      }
    }

    // 按后端可能提供的热度排序字段（bangumi_rank / popularity）做一次稳定排序（若提供的话）
    trendingList.sort((a, b) => {
      const ra = (a && (a.bangumi_rank || a.popularity || (a.tmdb_info && a.tmdb_info.popularity))) || 0;
      const rb = (b && (b.bangumi_rank || b.popularity || (b.tmdb_info && b.tmdb_info.popularity))) || 0;
      return ra - rb; // 小到大，如果 rank 更小表示排名更靠前
    });

    const sliced = trendingList.slice(0, maxItems);
    return formatTrendingData(sliced);
  } catch (err) {
    log.error('trending error:', err.message);
    return [];
  }
}

/* ---------------------------
   Exports (depending on runtime, adapt as needed)
   --------------------------- */
// 如果运行环境需要把函数挂在某个全局对象，此处注入。例如：
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    WidgetMetadata,
    fetchBangumiData,
    fetchTrendingData,
    dailySchedule,
    trending,
    // 暴露工具以便测试
    _utils: {
      httpGetJson,
      isValidBangumiData,
      normalizeTmdbInfo,
      stableIdFromString,
      getCachedOrFetch
    }
  };
} else {
  // 在浏览器/Widget 环境下，可能不需要显式导出
  try {
    // 尝试把元数据挂到全局，方便 runtime 读取
    if (typeof Widget !== 'undefined') {
      Widget.WidgetMetadata = Widget.WidgetMetadata || WidgetMetadata;
    }
    // 也把函数挂全局，便于调试（若环境允许）
    if (typeof globalThis !== 'undefined') {
      globalThis.forward_bangumi = {
        WidgetMetadata,
        fetchBangumiData,
        fetchTrendingData,
        dailySchedule,
        trending
      };
    }
  } catch (e) {
    // ignore
  }
}

/* ---------------------------
   说明（简短）
   - 主要提升：HTTP 重试、响应检测、UTC 日期回退、缓存、稳定 ID、字段规范化
   - 建议：在集成到 UI 后，对 posterPath/backdropPath 做占位处理以改善体验
   - 如果需要，我可以为你生成一个 patch/diff 或分段输出（便于逐步替换）
   --------------------------- */