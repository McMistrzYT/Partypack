import { DataSource, IsNull } from "typeorm";
import { ENVIRONMENT, SAVED_DATA_PATH } from "../Modules/Constants";
import { Song } from "../Schemas/Song";
import { ForcedCategory } from "../Schemas/ForcedCategory";
import { User } from "../Schemas/User";
import { Rating } from "../Schemas/Rating";
import { DiscordRole } from "../Schemas/DiscordRole";
import { Debug } from "../Modules/Logger";

export const DBSource = new DataSource({
    type: "better-sqlite3",
    database: `${SAVED_DATA_PATH}/Partypack${ENVIRONMENT !== "prod" ? `-${ENVIRONMENT}` : ""}.db`,
    synchronize: true,
    logging: false,
    entities: [
        Song,
        ForcedCategory,
        User,
        Rating,
        DiscordRole
        /*join(__dirname, "..", "Schemas") + "\\*{.js,.ts}"*/ // does not work in prod
    ],
    subscribers: [],
    migrations: [],
    enableWAL: true
});

(async () => {
    await DBSource.initialize();

    // Look for songs without a PID here so we can resolve problems before we do anything else
    const SongsWithNoPID = await Song.find({ where: { PID: IsNull() } });
    Debug(`We have ${SongsWithNoPID.length} song${SongsWithNoPID.length != 1 ? "s" : ""} with no PID`);

    SongsWithNoPID.forEach(async (Song) => {
        Debug(`Fixing up ${Song.Name} PID`);

        // Existing songs that actually need separate PIDs (> 2 channels) will need to have their audio reuploaded entirely
        // This is faster than checking to see if they all actually need one though...
        Song.PID = Song.ID;

        await Song.save();
        Debug(`${Song.Name} PID is now ${Song.PID} to match ${Song.ID}`);
    })

    // Look for published songs without ReviewSubmittedAt to fix before we do anything else
    const SongsWithoutReviewDate = await Song.find({ where: { IsDraft: false, ReviewSubmittedAt: IsNull() } });
    Debug(`We have ${SongsWithoutReviewDate.length} published song${SongsWithoutReviewDate.length != 1 ? "s" : ""} without review date`);

    SongsWithoutReviewDate.forEach(async (Song) => {
        Debug(`Fixing up ${Song.Name} PID`);

        Song.ReviewSubmittedAt = Song.CreationDate;

        await Song.save();
        Debug(`${Song.Name} Review date is now ${Song.ReviewSubmittedAt} to match ${Song.CreationDate}`);
    })
})();

/*
User
- discord id (primary)
- list of all songs in user's library
- list of all songs in user's published

Song
- length
- bpm
- key
- scale
- keytar/guitar
- icon url
- name
- artist
- release year
*/