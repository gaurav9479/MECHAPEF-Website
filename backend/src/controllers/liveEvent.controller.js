import { connection as redis } from '../config/redis.js';
import Event from '../models/event.model.js';
import { SystemConfig } from '../models/systemConfig.model.js';

const checkIsRedisLiveActive = async () => {
    try {
        const config = await SystemConfig.findOne();
        if (config) {
            if (config.redisModeType === 'ALWAYS_OFF') return false;
            if (config.redisModeType === 'ALWAYS_ON') return true;
            if (config.enableRedis === false) return false;
        }
        return true;
    } catch {
        return true;
    }
};

/**
 * ============================================================================
 * TYPE 1: QUIZ MODE (Speed + Accuracy Scoring & Leaderboards) [COMMENTED OUT]
 * ============================================================================
 * 
 * export const submitQuizAnswer = async (req, res) => {
 *     const { eventId, questionId, selectedOption, correctOption, responseTimeMs } = req.body;
 *     const userId = req.user?._id?.toString() || req.body.userId;
 * 
 *     if (!questionId || !selectedOption || !userId) {
 *         return res.status(400).json({ success: false, message: 'Missing required quiz fields' });
 *     }
 * 
 *     // Double submission guard
 *     const hasAnswered = await redis.sismember(`quiz:answered:${questionId}`, userId);
 *     if (hasAnswered) {
 *         return res.status(409).json({ success: false, message: 'Question already answered' });
 *     }
 * 
 *     // Speed/Accuracy formula: Score = max(100, Points - floor(min(Δt_ms, 30000) / 30))
 *     const basePoints = 1000;
 *     const penalty = Math.floor(Math.min(responseTimeMs || 0, 30000) / 30);
 *     const score = Math.max(100, basePoints - penalty);
 *     const isCorrect = selectedOption === correctOption;
 *     const finalScore = isCorrect ? score : 0;
 * 
 *     const pipeline = redis.pipeline();
 *     pipeline.sadd(`quiz:answered:${questionId}`, userId);
 *     pipeline.rpush(`quiz:log:${questionId}`, JSON.stringify({
 *         userId,
 *         selectedOption,
 *         isCorrect,
 *         score: finalScore,
 *         responseTimeMs,
 *         timestamp: Date.now()
 *     }));
 * 
 *     if (isCorrect) {
 *         pipeline.zincrby(`quiz:${eventId}:overall_leaderboard`, finalScore, userId);
 *         pipeline.zadd(`quiz:${eventId}:leaderboard:${questionId}`, finalScore, userId);
 *     }
 *     await pipeline.exec();
 * 
 *     return res.status(200).json({
 *         success: true,
 *         score: finalScore,
 *         isCorrect
 *     });
 * };
 * 
 * export const getQuizLeaderboard = async (req, res) => {
 *     const { eventId } = req.params;
 *     const topScores = await redis.zrevrange(`quiz:${eventId}:overall_leaderboard`, 0, 9, 'WITHSCORES');
 *     // format Top 10 with populated user details
 *     return res.status(200).json({ success: true, leaderboard: topScores });
 * };
 * ============================================================================
 */

/**
 * ============================================================================
 * TYPE 2: LIVE VOTING MODE (Instant Percentages, Atomic Counters, Majority Option)
 * ============================================================================
 */

/**
 * Submit a vote for an active poll
 * Route: POST /api/events/:eventId/live/vote
 */
export const submitLiveVote = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { pollId, selectedOption } = req.body;
        const userId = req.user?._id?.toString() || req.body.userId;

        if (!eventId || !pollId || !selectedOption || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Event ID, poll ID, user ID, and selected option are required.'
            });
        }

        const isRedisActive = await checkIsRedisLiveActive();
        if (!isRedisActive) {
            return res.status(503).json({
                success: false,
                message: 'Live interactive voting is currently inactive. Admin has not enabled Redis.'
            });
        }

        const votedKey = `voting:voted:${pollId}`;
        const countsKey = `voting:counts:${pollId}`;

        // 1. Atomic Double Submission Guard (SADD returns 1 if new, 0 if already in set)
        const isNewVote = await redis.sadd(votedKey, userId);
        if (isNewVote === 0) {
            return res.status(409).json({
                success: false,
                message: 'You have already submitted your vote for this poll.'
            });
        }

        // 2. Atomic increment of selected option counter in Redis Hash
        await redis.hincrby(countsKey, selectedOption, 1);

        // 3. Fetch full breakdown and compute percentages
        const rawCounts = await redis.hgetall(countsKey) || {};
        let totalVotes = 0;
        const distribution = {};

        for (const [option, countStr] of Object.entries(rawCounts)) {
            const count = parseInt(countStr, 10) || 0;
            distribution[option] = count;
            totalVotes += count;
        }

        const breakdown = {};
        let majorityOption = null;
        let maxVotes = -1;

        for (const [option, count] of Object.entries(distribution)) {
            const pct = totalVotes > 0 ? Number(((count / totalVotes) * 100).toFixed(1)) : 0;
            breakdown[option] = {
                votes: count,
                percentage: pct
            };

            if (count > maxVotes) {
                maxVotes = count;
                majorityOption = option;
            }
        }

        return res.status(200).json({
            success: true,
            mode: 'voting',
            pollId,
            userVote: selectedOption,
            results: {
                totalVotes,
                majorityOption,
                breakdown
            }
        });
    } catch (error) {
        console.error('[LiveVoting] Error submitting vote:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to submit vote'
        });
    }
};

