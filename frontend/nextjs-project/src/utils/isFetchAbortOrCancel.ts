const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

export const isAbortOrCancel = (e: unknown): boolean => {
  // fetch の中断（DOMException: AbortError）
  if (e instanceof DOMException && e.name === "AbortError") return true;

  if (isObject(e)) {
    // fetch/他実装が name だけ入れるケース
    if (e.name === "AbortError") return true;
    // axios v1+: CanceledError は code: 'ERR_CANCELED'
    if (e.code === "ERR_CANCELED") return true;
    // メッセージに "aborted/canceled" を含む汎用ケース
    if (typeof e.message === "string" && /aborted|canceled/i.test(e.message)) {
      return true;
    }
  }
  return false;
};
