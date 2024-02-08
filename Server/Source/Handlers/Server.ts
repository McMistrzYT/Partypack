import e from "express"
import fs, { existsSync, mkdirSync } from "fs";
import { SAVED_DATA_PATH, BODY_SIZE_LIMIT, COOKIE_SIGN_KEY, DASHBOARD_ROOT, ENDPOINT_AUTHENTICATION_ENABLED, ENDPOINT_AUTH_HEADER, ENDPOINT_AUTH_VALUE, IS_DEBUG, PORT, PROJECT_NAME, SERVER_URL } from "../Modules/Constants";
import { Debug, Msg, Warn } from "../Modules/Logger";
import { italic, magenta, red, yellow } from "colorette";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";

export const App = e()
    .disable("etag")
    .disable("x-powered-by")
    .use(cookieParser(COOKIE_SIGN_KEY))
    .use(cors({
        origin: DASHBOARD_ROOT,
        credentials: true
    }))
    .use(e.json({ limit: BODY_SIZE_LIMIT }))
    .use(e.urlencoded({ limit: BODY_SIZE_LIMIT, extended: false }));

async function Initialize() {
    if (!existsSync(SAVED_DATA_PATH) || !existsSync(`${SAVED_DATA_PATH}/Songs`))
        mkdirSync(`${SAVED_DATA_PATH}/Songs`, { recursive: true });

    Debug(`The CWD is ${magenta(process.cwd())}.`);

    const Files = fs
        .readdirSync(path.join(".", Symbol.for("ts-node.register.instance") in process ? "Source" : "bin", "Routes"))
        .filter((F) => F.endsWith(".js") || F.endsWith(".ts"));

    if (ENDPOINT_AUTHENTICATION_ENABLED)
        Warn(`Endpoint authentication requirement is enabled! You will not be able to connect to the server without the ${yellow(ENDPOINT_AUTH_HEADER as string)} header.`)
    
    App.use((req, res, next) => {
        if (ENDPOINT_AUTHENTICATION_ENABLED && req.header(ENDPOINT_AUTH_HEADER as string) !== ENDPOINT_AUTH_VALUE)
            return res.status(403).send(`${SERVER_URL} is currently locked behind authentication. Come back later!`);

        Debug(req.path);
        next();
    })

    for (const File of Files) {
        const Contents = await import(path.join("..", "Routes", File));
        if (!Contents.default) continue;
        if (!Contents.default.App) continue;
        App.use(Contents.default.DefaultAPI || "/", Contents.default.App);

        Msg(`Loaded route ${italic(File)}!`);
    }

    if (existsSync("./dist")) {
        Warn(`Detected ${yellow("dist")} folder! Using as static.`);
        App.use("/", e.static("dist"));
        App.use("/assets", e.static("dist/assets"));
    }

    App.use("/api/*", (_, res) => res.status(404).send("Not Found"));
    App.use("*", (_, res) => res.sendFile(path.join(process.cwd(), "dist", "index.html")));

    App.use((err, req, res, _) => {
        console.error(err);
        res.status(500).json(IS_DEBUG ? err.message : "Oops! Something broke on our end. Sorry!");
    })
    
    App.listen(PORT, () => Msg(`${magenta(PROJECT_NAME)} now up on port ${magenta(PORT)} ${(IS_DEBUG ? red("(debug environment)") : "")}`));
}

Initialize();

// ! FESTIVAL-SPECIFIC STUFF
//import axios from "axios";

//axios.defaults.validateStatus = () => true;
//axios.defaults.headers.common["X-Do-Not-Redirect"] = "true";