/**
 * Get live results for a poll
 * Route: GET /api/events/:eventId/live/results?pollId=...
 */
export const getLiveResults = async (req, res) => {
    try {
        const { pollId } = req.query;

        if (!pollId) {
            return res.status(400).json({
                success: false,
                message: 'pollId query parameter is required.'
            });
        }

        const countsKey = `voting:counts:${pollId}`;
        const rawCounts = await redis.hgetall(countsKey) || {};

        let totalVotes = 0;
        const distribution = {};

        for (const [option, countStr] of Object.entries(rawCounts)) {
            const count = parseInt(countStr, 10) || 0;
            distribution[option] = count;
            totalVotes += count;
        }

        const breakdown = {};
        let majorityOption = null;
        let maxVotes = -1;

        for (const [option, count] of Object.entries(distribution)) {
            const pct = totalVotes > 0 ? Number(((count / totalVotes) * 100).toFixed(1)) : 0;
            breakdown[option] = {
                votes: count,
                percentage: pct
            };

            if (count > maxVotes) {
                maxVotes = count;
                majorityOption = option;
            }
        }

        return res.status(200).json({
            success: true,
            pollId,
            totalVotes,
            majorityOption,
            breakdown
        });
    } catch (error) {
        console.error('[LiveVoting] Error fetching results:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch live results'
        });
    }
};

/**
 * Check if the user has already voted
 * Route: GET /api/events/:eventId/live/status?pollId=...
 */
export const getLiveVoteStatus = async (req, res) => {
    try {
        const { pollId } = req.query;
        const userId = req.user?._id?.toString() || req.query.userId;

        if (!pollId || !userId) {
            return res.status(400).json({
                success: false,
                message: 'pollId and userId are required.'
            });
        }

        const votedKey = `voting:voted:${pollId}`;
        const hasVoted = await redis.sismember(votedKey, userId);

        return res.status(200).json({
            success: true,
            pollId,
            hasVoted: Boolean(hasVoted)
        });
    } catch (error) {
        console.error('[LiveVoting] Error checking status:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to check vote status'
        });
    }
};

/**
 * Reset a live poll session
 * Route: POST /api/events/:eventId/live/reset
 */
export const resetLivePoll = async (req, res) => {
    try {
        const { pollId } = req.body;

        if (!pollId) {
            return res.status(400).json({
                success: false,
                message: 'pollId is required to reset.'
            });
        }

        await redis.del(`voting:voted:${pollId}`, `voting:counts:${pollId}`);

        return res.status(200).json({
            success: true,
            message: `Poll session ${pollId} successfully reset.`
        });
    } catch (error) {
        console.error('[LiveVoting] Error resetting poll:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to reset poll'
        });
    }
};

/**
 * Save active poll results permanently to Event Highlights in MongoDB
 * Route: POST /api/events/:eventId/live/save-highlight
 */
export const savePollToHighlights = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { pollId, question, options } = req.body;

        if (!question) {
            return res.status(400).json({
                success: false,
                message: 'Question is required to save as an event highlight.'
            });
        }

        let breakdown = {};
        let totalVotes = 0;
        let majorityOption = '';

        if (pollId) {
            const countsKey = `voting:counts:${pollId}`;
            const rawCounts = (await redis.hgetall(countsKey)) || {};
            const distribution = {};

            for (const [opt, countStr] of Object.entries(rawCounts)) {
                const count = parseInt(countStr, 10) || 0;
                distribution[opt] = count;
                totalVotes += count;
            }

            let maxVotes = -1;
            for (const [opt, count] of Object.entries(distribution)) {
                const pct = totalVotes > 0 ? Number(((count / totalVotes) * 100).toFixed(1)) : 0;
                breakdown[opt] = { votes: count, percentage: pct };
                if (count > maxVotes) {
                    maxVotes = count;
                    majorityOption = opt;
                }
            }
        }

        // Format options array
        const optionsList = Array.isArray(options) ? options.map(opt => {
            const optLabel = typeof opt === 'string' ? opt : opt.label;
            const data = breakdown[optLabel] || { votes: opt.votes || 0, percentage: opt.percentage || 0 };
            return {
                label: optLabel,
                votes: data.votes,
                percentage: data.percentage
            };
        }) : Object.entries(breakdown).map(([label, data]) => ({
            label,
            votes: data.votes,
            percentage: data.percentage
        }));

        const event = await Event.findByIdAndUpdate(
            eventId,
            {
                $push: {
                    highlights: {
                        question,
                        options: optionsList,
                        totalVotes,
                        majorityOption,
                        createdAt: new Date()
                    }
                }
            },
            { new: true }
        );

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'Poll results saved to Event Highlights successfully!',
            highlights: event.highlights
        });
    } catch (error) {
        console.error('[LiveVoting] Error saving highlight:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to save highlight'
        });
    }
};

/**
 * Delete a highlight from an event
 * Route: DELETE /api/events/:eventId/live/highlights/:highlightId
 */
export const deleteHighlight = async (req, res) => {
    try {
        const { eventId, highlightId } = req.params;

        const event = await Event.findByIdAndUpdate(
            eventId,
            {
                $pull: { highlights: { _id: highlightId } }
            },
            { new: true }
        );

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'Highlight removed successfully',
            highlights: event.highlights
        });
    } catch (error) {
        console.error('[LiveVoting] Error deleting highlight:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete highlight'
        });
    }
};

