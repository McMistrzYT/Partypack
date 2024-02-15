export const ENVIRONMENT = process.env.ENVIRONMENT ?? "dev";
export const IS_DEBUG = ENVIRONMENT.toLowerCase() === "dev" || ENVIRONMENT.toLowerCase() === "stage"; // IS_DEBUG can be used to enable test endpoints, unsafe code and more.

export const SAVED_DATA_PATH = process.env.SAVED_DIRECTORY as string;
export const PROJECT_NAME = process.env.PROJECT_NAME ?? "BasedServer"; // Default prefix for the logger module.
export const BODY_SIZE_LIMIT = process.env.BODY_SIZE_LIMIT ?? "10mb"; // Doesn't accept requests with body sizes larger than this value.
export const SERVER_URL = process.env.SERVER_URL ?? "localhost"; // The server's URL. Not used for a lot by default.
export const DASHBOARD_URL = process.env.DASHBOARD_URL ?? "localhost:5173"; // The server's URL. Not used for a lot by default.
export const PORT = process.env.PORT ?? 6677; // Port for the server to run on.
export const ENDPOINT_AUTHENTICATION_ENABLED = !!process.env.ENDPOINT_AUTHENTICATION; // Whether the server is locked down behind a header.
export const _ENDPOINT_AUTHENTICATION_ENV = process.env.ENDPOINT_AUTHENTICATION;
export const ENDPOINT_AUTH_HEADER = _ENDPOINT_AUTHENTICATION_ENV?.split(":")[0]; // Header name for endpoint auth.
export const ENDPOINT_AUTH_VALUE = _ENDPOINT_AUTHENTICATION_ENV?.split(":")[1]; // Value of the header for endpoint auth.
export const USE_HTTPS = process.env.USE_HTTPS?.toLowerCase() === "true";
export const DASHBOARD_ROOT = `http${USE_HTTPS ? "s" : ""}://${DASHBOARD_URL}`; // A shortcut so that you don't need to type this out every time you wanna display the dashboard URL.
export const FULL_SERVER_ROOT = `http${USE_HTTPS ? "s" : ""}://${SERVER_URL}${!USE_HTTPS ? `:${PORT}` : ""}`; // A shortcut so that you don't need to type this out every time you wanna display the server URL.
export const COOKIE_SIGN_KEY = process.env.COOKIE_SIGN_KEY; // Secret that will be used to sign cookies.
export const ADMIN_KEY = process.env.ADMIN_KEY; // Secret that will be required to sign into the Admin Dashboard.
export const JWT_KEY = process.env.JWT_KEY; // Secret that will be required to sign JSON Web Tokens (JWTs).
export const BOT_TOKEN = process.env.BOT_TOKEN; // Used for Discord-related stuff.
export const MAX_AMOUNT_OF_DRAFTS_AT_ONCE = process.env.MAX_AMOUNT_OF_DRAFTS_AT_ONCE; // A limit for all the drafts you can have.
export const DISCORD_SERVER_ID = process.env.DISCORD_SERVER_ID; // Server ID to check roles for permissions in.
export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID; // Client ID for authentication and checking what role you have on the Discord server.
export const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET; // Client secret for authentication and checking what role you have on the Discord server.