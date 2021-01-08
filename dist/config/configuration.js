"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12;
Object.defineProperty(exports, "__esModule", { value: true });
const slugify_1 = __importDefault(require("@sindresorhus/slugify"));
const dotenv_1 = require("dotenv");
const dotenv_expand_1 = __importDefault(require("dotenv-expand"));
dotenv_expand_1.default(dotenv_1.config());
const int = (val, num) => val ? (isNaN(parseInt(val)) ? num : parseInt(val)) : num;
const bool = (val, bool) => val == null ? bool : val == 'true';
const configuration = {
    meta: {
        frontendUrl: (_a = process.env.FRONTEND_URL) !== null && _a !== void 0 ? _a : 'http://localhost:3000',
        appName: (_b = process.env.APP_NAME) !== null && _b !== void 0 ? _b : 'Staart',
        domainVerificationFile: (_c = process.env.DOMAIN_VERIFICATION_FILE) !== null && _c !== void 0 ? _c : `${slugify_1.default((_d = process.env.APP_NAME) !== null && _d !== void 0 ? _d : 'Staart')}-verify.txt`,
    },
    rateLimit: {
        public: {
            points: int(process.env.RATE_LIMIT_PUBLIC_POINTS, 250),
            duration: int(process.env.RATE_LIMIT_PUBLIC_DURATION, 3600),
        },
        authenticated: {
            points: int(process.env.RATE_LIMIT_AUTHENTICATED_POINTS, 5000),
            duration: int(process.env.RATE_LIMIT_AUTHENTICATED_DURATION, 3600),
        },
        apiKey: {
            points: int(process.env.RATE_LIMIT_API_KEY_POINTS, 10000),
            duration: int(process.env.RATE_LIMIT_API_KEY_DURATION, 3600),
        },
    },
    caching: {
        geolocationLruSize: int(process.env.GEOLOCATION_LRU_SIZE, 100),
        apiKeyLruSize: int(process.env.API_KEY_LRU_SIZE, 100),
    },
    security: {
        saltRounds: int(process.env.SALT_ROUNDS, 10),
        jwtSecret: (_e = process.env.JWT_SECRET) !== null && _e !== void 0 ? _e : 'staart',
        issuerDomain: (_f = process.env.ISSUER_DOMAIN) !== null && _f !== void 0 ? _f : 'staart.js.org',
        totpWindowPast: int(process.env.TOTP_WINDOW_PAST, 1),
        totpWindowFuture: int(process.env.TOTP_WINDOW_FUTURE, 0),
        mfaTokenExpiry: (_g = process.env.MFA_TOKEN_EXPIRY) !== null && _g !== void 0 ? _g : '10m',
        mergeUsersTokenExpiry: (_h = process.env.MERGE_USERS_TOKEN_EXPIRY) !== null && _h !== void 0 ? _h : '30m',
        accessTokenExpiry: (_j = process.env.ACCESS_TOKEN_EXPIRY) !== null && _j !== void 0 ? _j : '1h',
        passwordPwnedCheck: bool(process.env.PASSWORD_PWNED_CHECK, true),
        unusedRefreshTokenExpiryDays: int(process.env.DELETE_EXPIRED_SESSIONS, 30),
        inactiveUserDeleteDays: int(process.env.INACTIVE_USER_DELETE_DAYS, 30),
    },
    elasticSearch: {
        node: process.env.ELASTICSEARCH_NODE,
        retries: int(process.env.ELASTICSEARCH_FAIL_RETRIES, 3),
        auth: process.env.ELASTICSEARCH_AUTH_USERNAME
            ? {
                username: process.env.ELASTICSEARCH_AUTH_USERNAME,
                password: process.env.ELASTICSEARCH_AUTH_PASSWORD,
            }
            : process.env.ELASTICSEARCH_AUTH_API_KEY
                ? process.env.ELASTICSEARCH_AUTH_API_KEY_ID
                    ? {
                        apiKey: {
                            api_key: process.env.ELASTICSEARCH_AUTH_API_KEY,
                            id: process.env.ELASTICSEARCH_AUTH_API_KEY_ID,
                        },
                    }
                    : { apiKey: process.env.ELASTICSEARCH_AUTH_API_KEY }
                : undefined,
        aws: {
            accessKeyId: (_k = process.env.ELASTICSEARCH_AWS_ACCESS_KEY_ID) !== null && _k !== void 0 ? _k : '',
            secretAccessKey: (_l = process.env.ELASTICSEARCH_AWS_SECRET_ACCESS_KEY) !== null && _l !== void 0 ? _l : '',
            region: (_m = process.env.ELASTICSEARCH_AWS_REGION) !== null && _m !== void 0 ? _m : '',
        },
    },
    email: {
        name: (_p = (_o = process.env.EMAIL_NAME) !== null && _o !== void 0 ? _o : process.env.APP_NAME) !== null && _p !== void 0 ? _p : 'Staart',
        from: (_q = process.env.EMAIL_FROM) !== null && _q !== void 0 ? _q : '',
        retries: int(process.env.EMAIL_FAIL_RETRIES, 3),
        ses: {
            accessKeyId: (_r = process.env.EMAIL_SES_ACCESS_KEY_ID) !== null && _r !== void 0 ? _r : '',
            secretAccessKey: (_s = process.env.EMAIL_SES_SECRET_ACCESS_KEY) !== null && _s !== void 0 ? _s : '',
            region: (_t = process.env.EMAIL_SES_REGION) !== null && _t !== void 0 ? _t : '',
        },
        transport: {
            host: (_u = process.env.EMAIL_HOST) !== null && _u !== void 0 ? _u : '',
            port: int(process.env.EMAIL_PORT, 587),
            secure: bool(process.env.EMAIL_SECURE, false),
            auth: {
                user: (_w = (_v = process.env.EMAIL_USER) !== null && _v !== void 0 ? _v : process.env.EMAIL_FROM) !== null && _w !== void 0 ? _w : '',
                pass: (_x = process.env.EMAIL_PASSWORD) !== null && _x !== void 0 ? _x : '',
            },
        },
    },
    webhooks: {
        retries: int(process.env.WEBHOOK_FAIL_RETRIES, 3),
    },
    sms: {
        retries: int(process.env.SMS_FAIL_RETRIES, 3),
        twilioAccountSid: (_y = process.env.TWILIO_ACCOUNT_SID) !== null && _y !== void 0 ? _y : '',
        twilioAuthToken: (_z = process.env.TWILIO_AUTH_TOKEN) !== null && _z !== void 0 ? _z : '',
    },
    payments: {
        stripeApiKey: (_0 = process.env.STRIPE_API_KEY) !== null && _0 !== void 0 ? _0 : '',
        stripeProductId: (_1 = process.env.STRIPE_PRODUCT_ID) !== null && _1 !== void 0 ? _1 : '',
        stripeEndpointSecret: (_2 = process.env.STRIPE_ENDPOINT_SECRET) !== null && _2 !== void 0 ? _2 : '',
        paymentMethodTypes: ['card'],
    },
    tracking: {
        mode: (_3 = process.env.TRACKING_MODE) !== null && _3 !== void 0 ? _3 : 'api-key',
        index: (_4 = process.env.TRACKING_INDEX) !== null && _4 !== void 0 ? _4 : 'staart-logs',
        deleteOldLogs: bool(process.env.TRACKING_DELETE_OLD_LOGS, true),
        deleteOldLogsDays: int(process.env.TRACKING_DELETE_OLD_LOGS_DAYS, 90),
    },
    slack: {
        token: (_5 = process.env.SLACK_TOKEN) !== null && _5 !== void 0 ? _5 : '',
        slackApiUrl: process.env.SLACK_API_URL,
        rejectRateLimitedCalls: bool(process.env.SLACK_REJECT_RATE_LIMITED_CALLS, false),
        retries: int(process.env.SLACK_FAIL_RETRIES, 3),
    },
    airtable: {
        apiKey: (_6 = process.env.AIRTABLE_API_KEY) !== null && _6 !== void 0 ? _6 : '',
        endpointUrl: process.env.AIRTABLE_ENDPOINT_URL,
    },
    s3: {
        accessKeyId: (_7 = process.env.S3_ACCESS_KEY_ID) !== null && _7 !== void 0 ? _7 : '',
        secretAccessKey: (_8 = process.env.S3_SECRET_ACCESS_KEY) !== null && _8 !== void 0 ? _8 : '',
        region: (_9 = process.env.S3_REGION) !== null && _9 !== void 0 ? _9 : '',
        bucket: process.env.S3_BUCKET,
    },
    cloudinary: {
        cloudName: (_10 = process.env.CLOUDINARY_CLOUD_NAME) !== null && _10 !== void 0 ? _10 : '',
        apiKey: (_11 = process.env.CLOUDINARY_API_KEY) !== null && _11 !== void 0 ? _11 : '',
        apiSecret: (_12 = process.env.CLOUDINARY_API_SECRET) !== null && _12 !== void 0 ? _12 : '',
    },
    firebase: {
        serviceAccountKey: process.env.FIREBASE_PROJECT_ID
            ? {
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY,
            }
            : process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        databaseUrl: process.env.FIREBASE_DATABASE_URL,
    },
    github: {
        auth: process.env.GITHUB_AUTH,
        userAgent: process.env.GITHUB_USER_AGENT,
    },
    googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
    },
};
const configFunction = () => configuration;
exports.default = configFunction;
//# sourceMappingURL=configuration.js.map