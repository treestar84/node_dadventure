import type { AchievementDefinition, Character, AchievementContext } from '../types'

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // 첫 걸음 (First Steps) - Bronze Tier
  {
    key: 'first_character',
    title: '첫 번째 친구',
    description: '첫 캐릭터를 생성했습니다.',
    category: 'first_steps',
    tier: 'bronze',
    points: 10,
    requirements: { type: 'special', target: 'character_created' },
    reward: { coins: 100, exp: 50 },
    icon: '🐾'
  },
  {
    key: 'first_feed',
    title: '첫 번째 급식',
    description: '첫 번째 벌레를 먹였습니다.',
    category: 'first_steps',
    tier: 'bronze',
    points: 10,
    requirements: { type: 'count', target: 1 },
    reward: { coins: 50, exp: 25 },
    icon: '🐛'
  },
  {
    key: 'first_level_up',
    title: '성장의 기쁨',
    description: '처음으로 레벨업했습니다.',
    category: 'first_steps',
    tier: 'bronze',
    points: 15,
    requirements: { type: 'level', target: 2 },
    reward: { coins: 150, exp: 100 },
    icon: '⭐'
  },

  // 성장 (Progression) - Bronze to Gold
  {
    key: 'level_5',
    title: '새싹 모험가',
    description: '레벨 5에 도달했습니다.',
    category: 'progression',
    tier: 'bronze',
    points: 25,
    requirements: { type: 'level', target: 5 },
    reward: { coins: 250, exp: 200 },
    icon: '🌱'
  },
  {
    key: 'level_10',
    title: '숙련된 모험가',
    description: '레벨 10에 도달했습니다.',
    category: 'progression',
    tier: 'silver',
    points: 50,
    requirements: { type: 'level', target: 10 },
    reward: { coins: 500, exp: 400, items: ['level_10_badge'] },
    icon: '🏆'
  },
  {
    key: 'level_25',
    title: '전문 모험가',
    description: '레벨 25에 도달했습니다.',
    category: 'progression',
    tier: 'gold',
    points: 100,
    requirements: { type: 'level', target: 25 },
    reward: { coins: 1000, exp: 800, title: '전문가' },
    icon: '👑'
  },
  {
    key: 'level_50',
    title: '마스터 모험가',
    description: '레벨 50에 도달했습니다.',
    category: 'progression',
    tier: 'platinum',
    points: 200,
    requirements: { type: 'level', target: 50 },
    reward: { coins: 2500, exp: 2000, title: '마스터', skin: 'master_aura' },
    icon: '💫'
  },

  // 사교 (Social) - Bronze to Diamond
  {
    key: 'first_visit',
    title: '첫 방문',
    description: '다른 캐릭터를 처음 방문했습니다.',
    category: 'social',
    tier: 'bronze',
    points: 20,
    requirements: { type: 'count', target: 1 },
    reward: { coins: 100, exp: 75 },
    icon: '🚪'
  },
  {
    key: 'social_butterfly',
    title: '사교 나비',
    description: '10명의 다른 캐릭터를 방문했습니다.',
    category: 'social',
    tier: 'silver',
    points: 75,
    requirements: { type: 'count', target: 10 },
    reward: { coins: 500, exp: 300, items: ['friendship_charm'] },
    icon: '🦋'
  },
  {
    key: 'popular_friend',
    title: '인기쟁이',
    description: '25명에게 방문받았습니다.',
    category: 'social',
    tier: 'gold',
    points: 150,
    requirements: { type: 'count', target: 25 },
    reward: { coins: 1000, exp: 500, title: '인기쟁이' },
    icon: '✨'
  },

  // 수집가 (Collector) - Silver to Platinum
  {
    key: 'bug_collector_bronze',
    title: '벌레 수집가',
    description: '총 50개의 벌레를 먹였습니다.',
    category: 'collector',
    tier: 'silver',
    points: 50,
    requirements: { type: 'count', target: 50 },
    reward: { coins: 300, exp: 200, items: ['bug_net'] },
    icon: '🪲'
  },
  {
    key: 'bug_collector_silver',
    title: '벌레 마니아',
    description: '총 200개의 벌레를 먹였습니다.',
    category: 'collector',
    tier: 'gold',
    points: 120,
    requirements: { type: 'count', target: 200 },
    reward: { coins: 800, exp: 600, title: '벌레박사' },
    icon: '🐞'
  },
  {
    key: 'item_collector',
    title: '아이템 수집가',
    description: '10개 이상의 아이템을 보유했습니다.',
    category: 'collector',
    tier: 'silver',
    points: 60,
    requirements: { type: 'count', target: 10 },
    reward: { coins: 400, exp: 300 },
    icon: '🎒'
  },

  // 마스터 (Master) - Gold to Diamond
  {
    key: 'stat_master_str',
    title: '근력의 달인',
    description: '근력 스탯이 50에 도달했습니다.',
    category: 'master',
    tier: 'gold',
    points: 100,
    requirements: { type: 'stat', target: 50, metadata: { stat: 'str' } },
    reward: { coins: 800, exp: 500, title: '근력왕' },
    icon: '💪'
  },
  {
    key: 'stat_master_int',
    title: '지능의 달인',
    description: '지능 스탯이 50에 도달했습니다.',
    category: 'master',
    tier: 'gold',
    points: 100,
    requirements: { type: 'stat', target: 50, metadata: { stat: 'int' } },
    reward: { coins: 800, exp: 500, title: '지혜자' },
    icon: '🧠'
  },
  {
    key: 'all_stats_balanced',
    title: '균형의 달인',
    description: '모든 기본 스탯이 30 이상입니다.',
    category: 'master',
    tier: 'platinum',
    points: 200,
    requirements: { type: 'special', target: 'balanced_stats' },
    reward: { coins: 1500, exp: 1000, title: '균형자', skin: 'balance_aura' },
    icon: '⚖️'
  },

  // 시간지기 (Time Keeper) - Bronze to Gold
  {
    key: 'week_survivor',
    title: '일주일 생존',
    description: '캐릭터가 일주일 동안 생존했습니다.',
    category: 'time_keeper',
    tier: 'bronze',
    points: 30,
    requirements: { type: 'time', target: 7 },
    reward: { coins: 200, exp: 150 },
    icon: '📅'
  },
  {
    key: 'month_survivor',
    title: '한 달 생존',
    description: '캐릭터가 한 달 동안 생존했습니다.',
    category: 'time_keeper',
    tier: 'silver',
    points: 100,
    requirements: { type: 'time', target: 30 },
    reward: { coins: 1000, exp: 600, items: ['time_crystal'] },
    icon: '🗓️'
  },
  {
    key: 'year_survivor',
    title: '1년 생존',
    description: '캐릭터가 1년 동안 생존했습니다.',
    category: 'time_keeper',
    tier: 'gold',
    points: 365,
    requirements: { type: 'time', target: 365 },
    reward: { coins: 5000, exp: 3000, title: '불멸자', skin: 'ancient_glow' },
    icon: '👴'
  },

  // 관대함 (Generous) - Silver to Gold
  {
    key: 'first_gift',
    title: '첫 선물',
    description: '처음으로 사탕을 선물했습니다.',
    category: 'generous',
    tier: 'silver',
    points: 40,
    requirements: { type: 'count', target: 1 },
    reward: { coins: 200, exp: 100 },
    icon: '🍬'
  },
  {
    key: 'generous_heart',
    title: '따뜻한 마음',
    description: '10개의 사탕을 선물했습니다.',
    category: 'generous',
    tier: 'gold',
    points: 120,
    requirements: { type: 'count', target: 10 },
    reward: { coins: 800, exp: 400, title: '자선가' },
    icon: '💝'
  },

  // 학자 (Scholar) - Silver to Platinum
  {
    key: 'first_seed',
    title: '지식의 씨앗',
    description: '첫 번째 지식을 공유했습니다.',
    category: 'scholar',
    tier: 'silver',
    points: 50,
    requirements: { type: 'count', target: 1 },
    reward: { coins: 300, exp: 200 },
    icon: '🌱'
  },
  {
    key: 'knowledge_tree',
    title: '지식의 나무',
    description: '지식 씨앗이 10번 공유되었습니다.',
    category: 'scholar',
    tier: 'gold',
    points: 150,
    requirements: { type: 'count', target: 10 },
    reward: { coins: 1000, exp: 600, title: '현자' },
    icon: '🌳'
  },
  {
    key: 'first_water',
    title: '첫 물방울',
    description: '처음으로 다른 씨앗에 물을 주었습니다.',
    category: 'scholar',
    tier: 'silver',
    points: 30,
    requirements: { type: 'count', target: 1 },
    reward: { coins: 150, exp: 100 },
    icon: '💧'
  },
  {
    key: 'water_master',
    title: '물주기 달인',
    description: '50번의 댓글로 물을 주었습니다.',
    category: 'scholar',
    tier: 'platinum',
    points: 200,
    requirements: { type: 'count', target: 50 },
    reward: { coins: 1500, exp: 1000, title: '지식 정원사' },
    icon: '🌿'
  },

  // 행운 (Lucky) - Silver to Diamond
  {
    key: 'lucky_find',
    title: '행운의 발견',
    description: '희귀 아이템을 발견했습니다.',
    category: 'lucky',
    tier: 'silver',
    points: 75,
    requirements: { type: 'special', target: 'rare_item_found' },
    reward: { coins: 500, exp: 300 },
    icon: '🍀'
  },
  {
    key: 'lottery_winner',
    title: '복권 당첨자',
    description: '대박 행운을 경험했습니다.',
    category: 'lucky',
    tier: 'platinum',
    points: 250,
    requirements: { type: 'special', target: 'jackpot' },
    reward: { coins: 5000, exp: 2000, title: '행운아', skin: 'golden_aura' },
    icon: '💰'
  },

  // 완벽주의자 (Perfectionist) - Gold to Diamond
  {
    key: 'perfect_timing',
    title: '완벽한 타이밍',
    description: '벌레를 정확히 30분마다 먹였습니다 (연속 10회).',
    category: 'perfectionist',
    tier: 'gold',
    points: 150,
    requirements: { type: 'special', target: 'perfect_timing' },
    reward: { coins: 1200, exp: 800, title: '정시왕' },
    icon: '⏰'
  },
  {
    key: 'flawless_care',
    title: '완벽한 보살핌',
    description: '한 달 동안 매일 접속했습니다.',
    category: 'perfectionist',
    tier: 'platinum',
    points: 200,
    requirements: { type: 'special', target: 'daily_streak_30' },
    reward: { coins: 2000, exp: 1500, title: '완벽주의자', skin: 'perfection_halo' },
    icon: '💯'
  },

  // 전문가 (Specialist) - Gold to Diamond
  {
    key: 'warrior_specialist',
    title: '전사 전문가',
    description: '전사 직업으로 레벨 30에 도달했습니다.',
    category: 'specialist',
    tier: 'gold',
    points: 120,
    requirements: { type: 'special', target: 'job_level_30', metadata: { job: 'warrior' } },
    reward: { coins: 1000, exp: 700, title: '전사장' },
    icon: '⚔️'
  },
  {
    key: 'mage_specialist',
    title: '마법사 전문가',
    description: '마법사 직업으로 레벨 30에 도달했습니다.',
    category: 'specialist',
    tier: 'gold',
    points: 120,
    requirements: { type: 'special', target: 'job_level_30', metadata: { job: 'mage' } },
    reward: { coins: 1000, exp: 700, title: '대마법사' },
    icon: '🔮'
  },

  // 전설 (Legendary) - Diamond Only
  {
    key: 'legend_born',
    title: '전설의 탄생',
    description: '레벨 100에 도달하고 모든 스탯이 100 이상입니다.',
    category: 'legendary',
    tier: 'diamond',
    points: 1000,
    requirements: { type: 'special', target: 'legendary_status' },
    reward: { 
      coins: 10000, 
      exp: 5000, 
      title: '전설', 
      skin: 'legendary_crown',
      items: ['legendary_badge', 'immortal_essence'] 
    },
    icon: '👑',
    hidden: true
  },
  {
    key: 'achievement_master',
    title: '업적 마스터',
    description: '100개의 업적을 달성했습니다.',
    category: 'legendary',
    tier: 'diamond',
    points: 500,
    requirements: { type: 'count', target: 100 },
    reward: { 
      coins: 5000, 
      exp: 3000, 
      title: '업적왕', 
      skin: 'achievement_crown' 
    },
    icon: '🏅'
  }
]

