import express from 'express'
import bcrypt from 'bcryptjs'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

/**
 * @swagger
 * /api/characters:
 *   post:
 *     summary: Create a new character
 *     tags: [Characters]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - password
 *               - species
 *               - job
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 example: "Fluffy"
 *               password:
 *                 type: string
 *                 minLength: 4
 *                 example: "mypassword"
 *               species:
 *                 type: string
 *                 enum: [cat, dog, rabbit, hamster, bird, fish, turtle, fox]
 *                 example: "cat"
 *               job:
 *                 type: string
 *                 enum: [warrior, mage, archer, thief, cleric, bard, scholar, merchant]
 *                 example: "warrior"
 *     responses:
 *       201:
 *         description: Character created successfully
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
 *                     character:
 *                       $ref: '#/components/schemas/Character'
 *       400:
 *         description: Invalid input or character name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', async (req, res) => {
  try {
    const { name, password, species, job } = req.body

    // Validation
    if (!name || name.length < 1 || name.length > 50) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Character name must be between 1 and 50 characters'
      })
    }

    if (!password || password.length < 4) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password must be at least 4 characters long'
      })
    }

    const validSpecies = ['cat', 'dog', 'rabbit', 'hamster', 'bird', 'fish', 'turtle', 'fox']
    const validJobs = ['warrior', 'mage', 'archer', 'thief', 'cleric', 'bard', 'scholar', 'merchant']

    if (!validSpecies.includes(species)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid species'
      })
    }

    if (!validJobs.includes(job)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid job'
      })
    }

    // Check if character name already exists
    const { data: existingCharacter } = await supabase
      .from('characters')
      .select('name')
      .eq('name', name)
      .single()

    if (existingCharacter) {
      return res.status(400).json({
        error: 'Conflict',
        message: 'Character name already exists'
      })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create character with default stats
    const defaultStats = {
      str: 10, dex: 10, int: 10, vit: 10, agi: 10, luk: 10,
      playfulness: 10, curiosity: 10, sensitivity: 10, awareness: 10,
      meddling: 10, pragmatism: 10, appetite: 10, anger_control: 10, clumsiness: 10
    }

    const { data: character, error } = await supabase
      .from('characters')
      .insert([{
        name,
        password_hash: passwordHash,
        species,
        job,
        level: 1,
        age: 1,
        stats: defaultStats,
        emotion: 'happy',
        appearance: {},
        coins: 100,
        exp: 0,
        items: []
      }])
      .select('id, name, species, job, level, age, stats, emotion, coins, exp, items, created_at')
      .single()

    if (error) {
      return res.status(500).json({
        error: 'Database Error',
        message: error.message
      })
    }

    // Create initial bug for the character
    await supabase.from('bugs').insert([{ character_id: character.id }])

    res.status(201).json({
      success: true,
      message: 'Character created successfully',
      data: { character }
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
 * /api/characters/login:
 *   post:
 *     summary: Login to a character
 *     tags: [Characters]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Fluffy"
 *               password:
 *                 type: string
 *                 example: "mypassword"
 *     responses:
 *       200:
 *         description: Character login successful
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
 *                     character:
 *                       $ref: '#/components/schemas/Character'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', async (req, res) => {
  try {
    const { name, password } = req.body

    if (!name || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Character name and password are required'
      })
    }

    // Get character by name
    const { data: character, error } = await supabase
      .from('characters')
      .select('*')
      .eq('name', name)
      .single()

    if (error || !character) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid character name or password'
      })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, character.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid character name or password'
      })
    }

    // Update last played time
    await supabase
      .from('characters')
      .update({ last_played_at: new Date().toISOString() })
      .eq('id', character.id)

    // Remove sensitive data
    const { password_hash, ...characterWithoutPassword } = character

    res.json({
      success: true,
      message: 'Character login successful',
      data: { character: characterWithoutPassword }
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
 * /api/characters/{characterId}:
 *   get:
 *     summary: Get character by ID
 *     tags: [Characters]
 *     parameters:
 *       - in: path
 *         name: characterId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Character ID
 *     responses:
 *       200:
 *         description: Character information retrieved
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
 *                     character:
 *                       $ref: '#/components/schemas/Character'
 *       404:
 *         description: Character not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:characterId', async (req, res) => {
  try {
    const { characterId } = req.params

    const { data: character, error } = await supabase
      .from('characters')
      .select('id, name, species, job, level, age, stats, emotion, coins, exp, items, created_at, last_played_at')
      .eq('id', characterId)
      .single()

    if (error || !character) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Character not found'
      })
    }

    res.json({
      success: true,
      data: { character }
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
 * /api/characters/{characterId}/stats:
 *   put:
 *     summary: Update character stats
 *     tags: [Characters]
 *     parameters:
 *       - in: path
 *         name: characterId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Character ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stats:
 *                 type: object
 *                 properties:
 *                   str:
 *                     type: integer
 *                     minimum: 1
 *                   dex:
 *                     type: integer
 *                     minimum: 1
 *                   int:
 *                     type: integer
 *                     minimum: 1
 *     responses:
 *       200:
 *         description: Stats updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Character not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:characterId/stats', async (req, res) => {
  try {
    const { characterId } = req.params
    const { stats } = req.body

    if (!stats || typeof stats !== 'object') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Stats object is required'
      })
    }

    // Get current character
    const { data: character, error: fetchError } = await supabase
      .from('characters')
      .select('stats')
      .eq('id', characterId)
      .single()

    if (fetchError || !character) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Character not found'
      })
    }

    // Merge stats
    const updatedStats = { ...character.stats, ...stats }

    // Update character
    const { error: updateError } = await supabase
      .from('characters')
      .update({ stats: updatedStats })
      .eq('id', characterId)

    if (updateError) {
      return res.status(500).json({
        error: 'Database Error',
        message: updateError.message
      })
    }

    res.json({
      success: true,
      message: 'Stats updated successfully',
      data: { stats: updatedStats }
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
 * /api/characters/{characterId}/emotion:
 *   put:
 *     summary: Update character emotion
 *     tags: [Characters]
 *     parameters:
 *       - in: path
 *         name: characterId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Character ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emotion
 *             properties:
 *               emotion:
 *                 type: string
 *                 enum: [happy, sad, angry, excited, tired, curious, playful, calm, confused, proud]
 *                 example: "happy"
 *     responses:
 *       200:
 *         description: Emotion updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.put('/:characterId/emotion', async (req, res) => {
  try {
    const { characterId } = req.params
    const { emotion } = req.body

    const validEmotions = ['happy', 'sad', 'angry', 'excited', 'tired', 'curious', 'playful', 'calm', 'confused', 'proud']
    
    if (!validEmotions.includes(emotion)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid emotion'
      })
    }

    const { error } = await supabase
      .from('characters')
      .update({ emotion })
      .eq('id', characterId)

    if (error) {
      return res.status(500).json({
        error: 'Database Error',
        message: error.message
      })
    }

    res.json({
      success: true,
      message: 'Emotion updated successfully',
      data: { emotion }
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
 * /api/characters/{characterId}/experience:
 *   post:
 *     summary: Add experience to character
 *     tags: [Characters]
 *     parameters:
 *       - in: path
 *         name: characterId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Character ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: integer
 *                 minimum: 1
 *                 example: 50
 *     responses:
 *       200:
 *         description: Experience added successfully
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
 *                     exp:
 *                       type: integer
 *                     level:
 *                       type: integer
 *                     leveledUp:
 *                       type: boolean
 */
router.post('/:characterId/experience', async (req, res) => {
  try {
    const { characterId } = req.params
    const { amount } = req.body

    if (!amount || amount < 1) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Experience amount must be at least 1'
      })
    }

    // Get current character
    const { data: character, error: fetchError } = await supabase
      .from('characters')
      .select('exp, level')
      .eq('id', characterId)
      .single()

    if (fetchError || !character) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Character not found'
      })
    }

    const newExp = character.exp + amount
    const oldLevel = character.level
    const newLevel = Math.max(1, Math.floor(Math.sqrt(newExp / 100)) + 1)
    const leveledUp = newLevel > oldLevel

    // Update character
    const { error: updateError } = await supabase
      .from('characters')
      .update({ 
        exp: newExp,
        level: newLevel
      })
      .eq('id', characterId)

    if (updateError) {
      return res.status(500).json({
        error: 'Database Error',
        message: updateError.message
      })
    }

    res.json({
      success: true,
      message: 'Experience added successfully',
      data: {
        exp: newExp,
        level: newLevel,
        leveledUp
      }
    })

  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
})

export default router