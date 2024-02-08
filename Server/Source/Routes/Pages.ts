import { Router } from "express";
import { FullFortnitePages, GenerateFortnitePages } from "../Modules/FNUtil";
import { IS_DEBUG } from "../Modules/Constants";
import { RequireAuthentication } from "../Modules/Middleware";
import axios from "axios";

const App = Router();

App.get("/content/api/pages/fortnite-game", (_, res) => res.json({
    ...FullFortnitePages,
    sparkTracks: {
        ...FullFortnitePages!.sparkTracks,
        _activeDate: "2023-01-01T01:00:00.000Z",
        lastModified: new Date().toISOString()
    }
}))

App.get("/content/api/pages/fortnite-game/:Section", RequireAuthentication(), async (req, res) => {
    if (req.params.Section.toLowerCase() === "spark-tracks") // custom song injection
    {
        const ProcessedPages = await GenerateFortnitePages(req.user!);

        res.removeHeader("Access-Control-Allow-Origin");
        res.removeHeader("Access-Control-Allow-Credentials");
        res.removeHeader("Vary");

        return res.json(
            {
                _title: "spark-tracks",
                _noIndex: false,
                _activeDate: "2023-01-01T01:00:00.000Z",
                lastModified: new Date().toISOString(),
                _locale: "en-US",
                _templateName: "blank",
                ...ProcessedPages.FNPages,
                _suggestedPrefetch: []
            }
        );
    }

    const CachedSection = Object.values(FullFortnitePages!).find(x => x._title === req.params.Section);
    if (!CachedSection)
        return res.status(404).send("funny section not found haha kill me");

    const ContentFromServer = await axios.get(`https://fortnitecontent-website-prod07.ol.epicgames.com/content/api/pages/fortnite-game/${CachedSection._title}`)
    if (ContentFromServer.status !== 200)
        return res.status(404).json({ error: IS_DEBUG ? ContentFromServer.data : "Fortnite server returned an error." });

    res.json(ContentFromServer.data);
})

export default {
    App
}