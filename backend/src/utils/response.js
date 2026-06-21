
export const sendResponse = (res, statusCode, message, data = null, error = null) => {
    return res.status(statusCode).json({
        success: statusCode < 400,
        statusCode,
        message,
        data,
        error,
        timestamp: new Date().toISOString()
    });
};
export const sendSuccess = (res, message, data = null, statusCode = 200) => {
    return sendResponse(res, statusCode, message, data);
};

export const sendError = (res, message, error = null, statusCode = 500) => {
    return sendResponse(res, statusCode, message, null, error);
};

export const sendPaginatedResponse = (
    res,
    statusCode,
    message,
    data,
    page,
    limit,
    totalCount
) => {
    const totalPages = Math.ceil(totalCount / limit);
    return res.status(statusCode).json({
        success: statusCode < 400,
        statusCode,
        message,
        data,
        pagination: {
            page,
            limit,
            totalCount,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        },
        timestamp: new Date().toISOString()
    });
};
