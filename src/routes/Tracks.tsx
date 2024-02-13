import { Box, Button, Heading } from "@primer/react";
import { Song } from "../components/Song";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { SiteContext } from "../utils/State";

export function Tracks() {
    const [trackData, setTrackData] = useState<{ Header: string, Songs: { ID: string }[] }[]>([]);
    const [bookmarks, setBookmarks] = useState<{ ID: string }[]>([]);
    const {state} = useContext(SiteContext);

    useEffect(() => {
        (async () => {
            const Discovery = await axios.get("/api/discovery");
            if (Discovery.status !== 200)
                return toast(Discovery.data, { type: "error" });

            setTrackData(Discovery.data);

            const Bookmarks = await axios.get("/api/library/me");
            if (Bookmarks.status !== 200)
                return// toast(Bookmarks.data, { type: "error" });

            setBookmarks(Bookmarks.data.Bookmarks);
        })();
    }, [])

    return (
        <>
            {
                trackData.map(x => {
                    return <Box>
                        <Heading sx={{ marginTop: 2, marginBottom: 2 }}>{x.Header}</Heading>
                        <Box className="songCategory">
                            {
                                x.Songs.map(x => {
                                    return <Song data={x}>
                                        {
                                            bookmarks.findIndex(y => y.ID === x.ID) !== -1 ?
                                                <Button sx={{ width: "100%", marginBottom: 1 }} variant="danger" onClick={async () => {
                                                    const Res = await axios.post("/api/library/me/unbookmark", { SongID: x.ID });
                                                    if (Res.status === 200)
                                                    {
                                                        bookmarks.splice(bookmarks.findIndex(y => y.ID === x.ID), 1);
                                                        setBookmarks([...bookmarks]);
                                                    }
                                                    else
                                                        toast(Res.data, { type: "error" })
                                                }}>Unsubscribe</Button> :
                                                <Button sx={{ width: "100%", marginBottom: 1 }} variant="primary" onClick={async () => {
                                                    if (!state.UserDetails)
                                                    {
                                                        if (!state.DiscordOauthURL)
                                                            return toast("You are not logged in. Please log in first!");
        
                                                        return window.location.assign(state.DiscordOauthURL);
                                                    }
        
                                                    const Res = await axios.post("/api/library/me/bookmark", { SongID: x.ID });
                                                    if (Res.status === 200)
                                                    {
                                                        bookmarks.push(x);
                                                        setBookmarks([...bookmarks]);
                                                    }
                                                    else
                                                        toast(Res.data, { type: "error" })
                                                }}>Subscribe</Button>
                                        }
                                    </Song>
                                })
                            }
                        </Box>
                    </Box>
                })
            }
        </>
    )
}