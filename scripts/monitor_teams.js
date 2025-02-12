/* monitor_teams.js */
const fs = require('fs');
const fetch = require('node-fetch');
const { execSync } = require('child_process');

const TEAMS_WEBHOOK_URL2 = process.env.TEAMS_WEBHOOK_URL2;
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

// @googlesearchc の数値ID（実際のIDに差し替え）
const TARGET_USER_ID = '22046611';

// 前回取得した最新ツイートIDを記録するファイル
const LATEST_ID_FILE = './latest_tweet_id.json';

/**
 * Teams向けのMessageCardペイロードを作成する関数
 */
function createTeamsMessage(tweet) {
  const tweetUrl = `https://x.com/googlesearchc/status/${tweet.id}`;
  return {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    "summary": "Google Search Central のXアカウント更新",
    "themeColor": "0076D7",
    "title": "Google Search Central のXアカウントが更新されました!!",
    "text": `Google Search Central's X account has been updated!\n\n[詳細を見る](${tweetUrl})\n\nURL: ${tweetUrl}`,
    "potentialAction": [
      {
        "@type": "OpenUri",
        "name": "X(Twitter)で詳細を見る",
        "targets": [
          { "os": "default", "uri": tweetUrl }
        ]
      }
    ]
  };
}

/** Teamsへ送信 */
async function postToTeams(tweet) {
  const payload = createTeamsMessage(tweet);
  const res = await fetch(TEAMS_WEBHOOK_URL2, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`Teams Webhook error: ${res.status} ${res.statusText}`);
  }
}

/** 前回の最新IDをファイルから読む */
function getLatestTweetIdFromFile() {
  try {
    if (fs.existsSync(LATEST_ID_FILE)) {
      const data = fs.readFileSync(LATEST_ID_FILE, 'utf8');
      const json = JSON.parse(data);
      return json.latest_id;
    }
  } catch (error) {
    console.error('Error reading ID file:', error);
  }
  return null;
}

/** 最新IDをファイルに書き込み、gitコミット＆プッシュ */
function saveLatestTweetIdToFile(tweetId) {
  try {
    fs.writeFileSync(LATEST_ID_FILE, JSON.stringify({ latest_id: tweetId }), 'utf8');
    console.log(`Wrote latest tweet ID to ${LATEST_ID_FILE}: ${tweetId}`);

    execSync('git config user.name "github-actions[bot]"');
    execSync('git config user.email "github-actions[bot]@users.noreply.github.com"');

    execSync(`git add ${LATEST_ID_FILE}`);
    execSync(`git commit -m "Update latest_tweet_id.json to ${tweetId} [skip ci]"`);
    execSync('git push');

    console.log('Pushed updated latest_tweet_id.json to the repository.');
  } catch (error) {
    console.error('Error writing ID file or pushing to repo:', error);
  }
}

/** Twitter APIで最新ツイートを取得 */
async function fetchLatestTweet() {
  const url = `https://api.twitter.com/2/users/${TARGET_USER_ID}/tweets`
            + `?max_results=5`
            + `&tweet.fields=created_at,text`
            + `&expansions=attachments.media_keys`
            + `&media.fields=url,preview_image_url`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`
    }
  });

  // レート制限の場合の再試行処理
  if (res.status === 429) {
    const resetTime = res.headers.get("x-rate-limit-reset");
    const now = Math.floor(Date.now() / 1000);
    const waitSeconds = resetTime ? resetTime - now : 60;
    console.error(`Rate limit exceeded. Waiting for ${waitSeconds} seconds before retrying.`);
    await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
    return fetchLatestTweet();
  }

  if (!res.ok) {
    throw new Error(`Twitter API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (!data || !data.data || data.data.length === 0) {
    return null;
  }

  // 最新ツイート（配列先頭）
  const tweetObj = data.data[0];
  let mediaUrl = null;

  if (data.includes && data.includes.media && data.includes.media.length > 0) {
    const firstMedia = data.includes.media[0];
    mediaUrl = firstMedia.url || firstMedia.preview_image_url || null;
  }

  return {
    id: tweetObj.id,
    text: tweetObj.text,
    created_at: tweetObj.created_at,
    mediaUrl
  };
}

/** メイン処理 */
(async function main() {
  try {
    const prevLatestId = getLatestTweetIdFromFile();
    const latestTweet = await fetchLatestTweet();

    if (!latestTweet) {
      console.log('No tweets found for the user.');
      return;
    }

    const currentLatestId = latestTweet.id;
    if (currentLatestId !== prevLatestId) {
      console.log('New tweet found! Sending to Teams...');
      await postToTeams(latestTweet);
      saveLatestTweetIdToFile(currentLatestId);
    } else {
      console.log('No new tweet since last check.');
    }
  } catch (error) {
    console.error('Error in monitoring:', error);
    process.exit(1);
  }
})();

