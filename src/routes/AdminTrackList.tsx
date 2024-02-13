import axios from "axios";
import { Box, Button, Heading } from "@primer/react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Song } from "../components/Song";
import { useNavigate } from "react-router-dom";

export function AdminTrackList() {
    const [tracks, setTracks] = useState<{ ID: string }[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            const Tracks = await axios.get("/api/admin/tracks");
            if (Tracks.status !== 200)
                return toast("Error while requesting tracks!");

            setTracks(Tracks.data);
        })();
    }, []);

    return (
        <>
            <Heading>[ADMIN] All tracks <Button sx={{ marginBottom: 2 }} onClick={() => navigate("/submissions")}>Create</Button></Heading>
            <Box className="songCategory">
                {
                    tracks.map((x, i) => {
                        return <Song data={x}>
                            <Button sx={{ width: "100%", marginBottom: 1 }}>View Details</Button>
                            <Button sx={{ width: "100%" }} variant="danger" onClick={async () => {
                                const Res = await axios.post("/api/drafts/delete", { TargetSong: x.ID });
                                if (Res.status === 200)
                                {
                                    tracks.splice(i, 1);
                                    setTracks([
                                        ...tracks,
                                    ])
                                }
                                
                                toast(Res.data, { type: Res.status === 200 ? "success" : "error" });
                            }}>Delete</Button>
                        </Song>
                    })
                }
            </Box>
        </>
    )
}