import type { Character, Species, Job } from '@/types'

export interface EvolutionStage {
  stage: number
  name: string
  description: string
  levelRequirement: number
  statRequirements?: Partial<Record<string, number>>
  unlocks: string[]
}

export interface JobEvolution {
  from: Job
  to: Job
  requirements: {
    level: number
    stats?: Partial<Record<string, number>>
    items?: string[]
    achievements?: string[]
  }
  description: string
}

// Evolution stages for each species
export const SPECIES_EVOLUTION: Record<Species, EvolutionStage[]> = {
  cat: [
    {
      stage: 0,
      name: 'Kitten',
      description: 'A playful young kitten full of curiosity',
      levelRequirement: 1,
      unlocks: ['basic_meow', 'scratch']
    },
    {
      stage: 1,
      name: 'Adult Cat',
      description: 'A mature cat with developed hunting instincts',
      levelRequirement: 10,
      statRequirements: { agi: 15, dex: 15 },
      unlocks: ['stealth', 'pounce', 'night_vision']
    },
    {
      stage: 2,
      name: 'Elder Cat',
      description: 'A wise elder cat with mystical powers',
      levelRequirement: 25,
      statRequirements: { int: 20, awareness: 25 },
      unlocks: ['wisdom', 'feline_grace', 'mystical_purr']
    }
  ],
  dog: [
    {
      stage: 0,
      name: 'Puppy',
      description: 'An energetic puppy eager to please',
      levelRequirement: 1,
      unlocks: ['bark', 'fetch']
    },
    {
      stage: 1,
      name: 'Adult Dog',
      description: 'A loyal companion with strong protective instincts',
      levelRequirement: 10,
      statRequirements: { str: 15, vit: 15 },
      unlocks: ['guard', 'loyalty_boost', 'pack_leader']
    },
    {
      stage: 2,
      name: 'Alpha Dog',
      description: 'A legendary pack leader with unshakeable loyalty',
      levelRequirement: 25,
      statRequirements: { str: 20, vit: 20 },
      unlocks: ['alpha_howl', 'protector', 'legendary_loyalty']
    }
  ],
  rabbit: [
    {
      stage: 0,
      name: 'Bunny',
      description: 'A cute little bunny with boundless energy',
      levelRequirement: 1,
      unlocks: ['hop', 'nibble']
    },
    {
      stage: 1,
      name: 'Swift Rabbit',
      description: 'An incredibly fast rabbit with keen senses',
      levelRequirement: 10,
      statRequirements: { agi: 20, awareness: 15 },
      unlocks: ['speed_burst', 'danger_sense', 'lucky_foot']
    },
    {
      stage: 2,
      name: 'Moon Rabbit',
      description: 'A mystical rabbit blessed by lunar magic',
      levelRequirement: 25,
      statRequirements: { luk: 25, int: 15 },
      unlocks: ['moon_blessing', 'fortune_sight', 'lunar_jump']
    }
  ],
  hamster: [
    {
      stage: 0,
      name: 'Baby Hamster',
      description: 'A tiny hamster with chubby cheeks',
      levelRequirement: 1,
      unlocks: ['cheek_stuff', 'tiny_bite']
    },
    {
      stage: 1,
      name: 'Hoarder Hamster',
      description: 'An expert collector with amazing storage skills',
      levelRequirement: 10,
      statRequirements: { appetite: 20, pragmatism: 15 },
      unlocks: ['mega_hoard', 'storage_master', 'treasure_sense']
    },
    {
      stage: 2,
      name: 'Golden Hamster',
      description: 'A legendary hamster with the power to create wealth',
      levelRequirement: 25,
      statRequirements: { luk: 20, pragmatism: 25 },
      unlocks: ['golden_touch', 'wealth_creation', 'prosperity_aura']
    }
  ],
  bird: [
    {
      stage: 0,
      name: 'Chick',
      description: 'A fluffy chick learning to fly',
      levelRequirement: 1,
      unlocks: ['chirp', 'flutter']
    },
    {
      stage: 1,
      name: 'Soaring Bird',
      description: 'A graceful bird master of the skies',
      levelRequirement: 10,
      statRequirements: { agi: 18, curiosity: 15 },
      unlocks: ['aerial_mastery', 'wind_reading', 'sky_song']
    },
    {
      stage: 2,
      name: 'Phoenix',
      description: 'A mythical phoenix with power over renewal',
      levelRequirement: 25,
      statRequirements: { int: 20, sensitivity: 20 },
      unlocks: ['rebirth', 'healing_flame', 'eternal_song']
    }
  ],
  fish: [
    {
      stage: 0,
      name: 'Fry',
      description: 'A tiny fish exploring the waters',
      levelRequirement: 1,
      unlocks: ['bubble', 'dart']
    },
    {
      stage: 1,
      name: 'Deep Fish',
      description: 'A mysterious fish of the deep waters',
      levelRequirement: 10,
      statRequirements: { int: 15, awareness: 18 },
      unlocks: ['deep_sight', 'pressure_resist', 'current_reading']
    },
    {
      stage: 2,
      name: 'Leviathan',
      description: 'A legendary sea creature of immense wisdom',
      levelRequirement: 25,
      statRequirements: { int: 25, vit: 20 },
      unlocks: ['tidal_power', 'ancient_wisdom', 'ocean_command']
    }
  ],
  turtle: [
    {
      stage: 0,
      name: 'Hatchling',
      description: 'A small turtle beginning its long journey',
      levelRequirement: 1,
      unlocks: ['shell_hide', 'slow_walk']
    },
    {
      stage: 1,
      name: 'Ancient Turtle',
      description: 'A wise turtle that has seen many seasons',
      levelRequirement: 10,
      statRequirements: { vit: 20, pragmatism: 15 },
      unlocks: ['shell_fortress', 'ancient_memory', 'steady_wisdom']
    },
    {
      stage: 2,
      name: 'World Turtle',
      description: 'A legendary turtle carrying worlds on its shell',
      levelRequirement: 25,
      statRequirements: { vit: 25, int: 20 },
      unlocks: ['world_support', 'cosmic_patience', 'eternal_shell']
    }
  ],
  fox: [
    {
      stage: 0,
      name: 'Fox Kit',
      description: 'A clever young fox with mischievous eyes',
      levelRequirement: 1,
      unlocks: ['cunning', 'quick_step']
    },
    {
      stage: 1,
      name: 'Clever Fox',
      description: 'A crafty fox master of tricks and illusions',
      levelRequirement: 10,
      statRequirements: { int: 18, meddling: 15 },
      unlocks: ['illusion', 'trickster', 'clever_escape']
    },
    {
      stage: 2,
      name: 'Nine-Tail Fox',
      description: 'A mystical fox with nine tails and ancient magic',
      levelRequirement: 25,
      statRequirements: { int: 25, sensitivity: 20 },
      unlocks: ['nine_tails', 'spirit_magic', 'shape_shift']
    }
  ]
}

