/**
 * History Routes
 * Endpoints for user conversation history
 */

const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');

/**
 * GET /api/v2/history/:userId
 * Get user's conversation history
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const chats = await Chat.find({ userId })
      .select('_id userId initialSymptoms status createdAt completedAt finalResults')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      userId,
      count: chats.length,
      chats
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch history'
    });
  }
});

/**
 * GET /api/v2/history/:userId/:chatId
 * Get specific chat from user's history
 */
router.get('/:userId/:chatId', async (req, res) => {
  try {
    const { userId, chatId } = req.params;
    
    const chat = await Chat.findOne({
      _id: chatId,
      userId
    }).populate('currentAnalysis.possibleDiseases.diseaseId', 'name description');
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }
    
    res.json({
      success: true,
      chat
    });
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat'
    });
  }
});

/**
 * DELETE /api/v2/history/:userId/:chatId
 * Delete a chat from history
 */
router.delete('/:userId/:chatId', async (req, res) => {
  try {
    const { userId, chatId } = req.params;
    
    const result = await Chat.deleteOne({
      _id: chatId,
      userId
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete chat'
    });
  }
});

/**
 * GET /api/v2/history/:userId/stats
 * Get user statistics
 */
router.get('/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const stats = await Chat.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$userId',
          totalChats: { $sum: 1 },
          completedChats: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          avgFeedback: { $avg: '$feedback.userSatisfaction' }
        }
      }
    ]);
    
    res.json({
      success: true,
      userId,
      stats: stats[0] || { totalChats: 0, completedChats: 0, avgFeedback: 0 }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;
