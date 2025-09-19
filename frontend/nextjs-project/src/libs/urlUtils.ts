import * as cheerio from "cheerio";

/**
 * 文字コードのエイリアスを正規化します。
 * 例: "shift_jis" -> "shift-jis"
 * @param charset 文字コード文字列
 * @returns 正規化された文字コード文字列
 */
function normalizeCharset(charset: string): string {
  const lowerCharset = charset.toLowerCase().trim();
  if (lowerCharset === "shift_jis" || lowerCharset === "x-sjis") {
    return "shift-jis";
  }
  if (lowerCharset === "euc_jp") {
    return "euc-jp";
  }
  return lowerCharset;
}

/**
 * URLからページのタイトルを取得します。
 * 文字コードを自動判定し、文字化けの可能性がある場合は元のURLを返します。
 * @param url タイトルを取得したいURL
 * @returns ページのタイトルまたは元のURL
 */
export async function getTitleFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
        "Accept-Language": "ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000), // 8秒でタイムアウト
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${url}. Status: ${response.status}`);
      return url; // 失敗したらURLを返す
    }

    const buffer = await response.arrayBuffer();
    const view = new Uint8Array(buffer);

    const contentType = response.headers.get("content-type");
    let charset = contentType?.match(/charset=([^;]+)/)?.[1];

    if (!charset) {
      const preliminaryHtml = new TextDecoder("latin1").decode(
        view.slice(0, 2048),
      );
      const metaCharset =
        preliminaryHtml.match(/<meta.*?charset=["']?([^"'>\s]+)/i)?.[1] ||
        preliminaryHtml.match(
          /<meta.*?content=["']?.*?charset=([^"'>\s]+)/i,
        )?.[1];

      if (metaCharset) {
        charset = metaCharset;
      }
    }

    const finalCharset = normalizeCharset(charset || "utf-8");

    let html: string;
    try {
      const decoder = new TextDecoder(finalCharset, { fatal: true });
      html = decoder.decode(view);
    } catch (e) {
      console.warn(
        `Strict decoding with ${finalCharset} for ${url} failed. Retrying in non-fatal mode.`,
        e,
      );
      const decoder = new TextDecoder(finalCharset, { fatal: false });
      html = decoder.decode(view);
    }

    const $ = cheerio.load(html);
    const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
    const title = $("title").first().text().trim();
    const resultTitle = ogTitle || title;

    if (resultTitle) {
      // タイトルが置換文字「」のみで構成されている場合はURLを返す
      if (/^\uFFFD+$/.test(resultTitle)) {
        console.log(
          `Title for ${url} consists only of replacement characters. Returning URL.`,
        );
        return url;
      }
      return resultTitle;
    }

    return url;
  } catch (error) {
    console.error(`Error processing title for ${url}:`, error);
    return url;
  }
}
