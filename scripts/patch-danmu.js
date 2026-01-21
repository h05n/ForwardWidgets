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
  return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function 查找对象块(source, anchorRegex) {
  const m = anchorRegex.exec(source);
  if (!m) throw new Error(`[补丁] 找不到锚点：${anchorRegex}`);
  const startIdx = m.index + m[0].length;

  let i = startIdx;
  while (i < source.length && /\s/.test(source[i])) i++;
  if (source[i] !== "{") throw new Error(`[补丁] 锚点后面期望是 "{"，但在位置 ${i} 不是`);

  const blockStart = i;
  let depth = 0;

  let inStr = null;
  let inLineComment = false;
  let inBlockComment = false;

  for (; i < source.length; i++) {
    const ch = source[i];
    const next = source[i + 1];

    if (inLineComment) {
      if (ch === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (inStr) {
      if (ch === "\\" && i + 1 < source.length) {
        i++;
        continue;
      }
      if (ch === inStr) inStr = null;
      continue;
    }

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

    if (ch === "'" || ch === '"' || ch === "`") {
      inStr = ch;
      continue;
    }

    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) {
        const blockEnd = i + 1;
        return { blockStart, blockEnd, block: source.slice(blockStart, blockEnd) };
      }
    }
  }

  throw new Error("[补丁] 对象块没有正常闭合（大括号不匹配）。");
}

function 在对象中替换字段(objText, fieldName, newValue) {
  const re = new RegExp(`\\b${fieldName}\\s*:\\s*(["'])[\\s\\S]*?\\1`);
  const m = re.exec(objText);
  if (!m) throw new Error(`[补丁] WidgetMetadata 中找不到字段：${fieldName}`);
  const replacement = `${fieldName}:"${逃逸成JS字符串内容(newValue)}"`;
  return objText.replace(re, replacement);
}

function 替换变量字符串(source, varName, newValue) {
  const re = new RegExp(`\\b(?:let|const|var)\\s+${varName}\\s*=\\s*(["'])[\\s\\S]*?\\1\\s*;`);
  const m = re.exec(source);
  if (!m) throw new Error(`[补丁] 找不到变量声明：${varName}`);
  return source.replace(re, `let ${varName}="${逃逸成JS字符串内容(newValue)}";`);
}

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

  let upstreamUrl = "";
  let upstreamSha = "";
  for (let i = 3; i < args.length; i++) {
    if (args[i] === "--upstream-url") upstreamUrl = args[++i] || "";
    else if (args[i] === "--upstream-sha") upstreamSha = args[++i] || "";
  }

  const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
  let source = fs.readFileSync(inputPath, "utf8");

  source = 去掉旧补丁头(source);

  // 1) 强制替换 widgetVersion
  source = 替换变量字符串(source, "widgetVersion", cfg.version);

  // 2) 仅在 WidgetMetadata 对象块内替换字段
  const meta = 查找对象块(source, /WidgetMetadata\s*=\s*/g);
  let obj = meta.block;

  obj = 在对象中替换字段(obj, "description", cfg.description);
  obj = 在对象中替换字段(obj, "author", cfg.author);
  obj = 在对象中替换字段(obj, "site", cfg.site);
  obj = 在对象中替换字段(obj, "requiredVersion", cfg.requiredVersion);

  source = source.slice(0, meta.blockStart) + obj + source.slice(meta.blockEnd);

  // 3) 写入生成记录注释
  const now = new Date().toISOString();
  const header =
`/* PATCHED-BY: forward-danmu-patcher
 * 生成时间: ${now}
 * 上游真实URL: ${upstreamUrl || "(未知)"}
 * 上游SHA256: ${upstreamSha || "(未知)"}
 * 强制替换字段:
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
