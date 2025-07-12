import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { swaggerDefinition } from './docs/swagger.js'

const app = express()
const PORT = process.env.API_PORT || 3001

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false // Allow swagger UI to work
}))
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://mytamalife.com'] 
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3001'],
  credentials: true
}))
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Swagger configuration
const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [] // No file scanning needed for now
}

const swaggerSpec = swaggerJsdoc(swaggerOptions)

// Swagger UI with custom styling
const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #4299e1; font-size: 2.5rem; }
    .swagger-ui .info .description { font-size: 1.1rem; line-height: 1.6; }
    .swagger-ui .scheme-container { 
      background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%); 
      padding: 20px; 
      border-radius: 8px; 
      margin: 20px 0;
    }
    .swagger-ui .opblock.opblock-get { border-color: #48bb78; }
    .swagger-ui .opblock.opblock-post { border-color: #4299e1; }
    .swagger-ui .opblock.opblock-put { border-color: #ed8936; }
    .swagger-ui .opblock.opblock-delete { border-color: #f56565; }
    .swagger-ui .btn.authorize { 
      background: linear-gradient(135deg, #4299e1 0%, #63b3ed 100%);
      border: none;
    }
  `,
  customSiteTitle: 'MyTamaLife API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    tryItOutEnabled: true,
    filter: true,
    syntaxHighlight: {
      activate: true,
      theme: 'agate'
    }
  }
}

// API Documentation endpoint
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions))

// API spec JSON endpoint
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    message: 'MyTamaLife API is running!',
    environment: process.env.NODE_ENV || 'development',
    database: 'connected', // TODO: Add real DB health check
    features: {
      characters: true,
      bugs: true,
      achievements: true,
      social: true,
      leaderboards: true
    }
  })
})

// Basic API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'MyTamaLife API',
    version: '1.0.0',
    description: 'RESTful API for MyTamaLife character nurturing game',
    documentation: '/api/docs',
    spec: '/api/docs.json',
    health: '/api/health',
    baseUrl: `http://localhost:${PORT}/api`,
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me'
      },
      characters: {
        create: 'POST /api/characters',
        login: 'POST /api/characters/login',
        get: 'GET /api/characters/{id}',
        updateStats: 'PUT /api/characters/{id}/stats',
        updateEmotion: 'PUT /api/characters/{id}/emotion',
        addExperience: 'POST /api/characters/{id}/experience'
      },
      bugs: {
        list: 'GET /api/bugs/{characterId}',
        generate: 'POST /api/bugs/{characterId}/generate',
        feed: 'POST /api/bugs/{bugId}/feed'
      },
      achievements: {
        list: 'GET /api/achievements/{characterId}'
      },
      visits: {
        list: 'GET /api/visits/{characterId}'
      },
      seeds: {
        list: 'GET /api/seeds'
      },
      notifications: {
        list: 'GET /api/notifications/{userId}'
      },
      leaderboards: {
        get: 'GET /api/leaderboards'
      }
    },
    rateLimits: {
      authenticated: '100 requests per minute',
      unauthenticated: '20 requests per minute'
    },
    status: 'operational'
  })
})

// Placeholder endpoints for API structure demonstration
app.post('/api/characters', (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'Character creation endpoint coming soon',
    statusCode: 501
  })
})

app.get('/api/characters/:id', (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Not Implemented', 
    message: 'Character details endpoint coming soon',
    statusCode: 501
  })
})

app.get('/api/bugs/:characterId', (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'Bug listing endpoint coming soon',
    statusCode: 501
  })
})

app.get('/api/leaderboards', (req, res) => {
  res.json({
    success: true,
    message: 'Leaderboards retrieved successfully',
    data: {
      leaderboard: [
        { rank: 1, character: { name: 'Fluffy', species: 'cat', level: 25 }, score: 25 },
        { rank: 2, character: { name: 'Buddy', species: 'dog', level: 23 }, score: 23 },
        { rank: 3, character: { name: 'Whiskers', species: 'cat', level: 21 }, score: 21 }
      ],
      type: 'level',
      period: 'all_time',
      total: 3
    }
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MyTamaLife API Server running on port ${PORT}`)
  console.log(`📚 API Documentation available at: http://localhost:${PORT}/api/docs`)
  console.log(`🏥 Health check available at: http://localhost:${PORT}/api/health`)
  console.log(`📋 API info available at: http://localhost:${PORT}/api`)
})

export default app