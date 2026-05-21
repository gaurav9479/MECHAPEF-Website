
export const USER_ROLES = {
    SUPER_ADMIN: 'SuperAdmin',
    EVENT_HEAD: 'EventHead',
    PR_TEAM: 'PRTeam',
    ALUMNI: 'Alumni',
    GENERAL_USER: 'GeneralUser'
};

export const ROLES_ARRAY = Object.values(USER_ROLES);

export const SUB_TEAMS = {
    CORE: 'Core',
    WEB_DEV: 'WebDev',
    PR: 'PR',
    LOGISTICS: 'Logistics',
    GRAPHICS: 'Graphics'
};

export const SUB_TEAMS_ARRAY = Object.values(SUB_TEAMS);

export const EVENT_CATEGORIES = {
    MECHAPEF_EVENT: 'MechapefEvent',
    DEPARTMENTAL: 'Departmental'
};

export const EVENT_CATEGORIES_ARRAY = Object.values(EVENT_CATEGORIES);

export const SPONSOR_TIERS = {
    TITLE: 'Title',
    GOLD: 'Gold',
    SILVER: 'Silver',
    BRONZE: 'Bronze'
};

export const SPONSOR_TIERS_ARRAY = Object.values(SPONSOR_TIERS);
export const SPONSOR_TIER_ORDER = ['Title', 'Gold', 'Silver', 'Bronze'];

export const REGISTRATION_TYPES = {
    SOLO: 'Solo',
    TEAM: 'Team'
};

export const REGISTRATION_TYPES_ARRAY = Object.values(REGISTRATION_TYPES);

export const PAYMENT_STATUS = {
    PENDING: 'Pending',
    PAID: 'Paid',
    NOT_APPLICABLE: 'NotApplicable'
};

export const PAYMENT_STATUS_ARRAY = Object.values(PAYMENT_STATUS);

export const CERTIFICATE_TYPES = {
    PARTICIPATION: 'Participation',
    WINNER: 'Winner',
    RUNNER_UP: 'RunnerUp'
};

export const CERTIFICATE_TYPES_ARRAY = Object.values(CERTIFICATE_TYPES);

export const ERROR_MESSAGES = {
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Forbidden - insufficient permissions',
    NOT_FOUND: 'Resource not found',
    INVALID_CREDENTIALS: 'Invalid email or password',
    EMAIL_EXISTS: 'Email already registered',
    TOKEN_EXPIRED: 'Token has expired',
    INVALID_TOKEN: 'Invalid token',
    SERVER_ERROR: 'Internal server error',
    VALIDATION_ERROR: 'Validation failed',
    EVENT_NOT_FOUND: 'Event not found',
    REGISTRATION_CLOSED: 'Registration deadline has passed',
    ALREADY_REGISTERED: 'User or team already registered for this event',
    TEAM_SIZE_EXCEEDED: 'Team size exceeds event maximum',
    INVALID_TEAM_MEMBERS: 'Invalid team member IDs'
};

export const SUCCESS_MESSAGES = {
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    USER_CREATED: 'User created successfully',
    EVENT_CREATED: 'Event created successfully',
    REGISTRATION_SUCCESS: 'Registration successful',
    CERTIFICATE_GENERATED: 'Certificates generated successfully'
};
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
};
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
};