// 업적 체크 함수들
export const achievementCheckers = {
  // 균형 잡힌 스탯 체크
  balanced_stats: (character: Character): boolean => {
    const { str, dex, int, vit, agi, luk } = character.stats
    return [str, dex, int, vit, agi, luk].every(stat => stat >= 30)
  },

  // 전설적 지위 체크
  legendary_status: (character: Character): boolean => {
    const { str, dex, int, vit, agi, luk, playfulness, curiosity, sensitivity, 
            awareness, meddling, pragmatism, appetite, anger_control, clumsiness } = character.stats
    
    return character.level >= 100 && 
           [str, dex, int, vit, agi, luk, playfulness, curiosity, sensitivity, 
            awareness, meddling, pragmatism, appetite, anger_control, clumsiness]
           .every(stat => stat >= 100)
  },

  // 직업 전문가 체크
  job_level_30: (character: Character, context: AchievementContext): boolean => {
    if (!context.metadata?.job) return false
    return character.level >= 30 && character.job === context.metadata.job
  },

  // 완벽한 타이밍 체크 (구현은 별도 시스템에서)
  perfect_timing: (character: Character, context: AchievementContext): boolean => {
    return context.metadata?.perfectTimingStreak >= 10
  },

  // 매일 접속 체크 (구현은 별도 시스템에서)
  daily_streak_30: (character: Character, context: AchievementContext): boolean => {
    return context.metadata?.dailyStreak >= 30
  }
}