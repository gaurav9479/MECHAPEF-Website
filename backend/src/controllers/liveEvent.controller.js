import { connection as redis } from '../config/redis.js';
import Event from '../models/event.model.js';
import User from '../models/user.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import APIResponse from '../utils/APIResponse.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

const parseZSetWithScores = (rawArr) => {
    const result = [];
    if (!rawArr || !Array.isArray(rawArr)) return result;
    for (let i = 0; i < rawArr.length; i += 2) {
        result.push({
            member: rawArr[i],
            score: parseFloat(rawArr[i + 1]) || 0
        });
    }
    return result;
};

const populateUserLeaderboard = async (leaderboardEntries) => {
    if (!leaderboardEntries || leaderboardEntries.length === 0) return [];
    const userIds = leaderboardEntries.map(e => e.member);
    const users = await User.find({ _id: { $in: userIds } }).select('name email collegeRegNo branch yearOfStudy');
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    return leaderboardEntries.map((entry, index) => {
        const u = userMap[entry.member?.toString()];
        return {
            rank: index + 1,
            userId: entry.member,
            userName: u ? u.name : `Participant #${index + 1}`,
            collegeRegNo: u?.collegeRegNo || '',
            branch: u?.branch || '',
            score: entry.score
        };
    });
};

export const submitLiveAnswer = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const {
        pollType = 'quiz',
        questionId,
        selectedOption,
        questionStartTime
    } = req.body;

    const userId = req.user?.userId || req.body.userId;
    if (!userId) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User authentication or userId required to participate');
    }
    if (!questionId) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'questionId is required');
    }
    if (!selectedOption) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'selectedOption is required');
    }

    const now = Date.now();
    let event = null;
    let questionObj = null;

    if (eventId) {
        event = await Event.findById(eventId);
        if (event?.liveInteractive?.enabled) {
            questionObj = event.liveInteractive.questions.find(q => q.id === questionId);
        }
    }

    const effectivePollType = questionObj?.pollType || pollType;
    const scopePrefix = eventId ? `event:${eventId}:` : '';

    if (effectivePollType === 'quiz') {
        const answeredKey = `${scopePrefix}quiz:answered:${questionId}`;
        const alreadySubmitted = await redis.sismember(answeredKey, userId);
        if (alreadySubmitted) {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Already submitted for this question!');
        }

        const startMs = questionStartTime ? Number(questionStartTime) : (event?.liveInteractive?.questionStartTime ? new Date(event.liveInteractive.questionStartTime).getTime() : now);
        const responseTimeMs = Math.max(0, now - startMs);

        const correctOption = questionObj?.correctOption || req.body.correctOption;
        const isCorrect = correctOption ? (selectedOption === correctOption) : false;

        let questionScore = 0;
        if (isCorrect) {
            const maxBonus = questionObj?.points || 1000;
            const penalty = Math.min(responseTimeMs, 30000);
            questionScore = Math.max(100, maxBonus - Math.floor(penalty / 30));
        }

        const pipeline = redis.pipeline();
        pipeline.sadd(answeredKey, userId);
        pipeline.rpush(
            `${scopePrefix}quiz:log:${questionId}`,
            JSON.stringify({ userId, selectedOption, responseTimeMs, isCorrect, questionScore, timestamp: now })
        );
        pipeline.zincrby(`${scopePrefix}quiz:overall_leaderboard`, questionScore, userId);
        pipeline.zadd(`${scopePrefix}quiz:leaderboard:${questionId}`, questionScore, userId);
        await pipeline.exec();

        return res.status(HTTP_STATUS.OK).json(
            new APIResponse(HTTP_STATUS.OK, {
                success: true,
                pointsEarned: questionScore,
                isCorrect,
                responseTimeMs
            }, 'Quiz response recorded')
        );
    }

    if (effectivePollType === 'voting') {
        const votedKey = `${scopePrefix}voting:voted:${questionId}`;
        const alreadyVoted = await redis.sismember(votedKey, userId);
        if (alreadyVoted) {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Already voted on this poll!');
        }

        const pipeline = redis.pipeline();
        pipeline.sadd(votedKey, userId);
        pipeline.hincrby(`${scopePrefix}voting:counts:${questionId}`, selectedOption, 1);
        await pipeline.exec();

        return res.status(HTTP_STATUS.OK).json(
            new APIResponse(HTTP_STATUS.OK, {
                success: true,
                message: 'Vote successfully recorded'
            }, 'Vote recorded')
        );
    }

    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid pollType parameter');
});

