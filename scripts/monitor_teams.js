// scripts/monitor_teams.js

const fs = require('fs');
const url = require('url');  // NodeのURLモジュールをインポート【追加】

// 対象サイトやファイルの設定
const SITE_NAME = "DigiMado";  // サイト名（例）
const linksFilePath = "links.json";          // クロールしたリンク一覧のファイル
const brokenLinksFilePath = "broken_links.json";  // 404リンク一覧のファイル

// リンク一覧ファイルを読み込む
let allLinks;
try {
  const linksData = fs.readFileSync(linksFilePath, 'utf-8');
  allLinks = JSON.parse(linksData);
} catch (err) {
  console.error(`Failed to read links file: ${err.message}`);
  process.exit(1);
}

const totalLinks = Array.isArray(allLinks) ? allLinks.length : 0;

// 404リンク一覧ファイルを読み込む
let brokenLinks;
try {
  const brokenData = fs.readFileSync(brokenLinksFilePath, 'utf-8');
  brokenLinks = JSON.parse(brokenData);
} catch (err) {
  console.error(`Failed to read broken-links file: ${err.message}`);
  brokenLinks = [];
}

const brokenCount = Array.isArray(brokenLinks) ? brokenLinks.length : 0;

// ツイートするメッセージを組み立て
let statusMessage;
if (brokenCount === 0) {
  statusMessage = `${SITE_NAME}サイトのリンクチェック: 全${totalLinks}ページに404リンクはありません ✅`;
} else {
  statusMessage = `${SITE_NAME}サイトのリンクチェック: 全${totalLinks}ページ中${brokenCount}件の無効リンクを検出 🚨`;
  // いくつかの無効リンクのURLをメッセージに含める（必要に応じて短縮）
  const listSamples = brokenLinks.slice(0, 3).map(link => {
    // 各リンクのURL文字列を取得（オブジェクトの場合はプロパティから取得）
    const linkUrl = typeof link === 'string' ? link : link.url || '';
    // 必要ならベースURLと結合（例: 相対パスの場合）
    try {
      return url.URL ? new url.URL(linkUrl, "https://example.com").href : linkUrl;
    } catch {
      return linkUrl;
    }
  });
  statusMessage += `\n例: ${listSamples.join(', ')}${brokenCount > listSamples.length ? ' 他' : ''}`;
}

// 標準出力にメッセージを出力（後続のActionでこの出力をツイートに利用）
console.log(statusMessage);
