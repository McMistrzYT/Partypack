import axios from "axios";
import jwt from "jsonwebtoken";
import qs from "querystring";
import j from "joi";
import { Response, Router } from "express";
import { DASHBOARD_ROOT, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_SERVER_ID, FULL_SERVER_ROOT, JWT_KEY } from "../Modules/Constants";
import { User, UserPermissions } from "../Schemas/User";
import { ValidateQuery } from "../Modules/Middleware";
import { Bot } from "../Handlers/DiscordBot";
import { Debug } from "../Modules/Logger";
import { DiscordRole } from "../Schemas/DiscordRole";
import { In } from "typeorm";
import { magenta } from "colorette";

const App = Router();

// ? hacky, if you want, make it less hacky
async function QuickRevokeToken(res: Response, Token: string) {
    await axios.post("https://discord.com/api/oauth2/token/revoke", qs.stringify({ token: Token, token_type_hint: "access_token" }), {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${Buffer.from(`${DISCORD_CLIENT_ID}:${DISCORD_CLIENT_SECRET}`).toString("base64")}`
        }
    })
    return res;
}

App.get("/discord/url", (_, res) => res.send(`https://discord.com/api/oauth2/authorize?client_id=${qs.escape(DISCORD_CLIENT_ID!)}&response_type=code&redirect_uri=${qs.escape(`${FULL_SERVER_ROOT}/api/discord`)}&scope=identify`))

App.get("/discord",
    ValidateQuery(j.object({
        code: j.string().pattern(/^(\w|\d)+$/i).required(),
        state: j.string()
    })),
    async (req, res) => {

        //const Discord = await axios.post(`https://discord.com/api/oauth2/token`, qs.stringify({ grant_type: "authorization_code", code: req.query.code as string, redirect_uri: `${FULL_SERVER_ROOT}/api/discord` }), { auth: { username: DISCORD_CLIENT_ID!, password: DISCORD_CLIENT_SECRET! } });

        const Discord = await axios.post(
            "https://discord.com/api/oauth2/token",
            qs.stringify({ grant_type: "authorization_code", code: req.query.code as string, redirect_uri: `${FULL_SERVER_ROOT}/api/discord` }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": `Basic ${Buffer.from(`${DISCORD_CLIENT_ID}:${DISCORD_CLIENT_SECRET}`).toString("base64")}`
                }
            }
        )

        if (Discord.status !== 200)
            return res.status(500).send("Failed to request OAuth token from Discord's services.");

        const DiscordData = Discord.data; // :waaaaa:

        if (!DiscordData.scope.includes("identify"))
            return (await QuickRevokeToken(res, DiscordData.access_token)).status(400).send("Missing identify scope. Please check if your OAuth link is correctly set up!");


        const UserData = await axios.get("https://discord.com/api/v10/users/@me", {
            headers: {
                "Authorization": `${DiscordData.token_type} ${DiscordData.access_token}`
            }
        })

        const UserDataBody = UserData.data;
        
        if (UserData.status !== 200)
            return (await QuickRevokeToken(res, DiscordData.access_token)).status(500).send("Failed to request user data from Discord's services.");

        await QuickRevokeToken(res, DiscordData.access_token);

        const AnyUserExists = await User.exists(); // automatically grant the first user on the database administrator permissions
        let UserPermissionLevel = !AnyUserExists ? UserPermissions.Administrator : UserPermissions.User;

        if (AnyUserExists && Bot.isReady()) {
            Debug("Using Discord roles to determine user permission level since the Discord bot exists and is ready.");

            const Sewer = Bot.guilds.cache.get(DISCORD_SERVER_ID as string);
            const Membuh = await Sewer?.members.fetch(UserDataBody.id);

            if (Membuh) {
                const RoulInDeightabaise = await DiscordRole.find({ where: { ID: In(Membuh.roles.cache.map(x => x.id)) }, order: { GrantedPermissions: "DESC" } });
                if (RoulInDeightabaise.length > 0)
                    UserPermissionLevel = RoulInDeightabaise[0].GrantedPermissions;

                Debug(`Detected ${magenta(RoulInDeightabaise.length)} roles that override Database permissions for user ${magenta(`@${UserDataBody.username}`)}. Giving permission level ${magenta(UserPermissionLevel)}.`)
            }
        }

        let DBUser = await User.findOne({ where: { ID: UserDataBody.id } });
        if (!DBUser)
            DBUser = await User.create({
                ID: UserDataBody.id,
                Username: UserDataBody.username,
                DisplayName: UserDataBody.global_name ?? UserDataBody.username,
                ProfilePictureURL: `https://cdn.discordapp.com/avatars/${UserDataBody.id}/${UserDataBody.avatar}.webp`,
                Library: [],
                PermissionLevel: UserPermissionLevel
            }).save();
        else {
            DBUser.Username = UserDataBody.username;
            DBUser.DisplayName = UserDataBody.global_name ?? UserDataBody.username;
            DBUser.ProfilePictureURL = `https://cdn.discordapp.com/avatars/${UserDataBody.id}/${UserDataBody.avatar}.webp`;
            DBUser.PermissionLevel = UserPermissionLevel;
            await DBUser.save();
        }

        const JWT = jwt.sign({ ID: UserDataBody.id }, JWT_KEY!, { algorithm: "HS256" });
        const UserDetails = Buffer.from(JSON.stringify({ ID: UserDataBody.id, Username: UserDataBody.username, GlobalName: UserDataBody.global_name, Avatar: `https://cdn.discordapp.com/avatars/${UserDataBody.id}/${UserDataBody.avatar}.webp`, IsAdmin: DBUser.PermissionLevel >= UserPermissions.Administrator, Role: DBUser.PermissionLevel })).toString("hex")
        if (req.query.state) {
            try {
                const Decoded = JSON.parse(Buffer.from(decodeURI(req.query.state as string), "base64").toString("utf-8"));
                if (Decoded.Client === "PartypackerDesktop")
                    return res.redirect(`http://localhost:14968/?token=${encodeURI(JWT)}&user=${encodeURI(UserDetails)}`)
                else
                    return res.status(400).send("Unsupported API client."); // idk maybe in the future we will maek more clients
            } catch {
                return res.status(400).send("Invalid state.");
            }
        }

        res
            .cookie("Token", JWT)
            .cookie("UserDetails", UserDetails)
            .redirect(`${DASHBOARD_ROOT}/profile`);
    })

export default {
    App,
    DefaultAPI: "/api"
}