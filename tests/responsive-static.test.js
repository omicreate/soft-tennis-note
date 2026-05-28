const assert = require("node:assert/strict");
const fs = require("node:fs");

const html = fs.readFileSync("index.html", "utf8");
const css = fs.readFileSync("styles.css", "utf8");

assert.match(html, /viewport-fit=cover/, "safe areaを考慮したviewport設定がある");
assert.match(css, /max-width:\s*430px/, "スマホ幅を基準にしたアプリシェル幅がある");
assert.match(css, /env\(safe-area-inset-bottom\)/, "iPhone下部safe areaの余白を考慮している");
assert.match(css, /word-break:\s*keep-all/, "日本語ラベルの不自然な文字分割を避ける指定がある");
assert.match(css, /line-break:\s*strict/, "日本語改行ルールの指定がある");
assert.match(css, /@media\s*\(max-width:\s*380px\)/, "小さめスマホ向けの調整がある");
assert.match(html, /id="archiveSearchInput"/, "保存済み試合の検索欄がある");
assert.match(html, /id="archiveSortSelect"/, "保存済み試合の並び替えがある");
assert.match(html, /id="archiveCountLabel"/, "保存済み試合の件数表示がある");
assert.match(html, /id="archiveStorageLabel"/, "保存容量の目安表示がある");
assert.match(html, /id="summaryModeControl"/, "サマリー画像の用途切替がある");
assert.match(html, /app-config\.js\?v=137[\s\S]*app\.js\?v=137/, "設定ファイルをapp.jsより先に読み込む");
assert.match(html, /styles\.css\?v=137/, "styles.cssのキャッシュ更新バージョンが最新");
assert.match(fs.readFileSync("sw.js", "utf8"), /soft-tennis-logger-v137/, "Service Workerのキャッシュ名が最新");
assert.match(fs.readFileSync("sw.js", "utf8"), /app-config\.js/, "Service Workerのキャッシュ対象に設定ファイルがある");

console.log("responsive-static: ok");
