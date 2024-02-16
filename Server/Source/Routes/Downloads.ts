import { Router } from "express";
import { existsSync, readFileSync } from "fs";
import { FULL_SERVER_ROOT, SAVED_DATA_PATH } from "../Modules/Constants";
import { CreateBlurl } from "../Modules/BLURL";
import { Song } from "../Schemas/Song";
import { OptionalAuthentication, RequireAuthentication } from "../Modules/Middleware";
import { UserPermissions } from "../Schemas/User";
import path from "path";

const App = Router();

App.get("/api/download/partypacker", (_, res) => res.redirect(`${FULL_SERVER_ROOT}/assets/Partypack-Launcher.zip`))

App.get("/song/download/:InternalID/:File",
OptionalAuthentication(),
async (req, res) => {
    //const Song = AvailableFestivalSongs.find(x => x.UUID === req.params.SongUUID);
    const SongData = await Song.findOne({ where: [ { ID: req.params.InternalID}, { PID: req.params.InternalID }  ], relations: { Author: true } });
    if (!SongData)
        return res.status(404).send("Song not found.");

    const IsPreview = SongData.ID !== SongData.PID && req.params.InternalID == SongData.PID;
    const ManifestPath = `${SAVED_DATA_PATH}/Songs/${SongData.ID}/${IsPreview ? `PreviewManifest.mpd` : `Manifest.mpd`}`;
    
    if (SongData.IsDraft) {
        if (!req.user)
            return res.status(403).send("Please log in to see details of this draft.");

        if (req.user.PermissionLevel! < UserPermissions.VerifiedUser && SongData.Author.ID !== req.user!.ID)
            return res.status(403).send("You cannot use this track, because it's a draft.");
    }

    const BaseURL = `${FULL_SERVER_ROOT}/song/download/${SongData.ID}/`;
    switch (req.params.File.toLowerCase()) {
        case "master.blurl":
        case "main.blurl":
            return res.set("content-type", "text/plain").send(
                CreateBlurl({
                    playlists: [
                        {
                            type: "main",
                            language: "en",
                            url: `${BaseURL}master.blurl`,
                            data: readFileSync(ManifestPath).toString().replaceAll("{BASEURL}", BaseURL)
                        }
                    ],
                    type: "vod",
                    audioonly: true
                })
            );

        case "manifest":
        case "manifest.mpd":
            return res.set("content-type", "application/dash+xml").send(Buffer.from(readFileSync(ManifestPath).toString().replaceAll("{BASEURL}", BaseURL)));
        
        case "cover":
        case "cover.png":
            return existsSync(`${SAVED_DATA_PATH}/Songs/${SongData.ID}/Cover.png`) ? res.set("content-type", "image/png").send(readFileSync(`${SAVED_DATA_PATH}/Songs/${SongData.ID}/Cover.png`)) : res.sendStatus(404);

        // ! we are not risking a lawsuit
        //case "midi.dat": // dont forget to encrypt!
            //return existsSync(`${SAVED_DATA_PATH}/Songs/${SongData.ID}/Data.mid`) ? res.set("content-type", "application/octet-stream").send(AesEncrypt(readFileSync(`${SAVED_DATA_PATH}/Songs/${SongData.ID}/Data.mid`))) : res.sendStatus(404);

        // funny little tip: you dont actually need to encrypt midis LMFAO
        case "midi":
        case "midi.mid":
        case "midi.midi": // forget to encrypt!
            return existsSync(`${SAVED_DATA_PATH}/Songs/${SongData.ID}/Data.mid`) ? res.set("content-type", "application/octet-stream").send(readFileSync(`${SAVED_DATA_PATH}/Songs/${SongData.ID}/Data.mid`)) : res.sendStatus(404);
    }
    
    if (!/^[\w\-.]+$/g.test(req.params.File))
        return res.status(400).send("File name failed validation.");

    if (!req.params.File.endsWith(".m4s") && !req.params.File.endsWith(".webm"))
        return res.sendStatus(403);

    const ChunkPath = `${SAVED_DATA_PATH}/Songs/${SongData.ID}/${IsPreview ? `PreviewChunks` : `Chunks`}/${req.params.File}`
    if (!existsSync(ChunkPath))
        return res.sendStatus(404);

    res.set("content-type", "video/mp4")
    res.send(readFileSync(ChunkPath));
});

App.get("/:InternalID",
(req, res, next) => {
    // send back index.html when the internal id is not a uuid - causes issues with reloading on sub-pages otherwise
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(req.params.InternalID))
        return res.sendFile(path.join(process.cwd(), "dist", "index.html"));

    next();
},
RequireAuthentication(),
async (req, res) => {
    const SongData = await Song.findOne({ where: [ { ID: req.params.InternalID }, { PID: req.params.InternalID } ], relations: { Author: true } });
    if (!SongData)
        return res.status(404).send("Track not found.");

    const IsPreview = SongData.ID != SongData.PID && req.params.InternalID == SongData.PID;

    if (SongData.IsDraft && ((req.user ? req.user.PermissionLevel < UserPermissions.VerifiedUser : true) && SongData.Author.ID !== req.user!.ID))
        return res.status(403).send("You cannot use this track, because it's a draft.");

    const BaseURL = `${FULL_SERVER_ROOT}/song/download/${IsPreview ? SongData.PID : SongData.ID}/`;
    res.set("content-type", "application/json");
    res.json({
        playlist: Buffer.from(readFileSync(`${SAVED_DATA_PATH}/Songs/${SongData.ID}/${IsPreview ? `PreviewManifest.mpd` : `Manifest.mpd`}`).toString().replaceAll("{BASEURL}", BaseURL)).toString("base64"),
        playlistType: "application/dash+xml",
        metadata: {
            assetId: "",
            baseUrls: [ BaseURL ],
            supportsCaching: true,
            ucp: "a",
            version: Math.floor(Date.now() / 1000)
        }
    });
});

export default {
    App
}
