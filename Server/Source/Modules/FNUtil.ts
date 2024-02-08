import axios from "axios";
import { Err } from "./Logger";
import { red } from "colorette";
import { FULL_SERVER_ROOT } from "./Constants";
import { User } from "../Schemas/User";
import { Song } from "../Schemas/Song";

export let FullFortnitePages: { [key: string]: any } | null = null;
export let OriginalSparks: {[key: string]: any} | null = null;
let LastContentDownloadDate: Date = new Date(0); // set it to 1970 as default cuz im not boutta check if its null

GenerateFortnitePages(null);

export async function GenerateFortnitePages(ForUser: User | null): Promise<{ Success: boolean, FNPages: { [key: string]: unknown } | null }> {
    const { status, data } = // check if 30 minutes have passed since last content update. if so, get a new copy of pages, if not, fuck off
        FullFortnitePages === null || Date.now() > LastContentDownloadDate.getTime() + 30 * 60 * 1000 ?
            await axios.get("https://fortnitecontent-website-prod07.ol.epicgames.com/content/api/pages/fortnite-game") :
            { status: 200, data: FullFortnitePages };
    
    const OGSparks =
        OriginalSparks === null || Date.now() > LastContentDownloadDate.getTime() + 30 * 60 * 1000 ?
            await axios.get("https://fortnitecontent-website-prod07.ol.epicgames.com/content/api/pages/fortnite-game/spark-tracks") :
            { status: 200, data: OriginalSparks };

    FullFortnitePages = {
        ...data,
        sparkTracks: {
            ...data.sparkTracks,
            lastModified: new Date().toISOString()
        }
    };
    OriginalSparks = OGSparks.data;
    LastContentDownloadDate = new Date();

    if (!ForUser)
        return { Success: true, FNPages: null };

    if (status !== 200 || OGSparks.status !== 200) {
        Err(`Failed to get Fortnite pages: ${red(status)}, ${red(OGSparks.status)}`);
        console.log(data);
        process.exit(-1); // very big fuck moment, we literally cannot run the server without fortnitepages
    }

    const AllSongs: { [key: string]: unknown } = {}; // too lazy to actually write a schema for this :D
    const Overrides = ForUser.Library.map(x => { return { ...x, SongData: Song.findOne({ where: { ID: x.SongID } }) }; });
    const UsersLibrary = await Promise.all(Overrides.map(x => x.SongData));

    for (const Song of UsersLibrary) 
    {
        if (!Song)
            continue;

        const OverridingAs = Overrides.find(x => x.SongID === Song.ID);
        if (!OverridingAs)
            continue;
        
        const OriginalTrack = Object.values(OriginalSparks!).find(x => x.track?.ti === `SparksSong:${OverridingAs.Overriding.toLowerCase()}`);
        if (!OriginalTrack)
            continue;

        AllSongs[OriginalTrack._title] = {
            _title: OriginalTrack._title,
            _noIndex: false,
            _activeDate: "2023-01-01T01:00:00.000Z",
            _locale: "en-US",
            _templateName: "track",
            lastModified: new Date().toISOString(),
            track: {
                tt: Song.Name, // tt - Title,
                an: Song.ArtistName, // an - Artist Name
                mm: Song.Scale, // mm - Minor, Major
                mk: Song.Key, // mk - Music Key
                ab: Song.Album, // ab - Album
                su: OriginalTrack._title, // su - Song UUID
                ry: Song.Year, // ry - Release Year
                mt: Song.Tempo, // mt - Music Timing (?)
                au: Song.Cover ?? `${FULL_SERVER_ROOT}/song/download/${Song.ID}/cover.png`, // au - Album Cover
                gt: [ "Jam-LoopIsUnpitched-Beat" ], // gt - Gameplay Tags (but in a different format: Example.Gameplay.Tag -> Example-Gameplay-Tag)
                ti: `SparksSong:${OverridingAs.Overriding.toLowerCase()}`,
                mu: Song.Midi ?? `${FULL_SERVER_ROOT}/song/download/${Song.ID}/midi.mid`, // mu - Song Midi (encrypted)
                dn: Song.Length, // dn - Track Length (in seconds)
                ge: [ "Pop" ], // ge - Genres
                in: {
                    ba: Song.BassDifficulty,
                    pb: Song.BassDifficulty,
                    pd: Song.DrumsDifficulty,
                    ds: Song.DrumsDifficulty,
                    pg: Song.GuitarDifficulty,
                    gr: Song.GuitarDifficulty,
                    vl: Song.VocalsDifficulty,
                    _type: "SparkTrackIntensities"
                }, // in - Intensities (those white bars you see)
                sib: "Bass", // sib - Bass ID to use (only Bass possible)
                sid: "Drum", // sid - Drums ID to use (only Drum possible)
                sig: Song.GuitarStarterType, // sig - Guitar ID to use (Keytar/Guitar)
                siv: "Vocals", // siv - Vocals ID to use (only Vocals possible)
                qi: JSON.stringify({ // qi - Query Information (frontend related display stuff and language vocals channel related stuff)
                    sid: Song.ID, // sid - Song UUID
                    pid: Song.PID, // pid - Playlist Asset ID
                    title: OriginalTrack._title, // title - Song Name - same as _title
                    tracks: [
                        {
                            part: "ds", // Drum Set
                            channels: [ "FL", "FR" ],
                            vols: [ 4, 4 ]
                        },
                        {
                            part: "bs", // Bass Set (not bullshit)
                            channels: [ "FL", "FR" ],
                            vols: [ 4, 4 ]
                        },
                        {
                            part: "gs", // Guitar Set
                            channels: [ "FL", "FR" ],
                            vols: [ 4, 4 ]
                        },
                        {
                            part: "vs", // Vocal Set (not Visual Studio)
                            channels: [ "FL", "FR" ],
                            vols: [ 4, 4 ]
                        },
                        {
                            part: "fs", // Fart Set (jk i have no idea)
                            channels: [ "FL", "FR" ],
                            vols: [ 4, 4 ]
                        }
                    ],
                    preview: {
                        starttime: 0
                    }
                }),
                ld: Song.Lipsync ?? OriginalTrack.track.ld, // ld - Lipsync Data (it's literally a uasset)
                jc: OriginalTrack.track.jc, // jc - Join Code (UEFN empty island with nothing - possibly downloads assets)
                sn: OriginalTrack._title, // sn - Song Name - same as _title
                _type: "SparkTrack"
            }
        };
    }

    return { Success: true, FNPages: AllSongs };
}