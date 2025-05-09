import os
import requests
import snscrape.modules.twitter as sntwitter

USERNAME = "googlesearchc"

# 環境変数から Teams の Webhook URL を取得
webhook_url = os.environ.get("TEAMS_WEBHOOK_URL")
if not webhook_url:
    raise RuntimeError("Teams Webhook URL (TEAMS_WEBHOOK_URL) が設定されていません。")

# 指定ユーザーの最新ツイートを取得
scraper = sntwitter.TwitterUserScraper(USERNAME)
latest_tweet = next(scraper.get_items(), None)

if not latest_tweet:
    print(f"ツイートが見つかりませんでした: @{USERNAME}")
    exit(0)

tweet_text = latest_tweet.content        # ツイート本文
tweet_url  = latest_tweet.url           # ツイートのURL (https://x.com/...形式)

# ツイートに画像メディアが含まれる場合、そのURLリストを取得
image_urls = []
if latest_tweet.media:
    for media in latest_tweet.media:
        # 写真メディアの場合、fullUrl プロパティを持つ
        if hasattr(media, "fullUrl"):
            image_urls.append(media.fullUrl)

# Teams に送信するペイロードを構築
if image_urls:
    # 画像付き：MessageCard形式でテキスト＋画像を送信
    payload = {
        "@type": "MessageCard",
        "@context": "https://schema.org/extensions",
        "summary": f"New X post from @{USERNAME}",
        "title": f"New post from @{USERNAME}",
        "text": tweet_text,
        "sections": [
            {
                "images": [{"image": url} for url in image_urls]
            }
        ],
        "potentialAction": [
            {
                "@type": "OpenUri",
                "name": "View on X",
                "targets": [
                    {"os": "default", "uri": tweet_url}
                ]
            }
        ]
    }
else:
    # テキストのみ：単純なテキストメッセージ
    payload = {
        "text": f"@{USERNAME} の最新投稿:\n{tweet_text}\n\n[元の投稿を表示]({tweet_url})"
    }

# Teams の Incoming Webhook にPOSTリクエストを送信
response = requests.post(webhook_url, json=payload)
try:
    response.raise_for_status()
    print("✅ Teamsへの通知に成功しました。")
except Exception as e:
    print(f"❌ Teamsへの通知に失敗しました: {e}\nResponse: {response.text}")
    exit(1)
