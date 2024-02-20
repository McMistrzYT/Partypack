import { Router } from "express";
import { RequireAuthentication, ValidateBody } from "../Modules/Middleware";
import { Song, SongStatus } from "../Schemas/Song";
import { OriginalSparks } from "../Modules/FNUtil";
import j from "joi";
import { User, UserPermissions } from "../Schemas/User";
import { AsyncFilter } from "../Modules/Extensions";

const App = Router();

App.get("/me", RequireAuthentication({ BookmarkedSongs: true, CreatedTracks: { ReviewedBy: { BookmarkedSongs: false }}}), async (req, res) => {
    const ProcessingTracks = req.user!.CreatedTracks.filter(x => x.Status === SongStatus.PROCESSING);
    // @ts-expect-error not gonna bother making type
    const NonExistingActiveTracks = await AsyncFilter(req.user!.Library, async x => !(await Song.exists({ where: { ID: x.SongID } })));

    if (NonExistingActiveTracks.length > 0) {
        for (const Track of NonExistingActiveTracks) {
            console.log(Track);
            // @ts-expect-error again not gonna bother making type
            req.user!.Library.splice(req.user!.Library.findIndex(x => x.SongID === Track.SongID), 1);
        }
        await req.user!.save();
    }

    if (ProcessingTracks.length > 0)
        for (const Track of ProcessingTracks) {
            if (!Track.HasAudio || !Track.HasMidi || !Track.HasCover)
                continue;

            Track.Status = SongStatus.DEFAULT;
            await Track.save();
        }

    res.json({
        Bookmarks: req.user!.BookmarkedSongs.map(x => x.Package()),
        Created: req.user!.CreatedTracks.map(x => x.Package(true)),
        Library: req.user!.Library
    })
})

App.post("/me/activate",
RequireAuthentication(),
ValidateBody(j.object({
    SongID: j.string().uuid().required(),
    ToOverride: j.string().pattern(/^sid_placeholder_(\d){1,3}$/i).required()
})),
async (req, res) => {
    if (req.user!.Library!.length >= 15)
        return res.status(400).send("You have too many active songs. Please deactivate some to free up space.");

    if (req.user!.Library.findIndex(x => x.SongID.toLowerCase() === req.body.SongID.toLowerCase() || x.Overriding.toLowerCase() === req.body.ToOverride.toLowerCase()) !== -1)
        return res.status(400).send("This song is already activated.");

    const SongData = await Song.findOne({ where: { ID: req.body.SongID }, relations: { Author: true } });
    if (!SongData)
        return res.status(404).send("Provided song doesn't exist.");

    if (SongData.IsDraft && (req.user!.PermissionLevel < UserPermissions.TrackVerifier && SongData.Author.ID !== req.user!.ID))
        return res.status(403).send("You cannot activate this track, because it's a draft.");

    req.user!.Library.push({ SongID: req.body.SongID.toLowerCase(), Overriding: req.body.ToOverride.toLowerCase() });
    req.user!.save();

    res.json(req.user!.Library);
})

App.post("/me/deactivate",
RequireAuthentication(),
ValidateBody(j.object({
    SongID: j.string().uuid().required()
})),
async (req, res) => {
    const idx = req.user!.Library.findIndex(x => x.SongID.toLowerCase() === req.body.SongID.toLowerCase());
    if (idx === -1)
        return res.status(400).send("This song is not activated.");

    req.user?.Library.splice(idx, 1);
    req.user?.save();

    res.json(req.user?.Library);
})

App.post("/me/copyactivated",
RequireAuthentication(),
ValidateBody(j.object({
    ID: j.string()
})),
async (req, res) => {
    const ToFind = await User.findOne({where: {ID: req.body.ID}});

    if(!ToFind)
        return res.status(404).send("Could not find that user.");
    if(!ToFind?.SharingLibrary)
        return res.status(403).send("That user doesnt have song sharing enabled.");

    req.user!.Library = ToFind!.Library;
    req.user!.save();

    res.json(ToFind!.Library);
})

App.post("/me/bookmark",
RequireAuthentication({ BookmarkedSongs: true }),
ValidateBody(j.object({
    SongID: j.string().uuid().required()
})),
async (req, res) => {
    if (req.user?.BookmarkedSongs.findIndex(x => x.ID.toLowerCase() === req.body.SongID.toLowerCase()) !== -1)
        return res.status(400).send("You're already subscribed to this song.");

    const SongData = await Song.findOne({ where: { ID: req.body.SongID }, relations: { Author: true } });
    if (!SongData)
        return res.status(404).send("Provided song doesn't exist.");

    if (SongData.IsDraft && (req.user.PermissionLevel < UserPermissions.TrackVerifier && SongData.Author.ID !== req.user.ID))
        return res.status(403).send("You cannot subscribe to this track, because it's a draft.");

    req.user?.BookmarkedSongs.push(SongData);
    req.user?.save();

    res.json(req.user?.BookmarkedSongs.map(x => x.Package()));
})

App.post("/me/unbookmark",
RequireAuthentication(),
ValidateBody(j.object({
    SongID: j.string().uuid().required()
})),
async (req, res) => {
    const idx = req.user!.BookmarkedSongs.findIndex(x => x.ID.toLowerCase() === req.body.SongID.toLowerCase());
    if (idx === -1)
        return res.status(400).send("You aren't subscribed to this song.");

    req.user?.BookmarkedSongs.splice(idx, 1);
    req.user?.save();

    res.json(req.user?.BookmarkedSongs.map(x => x.Package()));
})

App.get("/song/data/:InternalID",
RequireAuthentication(),
async (req, res) => {
    const SongData = await Song.findOne({ where: { ID: req.params.InternalID }, relations: { Author: true } });
    if (!SongData)
        return res.status(404).send("Provided song doesn't exist.");

    if (SongData.IsDraft && (req.user!.PermissionLevel < UserPermissions.TrackVerifier && SongData.Author.ID !== req.user!.ID))
        return res.status(403).send("You cannot use assets of this track, because it's a draft.");

    res.json(SongData.Package());
})

// i have no fucking clue why, but kendrick lamar's i does not work when replacing
App.get("/available", (__, res) => res.json(Object.values(OriginalSparks!).filter(x => !!x.track).filter(x => x.track.tt !== "i").map(x => { return { Name: x.track.tt, Template: x.track.ti.substring(11) }; }).sort((a, b) => a.Name.toLowerCase() > b.Name.toLowerCase() ? 1 : -1)))

export default {
    App,
    DefaultAPI: "/api/library"
}