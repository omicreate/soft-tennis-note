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
assert.match(html, /app\.js\?v=132/, "app.jsのキャッシュ更新バージョンが最新");
assert.match(html, /styles\.css\?v=132/, "styles.cssのキャッシュ更新バージョンが最新");
assert.match(fs.readFileSync("sw.js", "utf8"), /soft-tennis-logger-v132/, "Service Workerのキャッシュ名が最新");

console.log("responsive-static: ok");
