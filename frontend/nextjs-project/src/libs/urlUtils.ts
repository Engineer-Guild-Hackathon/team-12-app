import * as cheerio from "cheerio";

/**
 * URLからページのタイトルを取得します。
 * 取得できない場合は元のURLを返します。
 * @param url タイトルを取得したいURL
 * @returns ページのタイトルまたは元のURL
 */
export async function getTitleFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
        "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${url}. Status: ${response.status}`);
      return url; // 失敗したらURLを返す
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
    const title = $("title").first().text().trim();

    // og:titleがあれば優先し、なければtitleタグ、それもなければURLを返す
    return ogTitle || title || url;
  } catch (error) {
    console.error(`Error fetching title for ${url}:`, error);
    return url; // エラー時もURLを返す
  }
}
