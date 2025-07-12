export const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'MyTamaLife API',
    version: '1.0.0',
    description: `
# MyTamaLife API Documentation

Welcome to the MyTamaLife API! This is a comprehensive RESTful API for the MyTamaLife character nurturing game.

## Features

- **Character Management**: Create, manage, and customize your virtual characters
- **Bug System**: 30-minute interval feeding system for character growth
- **Achievement System**: Track progress with 14 different achievement categories
- **Social Features**: Visit other characters and share knowledge
- **Leaderboards**: Compete with other players
- **Real-time Updates**: Get notified about important events

## Authentication

Most endpoints require authentication. Use the character login system to get access.

## Rate Limiting

All endpoints are rate-limited to ensure fair usage:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

## Error Handling

All API responses follow a consistent format:

\`\`\`json
{
  "success": true|false,
  "message": "Human readable message",
  "data": {...} // Only on success
  "error": "Error type", // Only on error
  "statusCode": 200|400|401|404|500
}
\`\`\`

## Game Mechanics

### Character Stats
Each character has 15 stats:
- **Combat**: STR, DEX, INT, VIT, AGI, LUK
- **Personality**: Playfulness, Curiosity, Sensitivity, Awareness, Meddling, Pragmatism, Appetite, Anger Control, Clumsiness

### Level System
Characters gain experience and level up:
- Level = floor(sqrt(exp / 100)) + 1
- Each level grants 5 stat points to distribute

### Bug System
- Bugs generate every 30 minutes (max 3)
- Feeding bugs grants 10-50 experience points
- Used bugs are automatically removed

## Support

For support or questions, contact us at support@mytamalife.com
    `,
    contact: {
      name: 'MyTamaLife Development Team',
      email: 'support@mytamalife.com',
      url: 'https://mytamalife.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    },
    termsOfService: 'https://mytamalife.com/terms'
  },
  servers: [
    {
      url: 'http://localhost:3001/api',
      description: 'Development server'
    },
    {
      url: 'https://api.mytamalife.com/api',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your session token'
      },
      sessionAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'session_token',
        description: 'Session token stored in cookies'
      }
    },
    schemas: {
      // Success/Error responses
      Success: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object', description: 'Response data' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Validation Error' },
          message: { type: 'string', example: 'Invalid input provided' },
          statusCode: { type: 'integer', example: 400 }
        }
      },
      
      // User schemas
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Unique user identifier' },
          username: { 
            type: 'string', 
            minLength: 3, 
            maxLength: 50,
            example: 'player123',
            description: 'Unique username for authentication'
          },
          email: { 
            type: 'string', 
            format: 'email',
            example: 'player@example.com',
            description: 'User email address (optional)'
          },
          created_at: { 
            type: 'string', 
            format: 'date-time',
            description: 'Account creation timestamp'
          },
          last_login_at: { 
            type: 'string', 
            format: 'date-time',
            description: 'Last login timestamp'
          },
          is_active: { 
            type: 'boolean',
            description: 'Whether the account is active'
          },
          profile_data: { 
            type: 'object',
            description: 'Additional profile information'
          }
        },
        required: ['id', 'username', 'created_at', 'is_active']
      },

      // Character schemas
      Character: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Unique character identifier' },
          name: { 
            type: 'string', 
            minLength: 1, 
            maxLength: 50,
            example: 'Fluffy',
            description: 'Character display name'
          },
          species: { 
            type: 'string', 
            enum: ['cat', 'dog', 'rabbit', 'hamster', 'bird', 'fish', 'turtle', 'fox'],
            example: 'cat',
            description: 'Character species type'
          },
          job: { 
            type: 'string', 
            enum: ['warrior', 'mage', 'archer', 'thief', 'cleric', 'bard', 'scholar', 'merchant'],
            example: 'warrior',
            description: 'Character profession'
          },
          level: { 
            type: 'integer', 
            minimum: 1,
            example: 5,
            description: 'Character level (calculated from experience)'
          },
          age: { 
            type: 'integer', 
            minimum: 1,
            example: 15,
            description: 'Character age in days'
          },
          stats: {
            type: 'object',
            description: 'Character attributes and personality traits',
            properties: {
              // Combat stats
              str: { type: 'integer', minimum: 1, description: 'Strength' },
              dex: { type: 'integer', minimum: 1, description: 'Dexterity' },
              int: { type: 'integer', minimum: 1, description: 'Intelligence' },
              vit: { type: 'integer', minimum: 1, description: 'Vitality' },
              agi: { type: 'integer', minimum: 1, description: 'Agility' },
              luk: { type: 'integer', minimum: 1, description: 'Luck' },
              // Personality traits
              playfulness: { type: 'integer', minimum: 1, description: 'How playful the character is' },
              curiosity: { type: 'integer', minimum: 1, description: 'How curious the character is' },
              sensitivity: { type: 'integer', minimum: 1, description: 'Emotional sensitivity' },
              awareness: { type: 'integer', minimum: 1, description: 'Environmental awareness' },
              meddling: { type: 'integer', minimum: 1, description: 'Tendency to interfere' },
              pragmatism: { type: 'integer', minimum: 1, description: 'Practical thinking' },
              appetite: { type: 'integer', minimum: 1, description: 'Food interest' },
              anger_control: { type: 'integer', minimum: 1, description: 'Temper management' },
              clumsiness: { type: 'integer', minimum: 1, description: 'Coordination level' }
            },
            example: {
              str: 12, dex: 15, int: 18, vit: 10, agi: 14, luk: 8,
              playfulness: 20, curiosity: 16, sensitivity: 12, awareness: 14,
              meddling: 8, pragmatism: 15, appetite: 18, anger_control: 10, clumsiness: 6
            }
          },
          emotion: { 
            type: 'string', 
            enum: ['happy', 'sad', 'angry', 'excited', 'tired', 'curious', 'playful', 'calm', 'confused', 'proud'],
            example: 'happy',
            description: 'Current emotional state'
          },
          coins: { 
            type: 'integer', 
            minimum: 0,
            example: 1250,
            description: 'In-game currency'
          },
          exp: { 
            type: 'integer', 
            minimum: 0,
            example: 2400,
            description: 'Total experience points'
          },
          items: { 
            type: 'array', 
            items: { type: 'string' },
            example: ['healing_potion', 'magic_sword', 'cute_hat'],
            description: 'Inventory items'
          },
          created_at: { 
            type: 'string', 
            format: 'date-time',
            description: 'Character creation timestamp'
          },
          last_played_at: { 
            type: 'string', 
            format: 'date-time',
            description: 'Last activity timestamp'
          }
        },
        required: ['id', 'name', 'species', 'job', 'level', 'stats', 'emotion', 'coins', 'exp']
      },

      // Bug schemas
      Bug: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Unique bug identifier' },
          character_id: { type: 'string', format: 'uuid', description: 'Owner character ID' },
          created_at: { 
            type: 'string', 
            format: 'date-time',
            description: 'Bug generation timestamp'
          },
          used: { 
            type: 'boolean',
            description: 'Whether the bug has been fed to the character'
          }
        },
        required: ['id', 'character_id', 'created_at', 'used']
      },

      // Achievement schemas
      Achievement: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          character_id: { type: 'string', format: 'uuid' },
          key: { 
            type: 'string',
            example: 'first_level_up',
            description: 'Achievement identifier'
          },
          detail: { 
            type: 'string',
            example: 'Reached level 2 for the first time',
            description: 'Achievement description'
          },
          category: { 
            type: 'string', 
            enum: ['general', 'social', 'progression', 'collection', 'time'],
            description: 'Achievement category'
          },
          tier: { 
            type: 'string', 
            enum: ['bronze', 'silver', 'gold', 'platinum'],
            description: 'Achievement rarity tier'
          },
          points: { 
            type: 'integer', 
            minimum: 0,
            description: 'Points awarded for this achievement'
          },
          achieved_at: { 
            type: 'string', 
            format: 'date-time',
            description: 'Achievement unlock timestamp'
          },
          reward: { 
            type: 'object',
            description: 'Rewards granted (coins, items, etc.)'
          }
        }
      },

      // Other schemas
      Visit: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          visitor_id: { type: 'string', format: 'uuid', description: 'Character who visited' },
          visited_id: { type: 'string', format: 'uuid', description: 'Character who was visited' },
          visited_at: { type: 'string', format: 'date-time' }
        }
      },

      Seed: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { 
            type: 'string', 
            minLength: 1, 
            maxLength: 100,
            example: 'How to level up quickly',
            description: 'Knowledge seed title'
          },
          content: { 
            type: 'string', 
            minLength: 1,
            example: 'Feed bugs regularly and focus on intelligence stats...',
            description: 'Knowledge content'
          },
          creator_id: { type: 'string', format: 'uuid' },
          tree_size: { 
            type: 'integer', 
            minimum: 0,
            description: 'Number of interactions/comments'
          },
          created_at: { type: 'string', format: 'date-time' }
        }
      }
    },
    parameters: {
      CharacterId: {
        name: 'characterId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: 'Character unique identifier'
      },
      UserId: {
        name: 'userId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: 'User unique identifier'
      },
      Limit: {
        name: 'limit',
        in: 'query',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        description: 'Maximum number of items to return'
      },
      Offset: {
        name: 'offset',
        in: 'query',
        schema: { type: 'integer', minimum: 0, default: 0 },
        description: 'Number of items to skip'
      }
    },
    responses: {
      SuccessResponse: {
        description: 'Operation successful',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Success' }
          }
        }
      },
      BadRequest: {
        description: 'Invalid input or request',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      Unauthorized: {
        description: 'Authentication required or invalid',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'System',
      description: 'System health and information endpoints'
    },
    {
      name: 'Authentication',
      description: 'User authentication and session management'
    },
    {
      name: 'Characters',
      description: 'Character creation, management, and progression'
    },
    {
      name: 'Bugs',
      description: 'Bug feeding system for character growth'
    },
    {
      name: 'Achievements',
      description: 'Achievement system and progress tracking'
    },
    {
      name: 'Visits',
      description: 'Character visiting and social interactions'
    },
    {
      name: 'Seeds',
      description: 'Knowledge sharing and community features'
    },
    {
      name: 'Notifications',
      description: 'User notifications and alerts'
    },
    {
      name: 'Leaderboards',
      description: 'Rankings and competitive features'
    }
  ]
}