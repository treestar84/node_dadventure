import express from 'express'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

/**
 * @swagger
 * /api/visits/{characterId}:
 *   get:
 *     summary: Get character visit history
 *     tags: [Visits]
 *     parameters:
 *       - in: path
 *         name: characterId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Visit history retrieved
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
 *                     visits:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Visit'
 */
router.get('/:characterId', async (req, res) => {
  try {
    const { characterId } = req.params

    const { data: visits, error } = await supabase
      .from('visits')
      .select(`
        *,
        visitor:characters!visits_visitor_id_fkey(id, name, species, level),
        visited:characters!visits_visited_id_fkey(id, name, species, level)
      `)
      .or(`visitor_id.eq.${characterId},visited_id.eq.${characterId}`)
      .order('visited_at', { ascending: false })

    if (error) {
      return res.status(500).json({
        error: 'Database Error',
        message: error.message
      })
    }

    res.json({
      success: true,
      data: { visits: visits || [] }
    })

  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
})

export default router