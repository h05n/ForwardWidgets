/**
 * 通用弹幕补丁脚本（稳定版）
 *
 * 功能：
 * - 读取上游 JS 文件
 * - 可靠定位 WidgetMetadata={...} 这个对象块（支持换行/注释/字符串，避免括号匹配错误）
 * - 只在 WidgetMetadata 对象里替换指定字段，避免误伤其它位置
 * - 同时强制替换 widgetVersion 变量
 * - 在文件头插入一段“生成记录注释”（生成时间/上游真实URL/sha256/替换内容）
 *
 * 用法：
 * node scripts/patch-danmu.js <输入.js> <输出.js> <配置.json> [--upstream-url <url>] [--upstream-sha <sha256>]
 */

const fs = require("fs");
const path = require("path");

function 逃逸成JS字符串内容(s) {
  // 把字符串变成可安全放进 JS 双引号字符串里的内容
  return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * 从源码中找到某个“对象字面量块”，例如 WidgetMetadata={ ... } 的 {...} 部分
 * 这里用大括号深度匹配，并且识别字符串/注释，避免被字符串里的 { } 干扰
 */
function 查找对象块(source, anchorRegex) {
  const m = anchorRegex.exec(source);
  if (!m) throw new Error(`[补丁] 找不到锚点：${anchorRegex}`);
  const startIdx = m.index + m[0].length; // "WidgetMetadata=" 之后的位置

  // 跳过空白
  let i = startIdx;
  while (i < source.length && /\s/.test(source[i])) i++;
  if (source[i] !== "{") throw new Error(`[补丁] 锚点后面期望是 "{"，但在位置 ${i} 不是`);

  const blockStart = i;
  let depth = 0;

  // 以下状态用于正确跳过字符串和注释
  let inStr = null; // "'" | '"' | "`"
  let inLineComment = false;
  let inBlockComment = false;

  for (; i < source.length; i++) {
    const ch = source[i];
    const next = source[i + 1];

    // 行注释中，遇到换行结束
    if (inLineComment) {
      if (ch === "\n") inLineComment = false;
      continue;
    }

    // 块注释中，遇到 */ 结束
    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    // 字符串中，处理转义并寻找字符串结束符
    if (inStr) {
      if (ch === "\\" && i + 1 < source.length) {
        i++; // 跳过被转义的字符
        continue;
      }
      if (ch === inStr) inStr = null;
      continue;
    }

    // 进入注释
    if (ch === "/" && next === "/") {
      inLineComment = true;
      i++;
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlockComment = true;
      i++;
      continue;
    }

    // 进入字符串
    if (ch === "'" || ch === '"' || ch === "`") {
      inStr = ch;
      continue;
    }

    // 大括号深度统计
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) {
        const blockEnd = i + 1; // 包含结尾的 }
        return { blockStart, blockEnd, block: source.slice(blockStart, blockEnd) };
      }
    }
  }

  throw new Error("[补丁] 对象块没有正常闭合（大括号不匹配）。");
}

/**
 * 仅在 WidgetMetadata 对象文本中替换某个字段
 * 支持：field:"..." 或 field : '...' 等形式（单双引号/空格都兼容）
 * 替换时统一写成双引号：field:"新值"
 */
function 在对象中替换字段(objText, fieldName, newValue) {
  const re = new RegExp(`\\b${fieldName}\\s*:\\s*(["'])[\\s\\S]*?\\1`);
  const m = re.exec(objText);
  if (!m) throw new Error(`[补丁] WidgetMetadata 中找不到字段：${fieldName}`);
  const replacement = `${fieldName}:"${逃逸成JS字符串内容(newValue)}"`;
  return objText.replace(re, replacement);
}

/**
 * 替换变量声明：let/const/var widgetVersion = "..."
 * 支持单双引号/空格/换行
 * 替换后统一写成：let widgetVersion="新值";
 */
function 替换变量字符串(source, varName, newValue) {
  const re = new RegExp(`\\b(?:let|const|var)\\s+${varName}\\s*=\\s*(["'])[\\s\\S]*?\\1\\s*;`);
  const m = re.exec(source);
  if (!m) throw new Error(`[补丁] 找不到变量声明：${varName}`);
  return source.replace(re, `let ${varName}="${逃逸成JS字符串内容(newValue)}";`);
}

/**
 * 如果文件已经被本脚本打过补丁（头部有 PATCHED-BY 注释），先删掉旧头，避免越叠越多
 */
function 去掉旧补丁头(source) {
  const start = source.indexOf("/* PATCHED-BY: forward-danmu-patcher");
  if (start !== 0) return source;
  const end = source.indexOf("*/");
  if (end === -1) return source;
  return source.slice(end + 2).replace(/^\s*\n/, "");
}

function main() {
  const args = process.argv.slice(2);
  const inputPath = args[0];
  const outputPath = args[1];
  const configPath = args[2];

  if (!inputPath || !outputPath || !configPath) {
    console.error("用法：node scripts/patch-danmu.js <输入.js> <输出.js> <配置.json> [--upstream-url <url>] [--upstream-sha <sha256>]");
    process.exit(1);
  }

  // 可选参数：上游真实URL、上游sha256（由 Actions 传入，用于记录）
  let upstreamUrl = "";
  let upstreamSha = "";
  for (let i = 3; i < args.length; i++) {
    if (args[i] === "--upstream-url") upstreamUrl = args[++i] || "";
    else if (args[i] === "--upstream-sha") upstreamSha = args[++i] || "";
  }

  const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
  let source = fs.readFileSync(inputPath, "utf8");

  // 先清掉旧补丁头
  source = 去掉旧补丁头(source);

  // 1) 强制替换 widgetVersion
  source = 替换变量字符串(source, "widgetVersion", cfg.version);

  // 2) 定位 WidgetMetadata 对象块，只在其中替换字段
  const meta = 查找对象块(source, /WidgetMetadata\s*=\s*/g);
  let obj = meta.block;

  // 你要求的：把 id 也强制替换成 danmu（由 patch.config.json 决定）
  obj = 在对象中替换字段(obj, "id", cfg.id);
  obj = 在对象中替换字段(obj, "description", cfg.description);
  obj = 在对象中替换字段(obj, "author", cfg.author);
  obj = 在对象中替换字段(obj, "site", cfg.site);
  obj = 在对象中替换字段(obj, "requiredVersion", cfg.requiredVersion);

  // 把替换后的对象块拼回原文件
  source = source.slice(0, meta.blockStart) + obj + source.slice(meta.blockEnd);

  // 3) 在文件头加入生成记录
  const now = new Date().toISOString();
  const header =
`/* PATCHED-BY: forward-danmu-patcher
 * 生成时间: ${now}
 * 上游真实URL: ${upstreamUrl || "(未知)"}
 * 上游SHA256: ${upstreamSha || "(未知)"}
 * 强制替换字段:
 *   id=${cfg.id}
 *   widgetVersion=${cfg.version}
 *   description=${cfg.description}
 *   author=${cfg.author}
 *   site=${cfg.site}
 *   requiredVersion=${cfg.requiredVersion}
 */\n`;

  const finalText = header + source;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, finalText, "utf8");
  console.log(`[补丁] 完成 -> ${outputPath}`);
}

main();
