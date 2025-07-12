import express from 'express'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

/**
 * @swagger
 * /api/seeds:
 *   get:
 *     summary: Get all knowledge seeds
 *     tags: [Seeds]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *     responses:
 *       200:
 *         description: Seeds retrieved
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
 *                     seeds:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Seed'
 */
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0)

    const { data: seeds, error } = await supabase
      .from('seeds')
      .select(`
        *,
        creator:characters!seeds_creator_id_fkey(id, name, species, level)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return res.status(500).json({
        error: 'Database Error',
        message: error.message
      })
    }

    res.json({
      success: true,
      data: { seeds: seeds || [] }
    })

  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
})

export default router