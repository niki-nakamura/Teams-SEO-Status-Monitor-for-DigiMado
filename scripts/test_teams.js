function createTeamsMessageForTest() {
  const testTweetUrl = 'https://x.com/googlesearchc/status/1873848143168889194?test=123';
  return {
    text: `Google Search Central のXアカウントが更新されました!! 詳細を見る: ${testTweetUrl}`
  };
}

  return {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions", // https に変更
    "summary": "Google Search Central のXアカウント更新",
    "themeColor": "0076D7",
    "title": "Google Search Central のXアカウントが更新されました!!",
    // シンプルなテキストに変更（リンクは potentialAction で設定）
    "text": "Google Search Central's X account has been updated!",
    "potentialAction": [
      {
        "@type": "OpenUri",
        "name": "X(Twitter)で詳細を見る",
        "targets": [
          { "os": "default", "uri": testTweetUrl }
        ]
      }
    ]
  };
}
