import express from 'express'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

/**
 * @swagger
 * /api/notifications/{userId}:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: unread_only
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Notifications retrieved
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
 *                     notifications:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           type:
 *                             type: string
 *                           title:
 *                             type: string
 *                           message:
 *                             type: string
 *                           is_read:
 *                             type: boolean
 *                           created_at:
 *                             type: string
 *                             format: date-time
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const unreadOnly = req.query.unread_only === 'true'

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data: notifications, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({
        error: 'Database Error',
        message: error.message
      })
    }

    res.json({
      success: true,
      data: { notifications: notifications || [] }
    })

  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
})

export default router