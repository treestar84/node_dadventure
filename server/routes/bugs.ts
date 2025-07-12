import express from 'express'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

/**
 * @swagger
 * /api/bugs/{characterId}:
 *   get:
 *     summary: Get available bugs for a character
 *     tags: [Bugs]
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
 *         description: Available bugs retrieved
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
 *                     bugs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Bug'
 *                     nextBugTime:
 *                       type: string
 *                       format: date-time
 */
router.get('/:characterId', async (req, res) => {
  try {
    const { characterId } = req.params

    const { data: bugs, error } = await supabase
      .from('bugs')
      .select('*')
      .eq('character_id', characterId)
      .eq('used', false)
      .order('created_at', { ascending: true })

    if (error) {
      return res.status(500).json({
        error: 'Database Error',
        message: error.message
      })
    }

    // Calculate next bug time (30 minutes after the last bug)
    let nextBugTime = null
    if (bugs && bugs.length > 0) {
      const lastBug = bugs[bugs.length - 1]
      const lastBugTime = new Date(lastBug.created_at)
      nextBugTime = new Date(lastBugTime.getTime() + 30 * 60 * 1000) // 30 minutes later
    }

    res.json({
      success: true,
      data: {
        bugs: bugs || [],
        nextBugTime
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
 * /api/bugs/{characterId}/generate:
 *   post:
 *     summary: Generate a new bug for character
 *     tags: [Bugs]
 *     parameters:
 *       - in: path
 *         name: characterId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Character ID
 *     responses:
 *       201:
 *         description: Bug generated successfully
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
 *                     bug:
 *                       $ref: '#/components/schemas/Bug'
 *       400:
 *         description: Cannot generate bug (max limit reached or too early)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:characterId/generate', async (req, res) => {
  try {
    const { characterId } = req.params

    // Check current bug count
    const { data: currentBugs, error: countError } = await supabase
      .from('bugs')
      .select('id')
      .eq('character_id', characterId)
      .eq('used', false)

    if (countError) {
      return res.status(500).json({
        error: 'Database Error',
        message: countError.message
      })
    }

    const maxBugs = 3
    if (currentBugs && currentBugs.length >= maxBugs) {
      return res.status(400).json({
        error: 'Limit Reached',
        message: `Maximum ${maxBugs} bugs allowed`
      })
    }

    // Check if enough time has passed since last bug
    const { data: lastBug } = await supabase
      .from('bugs')
      .select('created_at')
      .eq('character_id', characterId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (lastBug) {
      const timeSinceLastBug = Date.now() - new Date(lastBug.created_at).getTime()
      const minimumInterval = 30 * 60 * 1000 // 30 minutes
      
      if (timeSinceLastBug < minimumInterval) {
        const remainingTime = minimumInterval - timeSinceLastBug
        return res.status(400).json({
          error: 'Too Early',
          message: `Must wait ${Math.ceil(remainingTime / 60000)} more minutes`,
          data: { remainingTimeMs: remainingTime }
        })
      }
    }

    // Generate new bug
    const { data: bug, error } = await supabase
      .from('bugs')
      .insert([{ character_id: characterId }])
      .select()
      .single()

    if (error) {
      return res.status(500).json({
        error: 'Database Error',
        message: error.message
      })
    }

    res.status(201).json({
      success: true,
      message: 'Bug generated successfully',
      data: { bug }
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
 * /api/bugs/{bugId}/feed:
 *   post:
 *     summary: Feed a bug to gain experience
 *     tags: [Bugs]
 *     parameters:
 *       - in: path
 *         name: bugId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Bug ID
 *     responses:
 *       200:
 *         description: Bug fed successfully
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
 *                     expGained:
 *                       type: integer
 *                     newExp:
 *                       type: integer
 *                     newLevel:
 *                       type: integer
 *                     leveledUp:
 *                       type: boolean
 *       404:
 *         description: Bug not found or already used
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:bugId/feed', async (req, res) => {
  try {
    const { bugId } = req.params

    // Get bug info
    const { data: bug, error: bugError } = await supabase
      .from('bugs')
      .select('character_id, used')
      .eq('id', bugId)
      .single()

    if (bugError || !bug) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Bug not found'
      })
    }

    if (bug.used) {
      return res.status(400).json({
        error: 'Already Used',
        message: 'This bug has already been fed'
      })
    }

    // Mark bug as used
    const { error: markError } = await supabase
      .from('bugs')
      .update({ used: true })
      .eq('id', bugId)

    if (markError) {
      return res.status(500).json({
        error: 'Database Error',
        message: markError.message
      })
    }

    // Generate random experience (10-50)
    const expGained = Math.floor(Math.random() * 41) + 10

    // Get current character stats
    const { data: character, error: charError } = await supabase
      .from('characters')
      .select('exp, level')
      .eq('id', bug.character_id)
      .single()

    if (charError || !character) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Character not found'
      })
    }

    const newExp = character.exp + expGained
    const oldLevel = character.level
    const newLevel = Math.max(1, Math.floor(Math.sqrt(newExp / 100)) + 1)
    const leveledUp = newLevel > oldLevel

    // Update character experience and level
    const { error: updateError } = await supabase
      .from('characters')
      .update({ 
        exp: newExp,
        level: newLevel
      })
      .eq('id', bug.character_id)

    if (updateError) {
      return res.status(500).json({
        error: 'Database Error',
        message: updateError.message
      })
    }

    res.json({
      success: true,
      message: 'Bug fed successfully',
      data: {
        expGained,
        newExp,
        newLevel,
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