import express from 'express'
import bcrypt from 'bcryptjs'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: "player123"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "player@example.com"
 *               password:
 *                 type: string
 *                 minLength: 4
 *                 example: "securepassword"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid input or username already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body

    // Validation
    if (!username || username.length < 3) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Username must be at least 3 characters long'
      })
    }

    if (!password || password.length < 4) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password must be at least 4 characters long'
      })
    }

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single()

    if (existingUser) {
      return res.status(400).json({
        error: 'Conflict',
        message: 'Username already exists'
      })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        username,
        email: email || null,
        password_hash: passwordHash,
        is_active: true
      }])
      .select('id, username, email, created_at, is_active')
      .single()

    if (error) {
      return res.status(500).json({
        error: 'Database Error',
        message: error.message
      })
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user }
    })

  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with username and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "player123"
 *               password:
 *                 type: string
 *                 example: "securepassword"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     session_token:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Username and password are required'
      })
    }

    // Get user by username
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()

    if (error || !user) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid username or password'
      })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid username or password'
      })
    }

    // Generate session token (simplified)
    const sessionToken = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')
    
    // Create session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    await supabase
      .from('user_sessions')
      .insert([{
        user_id: user.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      }])

    // Update last login
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id)

    // Remove sensitive data
    const { password_hash, ...userWithoutPassword } = user

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        session_token: sessionToken
      }
    })

  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout and invalidate session
 *     tags: [Authentication]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post('/logout', async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '') || 
                         req.cookies?.session_token

    if (sessionToken) {
      // Delete session
      await supabase
        .from('user_sessions')
        .delete()
        .eq('session_token', sessionToken)
    }

    res.json({
      success: true,
      message: 'Logout successful'
    })

  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user information
 *     tags: [Authentication]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '') || 
                         req.cookies?.session_token

    if (!sessionToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Session token required'
      })
    }

    // Verify session
    const { data: session } = await supabase
      .from('user_sessions')
      .select('user_id, expires_at')
      .eq('session_token', sessionToken)
      .single()

    if (!session || new Date(session.expires_at) < new Date()) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired session'
      })
    }

    // Get user
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, created_at, last_login_at, is_active, profile_data')
      .eq('id', session.user_id)
      .single()

    if (error || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found'
      })
    }

    res.json({
      success: true,
      data: { user }
    })

  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
})

export default router