// Job advancement paths
export const JOB_EVOLUTIONS: JobEvolution[] = [
  {
    from: 'warrior',
    to: 'knight',
    requirements: {
      level: 15,
      stats: { str: 20, vit: 18 },
      achievements: ['first_victory']
    },
    description: 'Advance from Warrior to Noble Knight'
  },
  {
    from: 'mage',
    to: 'archmage',
    requirements: {
      level: 15,
      stats: { int: 25, sensitivity: 15 },
      items: ['ancient_tome']
    },
    description: 'Ascend from Mage to Powerful Archmage'
  },
  {
    from: 'thief',
    to: 'assassin',
    requirements: {
      level: 15,
      stats: { dex: 22, agi: 20 },
      achievements: ['master_stealth']
    },
    description: 'Evolve from Thief to Silent Assassin'
  }
  // Add more job evolutions as needed
]

// Helper functions
export function getEvolutionStage(character: Character): EvolutionStage {
  const stages = SPECIES_EVOLUTION[character.species as Species] || []
  let currentStage = stages[0]
  
  for (const stage of stages) {
    if (character.level >= stage.levelRequirement) {
      // Check stat requirements if they exist
      if (stage.statRequirements) {
        const meetsStatReqs = Object.entries(stage.statRequirements).every(
          ([stat, required]) => (character.stats as any)[stat] >= required
        )
        if (meetsStatReqs) {
          currentStage = stage
        }
      } else {
        currentStage = stage
      }
    }
  }
  
  return currentStage
}

export function getNextEvolution(character: Character): EvolutionStage | null {
  const stages = SPECIES_EVOLUTION[character.species as Species] || []
  const currentStage = getEvolutionStage(character)
  const currentIndex = stages.findIndex(s => s.stage === currentStage.stage)
  
  if (currentIndex < stages.length - 1) {
    return stages[currentIndex + 1]
  }
  
  return null
}

export function canEvolve(character: Character): boolean {
  const nextStage = getNextEvolution(character)
  if (!nextStage) return false
  
  // Check level requirement
  if (character.level < nextStage.levelRequirement) return false
  
  // Check stat requirements
  if (nextStage.statRequirements) {
    return Object.entries(nextStage.statRequirements).every(
      ([stat, required]) => (character.stats as any)[stat] >= required
    )
  }
  
  return true
}

export function getAvailableJobEvolutions(character: Character): JobEvolution[] {
  return JOB_EVOLUTIONS.filter(evolution => {
    if (evolution.from !== character.job) return false
    
    // Check level requirement
    if (character.level < evolution.requirements.level) return false
    
    // Check stat requirements
    if (evolution.requirements.stats) {
      const meetsStats = Object.entries(evolution.requirements.stats).every(
        ([stat, required]) => (character.stats as any)[stat] >= required
      )
      if (!meetsStats) return false
    }
    
    // TODO: Check items and achievements when those systems are implemented
    
    return true
  })
}

export function evolveCharacter(character: Character): Character {
  const nextStage = getNextEvolution(character)
  if (!nextStage || !canEvolve(character)) {
    return character
  }
  
  // Update character appearance stage
  const updatedAppearance = {
    ...character.appearance,
    evolution_stage: nextStage.stage,
    customization_unlocks: [
      ...(character.appearance.customization_unlocks || []),
      ...nextStage.unlocks
    ]
  }
  
  return {
    ...character,
    appearance: updatedAppearance
  }
}