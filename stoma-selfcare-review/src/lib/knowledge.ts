export interface KnowledgeItem {
  topic: string;
  question: string;
  hint: string;
}

export const KNOWLEDGE: KnowledgeItem[] = [
  {
    topic: '造口周围皮肤',
    question: '造口周围皮肤发红、瘙痒怎么办？',
    hint: '暂停使用当前底盘与皮肤保护剂，使用温水清洁并拍摄照片；尽快联系造口专科护士评估。',
  },
  {
    topic: '底盘选择',
    question: '底盘总是卷边或渗漏如何排查？',
    hint: '记录底盘使用时长、造口大小、出汗情况与按压时间，核对尺寸是否合适。',
  },
  {
    topic: '异味与渗漏',
    question: '造口袋出现异味或渗漏时如何处理？',
    hint: '检查造口袋夹是否夹紧、底盘是否完整、是否超过建议更换时间，并准备备用物品。',
  },
  {
    topic: '社交与心理',
    question: '近期不愿参加聚会或情绪低落，怎么沟通？',
    hint: '倾听并记录患者主诉，鼓励家属陪伴，避免催促；若出现持续低落建议联系造口专科护士。',
  },
  {
    topic: '饮食与作息',
    question: '出院后饮食和作息要注意什么？',
    hint: '建议均衡饮食、规律作息，避免一次大量进食，记录可疑引起不适的食物。',
  },
  {
    topic: '随访与求助',
    question: '什么时候需要主动联系造口专科护士？',
    hint: '出现持续渗漏、皮肤破溃、造口颜色异常或心理负担加重时，应在随访前主动提交记录。',
  },
];
