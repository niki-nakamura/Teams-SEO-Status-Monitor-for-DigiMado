import os
import requests
from bs4 import BeautifulSoup
import urllib.parse

def get_latest_ranking_info(url):
    response = requests.get(url)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")

    # "Ranking" と表示されている <span> を取得
    ranking_span = soup.find("span", class_="nAlKgGlv8Vo__product-name", string="Ranking")
    if not ranking_span:
        return None

    # その直後にある Ranking 用のテーブルを取得
    ranking_table = ranking_span.find_next("table", class_="ise88CpWulY__psd-table")
    if not ranking_table:
        return None

    first_row = ranking_table.find("tbody").find("tr")
    if not first_row:
        return None

    # Summary (タイトル) とリンク
    summary_td = first_row.find("td", class_="ise88CpWulY__summary")
    summary_text = summary_td.get_text(strip=True) if summary_td else None
    link_tag = summary_td.find("a") if summary_td else None
    summary_link = urllib.parse.urljoin(url, link_tag.get("href")) if link_tag else None

    # Date
    date_td = first_row.find("td", class_="ise88CpWulY__date")
    date_text = date_td.get_text(strip=True) if date_td else None

    # Duration
    duration_td = first_row.find("td", class_="ise88CpWulY__duration")
    duration_span = duration_td.find("span", class_="ise88CpWulY__duration-text") if duration_td else None
    duration_text = duration_span.get_text(strip=True) if duration_span else None

    # ステータスカラー (例: "#1E8E3E" は "Available" 状態)
    icon_div = duration_td.find("div", class_="ise88CpWulY__icon-container") if duration_td else None
    svg_tag = icon_div.find("svg") if icon_div else None
    fill_color = None
    if svg_tag:
        path_tag = svg_tag.find("path")
        if path_tag:
            fill_color = path_tag.get("fill")

    return summary_text, summary_link, date_text, duration_text, fill_color

def post_to_teams(webhook_url, message):
    # Teams へのWebhookは、基本的にJSONペイロード (例: {"text": "本文"}) を受け取ります
    payload = {"text": message}
    response = requests.post(webhook_url, json=payload)
    response.raise_for_status()

def main():
    URL = "https://status.search.google.com/summary"
    info = get_latest_ranking_info(URL)

    if not info:
        print("Ranking 情報が取得できませんでした。")
        return

    summary, link, date_, duration, fill_color = info

    # Available 状態 (#1E8E3E) の場合は投稿をスキップ
    if fill_color == "#1E8E3E":
        print("現在のステータスは「Available」のため、Teamsへのアナウンスは不要です。")
        return

    # Teams用のメッセージ（Teams側での表示形式に合わせ、必要に応じて調整してください）
    message = (
        "【Google Search Status Update】\n\n"
        "現在のSEOアップデート状況:\n"
        f"・Summary: {summary}\n"
        f"・Date: {date_}\n"
        f"・Duration: {duration}\n"
        f"・詳細: {link}\n\n"
        "【注意】大規模改修や大量削除は控えてください。"
    )

    teams_webhook_url = os.environ.get("TEAMS_WEBHOOK_URL2")
    if not teams_webhook_url:
        print("TEAMS_WEBHOOK_URL2 が設定されていません。")
        return

    post_to_teams(teams_webhook_url, message)
    print("Teamsに投稿しました。")

if __name__ == "__main__":
    main()
