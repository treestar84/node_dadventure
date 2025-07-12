import express from 'express'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

/**
 * @swagger
 * /api/leaderboards:
 *   get:
 *     summary: Get leaderboards
 *     tags: [Leaderboards]
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [level, achievements, coins, visits]
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, all_time]
 *           default: all_time
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Leaderboard retrieved
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
 *                     leaderboard:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           rank:
 *                             type: integer
 *                           character_id:
 *                             type: string
 *                             format: uuid
 *                           score:
 *                             type: integer
 *                           character:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               species:
 *                                 type: string
 *                               level:
 *                                 type: integer
 */
router.get('/', async (req, res) => {
  try {
    const { type, period = 'all_time', limit = 10 } = req.query
    
    if (!type) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Leaderboard type is required'
      })
    }

    const validTypes = ['level', 'achievements', 'coins', 'visits']
    if (!validTypes.includes(type as string)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid leaderboard type'
      })
    }

    // For simplicity, we'll generate leaderboard from characters table
    // In a real implementation, you'd use the leaderboards table
    let query
    switch (type) {
      case 'level':
        query = supabase
          .from('characters')
          .select('id, name, species, level, exp')
          .order('level', { ascending: false })
          .order('exp', { ascending: false })
        break
      case 'coins':
        query = supabase
          .from('characters')
          .select('id, name, species, level, coins')
          .order('coins', { ascending: false })
        break
      default:
        query = supabase
          .from('characters')
          .select('id, name, species, level')
          .order('level', { ascending: false })
    }

    const { data: characters, error } = await query.limit(parseInt(limit as string))

    if (error) {
      return res.status(500).json({
        error: 'Database Error',
        message: error.message
      })
    }

    const leaderboard = (characters || []).map((char, index) => ({
      rank: index + 1,
      character_id: char.id,
      score: type === 'level' ? char.level : type === 'coins' ? char.coins : char.level,
      character: {
        name: char.name,
        species: char.species,
        level: char.level
      }
    }))

    res.json({
      success: true,
      data: { leaderboard }
    })

  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
})

export default router