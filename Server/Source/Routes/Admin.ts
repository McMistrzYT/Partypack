/* eslint-disable no-case-declarations */
import j from "joi";
import { Router } from "express";
import { UserPermissions } from "../Schemas/User";
import { Song } from "../Schemas/Song";
import { RequireAuthentication, ValidateBody } from "../Modules/Middleware";
import { ForcedCategory } from "../Schemas/ForcedCategory";
import { DiscordRole } from "../Schemas/DiscordRole";
import { Bot } from "../Handlers/DiscordBot";
import { DISCORD_SERVER_ID } from "../Modules/Constants";

const App = Router();

// ! ANY ENDPOINTS DEFINED IN THIS FILE WILL REQUIRE ADMIN AUTHORIZATION !
// ! ANY ENDPOINTS DEFINED IN THIS FILE WILL REQUIRE ADMIN AUTHORIZATION !
// ! ANY ENDPOINTS DEFINED IN THIS FILE WILL REQUIRE ADMIN AUTHORIZATION !

App.use(RequireAuthentication());

App.use((req, res, next) => {
    if (req.user!.PermissionLevel! < UserPermissions.Administrator)
        return res.status(403).send("You don't have permission to access this endpoint.");

    next();
});

App.post("/create/role",
ValidateBody(j.object({
    ID: j.string().min(10).max(32).required(),
    Comment: j.string().min(0).max(128).optional(),
    PermissionLevel: j.number().valid(...(Object.values(UserPermissions).filter(x => !isNaN(Number(x))))).required()
})),
async (req, res) => {
    if (!Bot.isReady())
        return res.status(500).send("This Partypack instance has a misconfigured Discord bot.");

    if (!Bot.guilds.cache.get(DISCORD_SERVER_ID as string)?.roles.cache.has(req.body.ID))
        return res.status(404).send("This role does not exist in the Discord server.");

    const Existing = await DiscordRole.findOne({ where: { ID: req.body.ID } });
    if (Existing) {
        Existing.GrantedPermissions = req.body.PermissionLevel as UserPermissions;
        Existing.Comment = req.body.Comment ?? Existing.Comment;
        await Existing.save();
        return res.json(Existing.Package(true));
    }

    const RoleEntry = await DiscordRole.create({
        ID: req.body.ID,
        Comment: req.body.Comment ?? "No comment",
        GrantedPermissions: req.body.PermissionLevel as UserPermissions
    }).save();

    res.json(RoleEntry.Package(true));
});

App.post("/delete/role",
ValidateBody(j.object({
    ID: j.string().min(10).max(32).required()
})),
async (req, res) => {
    const RoleData = await DiscordRole.findOne({ where: { ID: req.body.ID } });
    if (!RoleData)
        return res.status(404).send("This role does not exist in the database.");

    await RoleData.remove();
    res.send("Removed role successfully.");
})

App.get("/discord/roles", async (_, res) => res.json(await Bot.guilds.cache.get(DISCORD_SERVER_ID!)?.roles.cache.sort((a, b) => b.position - a.position).map(x => { return { id: x.id, name: x.name } })));
App.get("/roles", async (_, res) => res.json((await DiscordRole.find()).map(x => x.Package(true))));
App.get("/tracks", async (_, res) => res.json((await Song.find()).map(x => x.Package(true))));

App.post("/update/discovery",
ValidateBody(j.array().items(j.object({
    ID: j.string().uuid().required(),
    Songs: j.array().items(j.string().uuid()).unique().min(1).max(20).required(),
    Priority: j.number().min(-50000).max(50000).required(),
    Header: j.string().min(3).max(125).required(),
    ShouldDelete: j.boolean().required()
})).max(15)),
async (req, res) => {
    const b = req.body as { ID: string, Songs: string[], Priority: number, Header: string, ShouldDelete: boolean }[];
    const Failures: { Regarding: string, Message: string }[] = [];
    const Successes: { Regarding: string, Message: string }[] = [];

    for (const Entry of b) {
        let Category = await ForcedCategory.findOne({ where: { ID: Entry.ID } });
        if (Entry.ShouldDelete) { // DELETION
            if (!Category) {
                Failures.push({ Regarding: Entry.ID, Message: "Cannot delete non-existent category." });
                continue;
            }

            await Category.remove();
            Successes.push({ Regarding: Entry.ID, Message: "Successfully deleted category." });
            continue;
        }

        if (!Category) // CREATION
            Category = await ForcedCategory.create({
                Header: Entry.Header,
                Activated: true,
                Priority: Entry.Priority,
                Songs: []
            });

        // MODIFICATION
        const Songs = await Promise.all(Entry.Songs.map(x => Song.findOne({ where: { ID: x } })));
        if (Songs.includes(null)) {
            Failures.push({ Regarding: Entry.ID, Message: `Cannot modify "${Entry.ID}" songs as it includes a non-existent song` });
            continue;
        }

        Category.Header = Entry.Header;
        Category.Priority = Entry.Priority;
        Category.Songs = Songs as Song[];
        Category.save();

        Successes.push({ Regarding: Entry.ID, Message: `Successfully created/modified category "${Category.ID}".` });
    }

    res.status(Failures.length > Successes.length ? 400 : 200).json({
        Failures,
        Successes
    })
});

export default {
    App,
    DefaultAPI: "/api/admin"
}