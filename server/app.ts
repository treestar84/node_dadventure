import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

// Set environment variables for server
process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321'
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

// Import routes
import authRoutes from './routes/auth.js'
import charactersRoutes from './routes/characters.js'
import bugsRoutes from './routes/bugs.js'
import achievementsRoutes from './routes/achievements.js'
import visitsRoutes from './routes/visits.js'
import seedsRoutes from './routes/seeds.js'
import notificationsRoutes from './routes/notifications.js'
import leaderboardsRoutes from './routes/leaderboards.js'

const app = express()
const PORT = process.env.API_PORT || 3001

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}))
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MyTamaLife API',
      version: '1.0.0',
      description: 'RESTful API for MyTamaLife character nurturing game',
      contact: {
        name: 'MyTamaLife Team',
        email: 'support@mytamalife.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
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
          bearerFormat: 'JWT'
        },
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'session_token'
        }
      },
      schemas: {
        // User schemas
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string', minLength: 3, maxLength: 50 },
            email: { type: 'string', format: 'email' },
            created_at: { type: 'string', format: 'date-time' },
            is_active: { type: 'boolean' },
            profile_data: { type: 'object' }
          }
        },
        // Character schemas
        Character: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', minLength: 1, maxLength: 50 },
            species: { 
              type: 'string', 
              enum: ['cat', 'dog', 'rabbit', 'hamster', 'bird', 'fish', 'turtle', 'fox'] 
            },
            job: { 
              type: 'string', 
              enum: ['warrior', 'mage', 'archer', 'thief', 'cleric', 'bard', 'scholar', 'merchant'] 
            },
            level: { type: 'integer', minimum: 1 },
            age: { type: 'integer', minimum: 1 },
            stats: {
              type: 'object',
              properties: {
                str: { type: 'integer', minimum: 1 },
                dex: { type: 'integer', minimum: 1 },
                int: { type: 'integer', minimum: 1 },
                vit: { type: 'integer', minimum: 1 },
                agi: { type: 'integer', minimum: 1 },
                luk: { type: 'integer', minimum: 1 },
                playfulness: { type: 'integer', minimum: 1 },
                curiosity: { type: 'integer', minimum: 1 },
                sensitivity: { type: 'integer', minimum: 1 },
                awareness: { type: 'integer', minimum: 1 },
                meddling: { type: 'integer', minimum: 1 },
                pragmatism: { type: 'integer', minimum: 1 },
                appetite: { type: 'integer', minimum: 1 },
                anger_control: { type: 'integer', minimum: 1 },
                clumsiness: { type: 'integer', minimum: 1 }
              }
            },
            emotion: { 
              type: 'string', 
              enum: ['happy', 'sad', 'angry', 'excited', 'tired', 'curious', 'playful', 'calm', 'confused', 'proud'] 
            },
            coins: { type: 'integer', minimum: 0 },
            exp: { type: 'integer', minimum: 0 },
            items: { type: 'array', items: { type: 'string' } },
            created_at: { type: 'string', format: 'date-time' },
            last_played_at: { type: 'string', format: 'date-time' }
          }
        },
        // Bug schemas
        Bug: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            character_id: { type: 'string', format: 'uuid' },
            created_at: { type: 'string', format: 'date-time' },
            used: { type: 'boolean' }
          }
        },
        // Achievement schemas
        Achievement: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            character_id: { type: 'string', format: 'uuid' },
            key: { type: 'string' },
            detail: { type: 'string' },
            category: { 
              type: 'string', 
              enum: ['general', 'social', 'progression', 'collection', 'time'] 
            },
            tier: { 
              type: 'string', 
              enum: ['bronze', 'silver', 'gold', 'platinum'] 
            },
            points: { type: 'integer', minimum: 0 },
            achieved_at: { type: 'string', format: 'date-time' },
            reward: { type: 'object' }
          }
        },
        // Visit schemas
        Visit: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            visitor_id: { type: 'string', format: 'uuid' },
            visited_id: { type: 'string', format: 'uuid' },
            visited_at: { type: 'string', format: 'date-time' }
          }
        },
        // Seed schemas
        Seed: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string', minLength: 1, maxLength: 100 },
            content: { type: 'string', minLength: 1 },
            creator_id: { type: 'string', format: 'uuid' },
            tree_size: { type: 'integer', minimum: 0 },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        // Error schemas
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            statusCode: { type: 'integer' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and session management'
      },
      {
        name: 'Characters',
        description: 'Character creation, management, and stats'
      },
      {
        name: 'Bugs',
        description: 'Bug feeding system and resource management'
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
  },
  apis: ['./server/routes/*.ts']
}

const swaggerSpec = swaggerJsdoc(swaggerOptions)

// Swagger UI setup with custom CSS
const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #4299e1 }
    .swagger-ui .scheme-container { background: #1a202c; padding: 20px; border-radius: 8px; }
  `,
  customSiteTitle: 'MyTamaLife API Documentation',
  customfavIcon: '/favicon.ico'
}

// API Documentation endpoint
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions))

// API spec JSON endpoint
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

// Health check endpoint
/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                 version:
 *                   type: string
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/characters', charactersRoutes)
app.use('/api/bugs', bugsRoutes)
app.use('/api/achievements', achievementsRoutes)
app.use('/api/visits', visitsRoutes)
app.use('/api/seeds', seedsRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/leaderboards', leaderboardsRoutes)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    statusCode: 404
  })
})

// Error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', error)
  res.status(error.statusCode || 500).json({
    error: error.name || 'Internal Server Error',
    message: error.message || 'Something went wrong',
    statusCode: error.statusCode || 500
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MyTamaLife API Server running on port ${PORT}`)
  console.log(`📚 API Documentation available at: http://localhost:${PORT}/api/docs`)
  console.log(`🏥 Health check available at: http://localhost:${PORT}/api/health`)
})

export default app