export const getLiveResults = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const {
        pollType = 'quiz',
        questionId,
        isFinal
    } = req.query;

    const scopePrefix = eventId ? `event:${eventId}:` : '';

    if (pollType === 'quiz') {
        const qLeaderboardRaw = questionId
            ? await redis.zrevrange(`${scopePrefix}quiz:leaderboard:${questionId}`, 0, 9, 'WITHSCORES')
            : [];
        const parsedQLeaderboard = parseZSetWithScores(qLeaderboardRaw);
        const questionLeaderboard = await populateUserLeaderboard(parsedQLeaderboard);

        const overallRaw = await redis.zrevrange(`${scopePrefix}quiz:overall_leaderboard`, 0, 9, 'WITHSCORES');
        const parsedOverall = parseZSetWithScores(overallRaw);
        const overallLeaderboard = await populateUserLeaderboard(parsedOverall);

        let finalSummary = null;
        if (isFinal === 'true') {
            const fullRaw = await redis.zrevrange(`${scopePrefix}quiz:overall_leaderboard`, 0, -1, 'WITHSCORES');
            const parsedFull = parseZSetWithScores(fullRaw);
            finalSummary = await populateUserLeaderboard(parsedFull);
        }

        return res.status(HTTP_STATUS.OK).json(
            new APIResponse(HTTP_STATUS.OK, {
                questionLeaderboard,
                overallLeaderboard,
                finalSummary
            }, 'Quiz results fetched')
        );
    }

    if (pollType === 'voting') {
        if (!questionId) {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'questionId is required for voting results');
        }

        const rawCounts = await redis.hgetall(`${scopePrefix}voting:counts:${questionId}`) || {};
        let totalVotes = 0;
        let winningOption = null;
        let maxVotes = -1;

        const breakdownRaw = Object.keys(rawCounts).map(option => {
            const votes = parseInt(rawCounts[option], 10) || 0;
            totalVotes += votes;
            if (votes > maxVotes) {
                maxVotes = votes;
                winningOption = option;
            }
            return { option, votes };
        });

        const percentageBreakdown = breakdownRaw.map(item => ({
            option: item.option,
            votes: item.votes,
            percentage: totalVotes > 0 ? parseFloat(((item.votes / totalVotes) * 100).toFixed(1)) : 0
        }));

        return res.status(HTTP_STATUS.OK).json(
            new APIResponse(HTTP_STATUS.OK, {
                totalVotes,
                winningOption: totalVotes > 0 ? winningOption : null,
                breakdown: percentageBreakdown
            }, 'Voting results fetched')
        );
    }

    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid pollType parameter');
});

export const getLiveState = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found');

    const liveConfig = event.liveInteractive || { enabled: false, questions: [] };
    const activeQ = liveConfig.questions?.find(q => q.id === liveConfig.activeQuestionId);

    const sanitizedQuestion = activeQ ? {
        id: activeQ.id,
        title: activeQ.title,
        pollType: activeQ.pollType,
        options: activeQ.options,
        timeLimitSeconds: activeQ.timeLimitSeconds,
        points: activeQ.points
    } : null;

    let hasAnswered = false;
    const userId = req.user?.userId;
    if (userId && activeQ) {
        const scopePrefix = `event:${eventId}:`;
        if (activeQ.pollType === 'quiz') {
            hasAnswered = Boolean(await redis.sismember(`${scopePrefix}quiz:answered:${activeQ.id}`, userId));
        } else {
            hasAnswered = Boolean(await redis.sismember(`${scopePrefix}voting:voted:${activeQ.id}`, userId));
        }
    }

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, {
            enabled: liveConfig.enabled,
            currentType: liveConfig.currentType,
            activeQuestionId: liveConfig.activeQuestionId,
            questionStartTime: liveConfig.questionStartTime,
            isAcceptingSubmissions: liveConfig.isAcceptingSubmissions,
            activeQuestion: sanitizedQuestion,
            hasAnswered,
            totalQuestions: liveConfig.questions?.length || 0
        }, 'Live state fetched')
    );
});

export const updateLiveConfig = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { enabled, currentType, questions } = req.body;

    const event = await Event.findById(eventId);
    if (!event) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found');

    if (!event.liveInteractive) {
        event.liveInteractive = { enabled: false, currentType: 'none', questions: [] };
    }

    if (enabled !== undefined) event.liveInteractive.enabled = enabled;
    if (currentType !== undefined) event.liveInteractive.currentType = currentType;
    if (questions !== undefined) event.liveInteractive.questions = questions;

    await event.save();

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, { liveInteractive: event.liveInteractive }, 'Live interactive configuration updated')
    );
});

export const broadcastQuestion = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { questionId, isAcceptingSubmissions = true } = req.body;

    const event = await Event.findById(eventId);
    if (!event) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found');

    const question = event.liveInteractive?.questions?.find(q => q.id === questionId);
    if (questionId && !question) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Question '${questionId}' not found in event configuration`);
    }

    const now = new Date();
    event.liveInteractive.activeQuestionId = questionId || null;
    event.liveInteractive.questionStartTime = questionId ? now : null;
    event.liveInteractive.isAcceptingSubmissions = isAcceptingSubmissions;
    if (question) {
        event.liveInteractive.currentType = question.pollType;
    }

    await event.save();

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, {
            activeQuestionId: event.liveInteractive.activeQuestionId,
            questionStartTime: event.liveInteractive.questionStartTime,
            isAcceptingSubmissions: event.liveInteractive.isAcceptingSubmissions,
            currentType: event.liveInteractive.currentType
        }, questionId ? `Broadcasted question ${questionId}` : 'Broadcast closed')
    );
});

export const toggleSubmissions = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { isAcceptingSubmissions } = req.body;

    const event = await Event.findById(eventId);
    if (!event) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found');

    event.liveInteractive.isAcceptingSubmissions = Boolean(isAcceptingSubmissions);
    await event.save();

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, {
            isAcceptingSubmissions: event.liveInteractive.isAcceptingSubmissions
        }, `Submissions ${isAcceptingSubmissions ? 'opened' : 'closed'}`)
    );
});

export const resetLiveSession = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { questionId } = req.body;

    const scopePrefix = eventId ? `event:${eventId}:` : '';

    if (questionId) {
        await Promise.all([
            redis.del(`${scopePrefix}quiz:answered:${questionId}`),
            redis.del(`${scopePrefix}quiz:log:${questionId}`),
            redis.del(`${scopePrefix}quiz:leaderboard:${questionId}`),
            redis.del(`${scopePrefix}voting:voted:${questionId}`),
            redis.del(`${scopePrefix}voting:counts:${questionId}`)
        ]);
    } else {
        const keys = await redis.keys(`${scopePrefix}quiz:*`);
        const voteKeys = await redis.keys(`${scopePrefix}voting:*`);
        const allKeys = [...keys, ...voteKeys];
        if (allKeys.length > 0) {
            await redis.del(...allKeys);
        }
    }

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, null, 'Live session data reset in Redis')
    );
});

