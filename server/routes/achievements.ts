import express from 'express'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

/**
 * @swagger
 * /api/achievements/{characterId}:
 *   get:
 *     summary: Get character achievements
 *     tags: [Achievements]
 *     parameters:
 *       - in: path
 *         name: characterId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [general, social, progression, collection, time]
 *       - in: query
 *         name: tier
 *         schema:
 *           type: string
 *           enum: [bronze, silver, gold, platinum]
 *     responses:
 *       200:
 *         description: Achievements retrieved
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
 *                     achievements:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Achievement'
 */
router.get('/:characterId', async (req, res) => {
  try {
    const { characterId } = req.params
    const { category, tier } = req.query

    let query = supabase
      .from('achievements')
      .select('*')
      .eq('character_id', characterId)

    if (category) {
      query = query.eq('category', category)
    }
    if (tier) {
      query = query.eq('tier', tier)
    }

    const { data: achievements, error } = await query.order('achieved_at', { ascending: false })

    if (error) {
      return res.status(500).json({
        error: 'Database Error',
        message: error.message
      })
    }

    res.json({
      success: true,
      data: { achievements: achievements || [] }
    })

  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
})

export default router