// Prompt Injection 検出用の正規表現群
const INJECTION_REGEXPS: RegExp[] = [
  /\b(ignore|disregard|forget)\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|messages?)\b/i,
  /\b(overwrite|override|replace)\s+(the\s+)?(system|initial|developer)\s+(prompt|instructions?)\b/i,
  /\b(reveal|show|print|expose|leak)\s+(the\s+)?(system|hidden|internal).{0,20}(prompt|policy|instructions?)\b/i,
  /\b(show|print|dump)\s+(your\s+)?(prompt|instructions?|policy|secret|api\s*key|keys?)\b/i,
  /\b(disable|bypass|circumvent|break|remove).{0,15}(safety|guardrails?|filter|policy|content\s*policy|constraints?)\b/i,
  /\b(no|without)\s+(limitations|filters|safety|rules|guardrails)\b/i,
  /\b(developer\s*mode|sudo\s*mode|do\s*any(thing)?\s*now|DAN)\b/i,
  /\b(jail\s*-?\s*break|jailbreak|uncensored|unfiltered)\b/i,
  /\b(chain\s*of\s*thought|CoT|step\s*by\s*step\s*reasoning)\b/i,
  /\b(explain|show)\s+(your\s+)?(reasoning|thought\s*process|deliberation)\b/i,
  /\b(base64|rot13|hex|url-?encode|unicode|zero-?width|zwsp)\s+(decode|decoding|encode|encoding)\b/i,
  /\b(this\s+is\s+not\s+(an|a)\s+instruction)\b/i,

  /(これまで|前|過去|以前)の(指示|命令|ルール|制約)を(無視|忘れ|破棄)/i,
  /(上書き|置き換え|差し替え)(て|ろ|して).{0,12}(システム|初期|内部|開発者)(プロンプト|指示|設定)/i,
  /(システム|内部|隠し|開発者)(プロンプト|指示|方針|ポリシー)を(開示|表示|出力|暴露)/i,
  /(秘密|機密|シークレット|API.?キー?|鍵)を(表示|出力|教え|見せ)/i,
  /(安全|セーフティ|ポリシー|ガードレール|フィルタ)を(無効|解除|回避|迂回|バイパス)/i,
  /(禁止|制限)を(解除|無視)/i,
  /(開発者モード|デベロッパーモード|DAN|ジェイルブレイク|脱獄)/i,
  /(この文|次の文|これ)は(指示|命令)では(ない|ありません)/i,
];

// ゼロ幅文字の正規表現
const ZERO_WIDTH_REGEX = /[\u200B-\u200F\uFEFF]/g;

function normalizeInput(input: string): string {
  if (!input) return "";
  // NFKC 正規化
  const nfkc = input.normalize ? input.normalize("NFKC") : input;
  return nfkc.replace(ZERO_WIDTH_REGEX, "").trim();
}

export function isInvalidQuestion(input: string): boolean {
  const normalized = normalizeInput(input);
  if (!normalized) return false;

  for (const regex of INJECTION_REGEXPS) {
    if (regex.test(normalized)) {
      return true;
    }
  }
  return false;
}
