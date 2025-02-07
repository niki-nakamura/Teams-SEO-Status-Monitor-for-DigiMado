#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import os
from collections import deque

# 調査対象のURLを digi-mado.jp に変更
START_URL = "https://digi-mado.jp/"
BASE_DOMAIN = "digi-mado.jp"  # ドメインチェックに使用
TEAMS_WEBHOOK_URL = os.environ.get("TEAMS_WEBHOOK_URL")

visited = set()
# broken_links は (参照元, 壊れているリンク, ステータス) のタプル形式
broken_links = []

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
                resp = requests.get(current, timeout=10)
                if resp.status_code >= 400:
                    broken_links.append((current, current, resp.status_code))
                    continue
                soup = BeautifulSoup(resp.text, 'html.parser')
                for a in soup.find_all('a', href=True):
                    link = urljoin(current, a['href'])
                    link = urlparse(link)._replace(fragment="").geturl()
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
        r = requests.head(url, timeout=5)
        if r.status_code >= 400:
            ref = source if source else url
            broken_links.append((ref, url, r.status_code))
    except Exception as e:
        ref = source if source else url
        broken_links.append((ref, url, f"Error: {str(e)}"))

def send_teams_notification(broken):
    if not TEAMS_WEBHOOK_URL:
        print("TEAMS_WEBHOOK_URL is not set.")
        return

    msg = "\n"
    msg += "404チェック結果🗣📢\n\n"
    msg += "以下の検出された404（またはリンク切れ）の情報です:\n\n"

    if not broken:
        msg += "No broken links found!\n"
    else:
        for source, url, status in broken:
            msg += f"- {url} [Status: {status}]\n"
            msg += f"検出記事元：{source}\n\n"

    try:
        requests.post(TEAMS_WEBHOOK_URL, json={"text": msg}, timeout=10)
    except Exception as e:
        print(f"Teams notification failed: {e}")

def main():
    print(f"Starting crawl from {START_URL}")
    crawl(START_URL)
    print("Crawl finished.")
    print(f"Detected {len(broken_links)} broken links.")
    send_teams_notification(broken_links)

if __name__ == "__main__":
    main()
