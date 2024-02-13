import j from "joi";
import { NextFunction, Request, Response, Router } from "express";
import { RequireAuthentication, ValidateBody } from "../Modules/Middleware";
import { UserPermissions } from "../Schemas/User";
import { Song, SongStatus } from "../Schemas/Song";

const App = Router();

App.use(RequireAuthentication());

function PermsLevel(Perms: UserPermissions = UserPermissions.Moderator) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user)
            return res.status(403).send();

        if (req.user.PermissionLevel < Perms)
            return res.status(403).send("You don't have permission to access this endpoint.");

        next();
    };
}

App.get("/submissions",
PermsLevel(UserPermissions.TrackVerifier),
async (_, res) => res.json((await Song.find({ where: { IsDraft: true, Status: SongStatus.AWAITING_REVIEW }, order: { DraftReviewSubmittedAt: "ASC" } })).map(x => x.Package(true))));

App.post("/submissions/:Action",
PermsLevel(UserPermissions.TrackVerifier),
ValidateBody(j.object({
    SongID: j.string().uuid().required(),
    ReasonForDenial: j.string()
})),
async (req, res) => {
    const SongData = await Song.findOne({ where: { ID: req.body.SongID } });
    if (!SongData)
        return res.status(404).send("This song does not exist anymore.");

    if (req.params.Action !== "deny" && req.params.Action !== "accept")
        return res.status(400).send("Invalid action requested.");

    if (SongData.Status !== SongStatus.AWAITING_REVIEW)
        return res.status(400).send("This song is no longer awaiting a review.");

    switch (req.params.Action) {
        case "accept":
            SongData.Status = SongStatus.ACCEPTED;
            break;

        case "deny":
            if (!req.body.ReasonForDenial)
                return res.status(400).send("Please fill in the reason for denial before denying a song.");
            SongData.Status = SongStatus.DENIED;
            SongData.ReasonForDenial = req.body.ReasonForDenial;
            break;
    }

    SongData.ReviewSubmittedAt = new Date();
    SongData.ReviewedBy = req.user;
    await SongData.save();
    res.send("Successfully changed song status.");
});

export default {
    App,
    DefaultAPI: "/api/moderation"
}