import type { CarePointDef } from './points';

export type AIStatus =
  | '与要点一致'
  | '表达模糊，需再次确认'
  | '未明确提及'
  | '未提及'
  | '依据不足';

export type Execution = '已按要点执行' | '部分执行' | '暂未执行' | '不适用';

export interface ReviewInput {
  point: CarePointDef;
  execution: Execution;
  rawText: string;
}

export interface ReviewOutput {
  aiStatus: AIStatus;
  aiMatch: number;
  aiEvidence: string;
  aiReason: string;
}

const PUNCT = /[\s,，。、；;:!?！？\.\-\(\)\[\]【】\{\}\<\>《》"'`~——_+=*\/\\|]/g;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(PUNCT, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function ngrams(s: string, n: number): string[] {
  if (s.length < n) return [s];
  const out: string[] = [];
  for (let i = 0; i <= s.length - n; i++) out.push(s.slice(i, i + n));
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

function dictForPoint(point: CarePointDef): { bigrams: Set<string>; trigrams: Set<string>; hints: Set<string> } {
  const base = [...point.keywords, ...point.evidenceHints, point.title, point.content].join(' ');
  const norm = normalize(base);
  const bigrams = new Set(ngrams(norm, 2));
  const trigrams = new Set(ngrams(norm, 3));
  const hints = new Set(point.evidenceHints.map((h) => normalize(h)).filter(Boolean));
  return { bigrams, trigrams, hints };
}

function evidenceFor(text: string, hints: Set<string>): string {
  const norm = normalize(text);
  if (!norm) return '';
  const matched: string[] = [];
  for (const h of hints) {
    if (h && norm.includes(h)) matched.push(h);
  }
  if (matched.length) return matched.slice(0, 3).join('，');
  for (const token of norm.split(' ').filter(Boolean)) {
    if (token.length >= 4) {
      matched.push(token);
      if (matched.length >= 3) break;
    }
  }
  return matched.join('，');
}

export function reviewPoint(input: ReviewInput): ReviewOutput {
  const text = (input.rawText || '').trim();
  if (input.execution === '不适用') {
    return {
      aiStatus: '依据不足',
      aiMatch: 0,
      aiEvidence: '',
      aiReason: '患者或照护者标注为不适用，需护士再次确认是否确实不适用。',
    };
  }

  if (input.execution === '暂未执行') {
    return {
      aiStatus: '未提及',
      aiMatch: 0,
      aiEvidence: '',
      aiReason: '本条未执行，没有可比的执行细节。',
    };
  }

  if (text.length < 5) {
    return {
      aiStatus: '依据不足',
      aiMatch: 0,
      aiEvidence: '',
      aiReason: '原始描述过短，需要补充更具体的执行过程再复核。',
    };
  }

  const dict = dictForPoint(input.point);
  const normText = normalize(text);
  const textBigrams = new Set(ngrams(normText, 2));
  const textTrigrams = new Set(ngrams(normText, 3));

  // 1) 关键词集合直接命中（最强信号）
  let kwHit = 0;
  let kwWeight = 0;
  for (const k of input.point.keywords) {
    const nk = normalize(k);
    if (!nk) continue;
    kwWeight++;
    if (normText.includes(nk)) kwHit++;
  }
  const kwScore = kwWeight > 0 ? kwHit / kwWeight : 0;

  // 2) evidence_hints 短语命中（按词拆分后任一关键词在文中出现即视为命中）
  let hintHit = 0;
  let hintWeight = 0;
  for (const h of dict.hints) {
    const nh = normalize(h);
    if (!nh) continue;
    hintWeight++;
    // 整句包含，或拆词后每个词都至少 2 字且文中出现
    if (normText.includes(nh)) {
      hintHit++;
      continue;
    }
    const parts = nh.split(' ').filter((p) => p.length >= 2);
    if (parts.length > 0 && parts.every((p) => normText.includes(p))) hintHit += 0.6;
  }
  const hintScore = hintWeight > 0 ? Math.min(1, hintHit / hintWeight) : 0;

  // 3) ngram 背景相似度（兜底）
  const bigramScore = jaccard(dict.bigrams, textBigrams);
  const trigramScore = jaccard(dict.trigrams, textTrigrams);

  const length = text.length;
  const lengthPenalty = length < 8 ? 0.6 : length < 14 ? 0.85 : 1;

  // 关键词命中足够（>= 50% 即 4 个核心词中命中 2 个）时直接给高分
  // 1-2 个词命中时给中等分；都没有时回落到 ngram 兜底
  let score: number;
  if (kwScore >= 0.5) {
    // 关键词覆盖充分，按关键词命中比例 + 命中证据强度计算
    score = 75 + 25 * kwScore + 10 * hintScore;
  } else if (kwScore >= 0.25) {
    score = 45 + 25 * kwScore + 15 * hintScore;
  } else {
    // 没有关键词命中时回落到 ngram + hintScore
    score = 100 * (0.45 * hintScore + 0.35 * bigramScore + 0.2 * trigramScore);
  }
  const aiMatch = Math.max(0, Math.min(100, Math.round(score * lengthPenalty)));

  let status: AIStatus;
  if (aiMatch >= 70) status = '与要点一致';
  else if (aiMatch >= 40) status = '表达模糊，需再次确认';
  else if (aiMatch >= 18) status = '未明确提及';
  else status = '未提及';

  const evidence = evidenceFor(text, dict.hints);

  const reasonMap: Record<AIStatus, string> = {
    '与要点一致': '原话中已覆盖主要关键词与表述，与要点语义高度一致。',
    '表达模糊，需再次确认': '原话与要点存在部分匹配，但缺少关键细节，建议护士在随访前再确认。',
    '未明确提及': '原话中未明显提及要点相关动作，可能存在遗漏，需要再次询问。',
    '未提及': '原话中没有与本要点相关的内容，建议护士随访时重点讲解。',
    '依据不足': '执行标记与文字描述无法支撑比对，需要补充更具体的执行细节。',
  };

  return {
    aiStatus: status,
    aiMatch,
    aiEvidence: evidence,
    aiReason: reasonMap[status],
  };
}
