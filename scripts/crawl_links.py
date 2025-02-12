#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import os
from collections import deque
import gspread
from google.oauth2.service_account import Credentials

# 調査対象のURL（digi-mado.jp）
START_URL = "https://digi-mado.jp/"
BASE_DOMAIN = "digi-mado.jp"  # 内部リンクの判定に使用

visited = set()
# broken_links は (参照元, 壊れているリンク, ステータス) のタプル形式
broken_links = []

# ブラウザ風の User-Agent を設定
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
}

# Teams Webhook用の設定（既存の環境変数から取得）
TEAMS_WEBHOOK_URL = os.environ.get("TEAMS_WEBHOOK_URL")
# Google Sheets用の設定（シートIDのみを指定する）
GOOGLE_SHEET_ID = "1Ht9EjkZebHhm2gA6q5KR16Qs8jppSdaud-QxJZ2y7tU"  # 実際のシートIDに置き換える

def is_internal_link(url):
    parsed = urlparse(url)
    return (parsed.netloc == "" or parsed.netloc.endswith(BASE_DOMAIN))

def crawl(start_url):
    queue = deque([start_url])
    while queue:
        current = queue.popleft()
        if current in visited:
            continue
        visited.add(current)

        if is_internal_link(current):
            try:
                resp = requests.get(current, headers=HEADERS, timeout=10)
                # 404のみを対象とする
                if resp.status_code == 404:
                    broken_links.append((current, current, resp.status_code))
                    continue
                soup = BeautifulSoup(resp.text, 'html.parser')
                for a in soup.find_all('a', href=True):
                    link = urljoin(current, a['href'])
                    # フラグメントを除去
                    link = urlparse(link)._replace(fragment="").geturl()
                    # 発リンクもチェック対象とする
                    if not is_internal_link(link):
                        check_status(link, current)
                    if link not in visited:
                        queue.append(link)
            except Exception as e:
                broken_links.append((current, current, f"Error: {str(e)}"))
        else:
            check_status(current, None)

def check_status(url, source):
    try:
        r = requests.head(url, headers=HEADERS, timeout=5)
        # 404エラーのみをエラー対象とする
        if r.status_code == 404:
            ref = source if source else url
            broken_links.append((ref, url, r.status_code))
    except Exception as e:
        ref = source if source else url
        broken_links.append((ref, url, f"Error: {str(e)}"))

def update_google_sheet(broken):
    """
    Google SheetsのA列に404（またはリンク切れ）URL、B列に検出元記事URLを追加する。
    """
    scope = ["https://www.googleapis.com/auth/spreadsheets"]
    # ここでは service_account.json を利用（ワークフローで作成される一時ファイル）
    creds = Credentials.from_service_account_file("service_account.json", scopes=scope)
    client = gspread.authorize(creds)
    sheet = client.open_by_key(GOOGLE_SHEET_ID).sheet1

    for source, url, status in broken:
        row = [url, source]
        sheet.append_row(row)

def send_teams_notification(broken):
    # サマリーメッセージ作成
    count = len(broken)
    sheets_url = "https://docs.google.com/spreadsheets/d/1Ht9EjkZebHhm2gA6q5KR16Qs8jppSdaud-QxJZ2y7tU/edit?gid=0"  # 実際のURLに置き換える
    msg = f"【404チェック結果】\n404が {count} 件検出されました。\nこちらよりエラーURLを確認してください。\n({sheets_url})"
    
    try:
        r = requests.post(TEAMS_WEBHOOK_URL, json={"text": msg}, headers=HEADERS, timeout=10)
        if r.status_code not in [200, 204]:
            print(f"Teams notification failed with status {r.status_code}: {r.text}")
    except Exception as e:
        print(f"Teams notification failed: {e}")

def main():
    print(f"Starting crawl from {START_URL}")
    crawl(START_URL)
    print("Crawl finished.")
    print(f"Detected {len(broken_links)} broken links.")
    update_google_sheet(broken_links)
    send_teams_notification(broken_links)

if __name__ == "__main__":
    main()
