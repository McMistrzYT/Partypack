import { ActionList, ActionMenu, FormControl, TextInput, Heading, Button, Text } from "@primer/react";
import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { Buffer } from "buffer/";
import axios from "axios";

const formControlStyle = { paddingTop: 3 };

export function TrackSubmission() {
    const formRef = useRef<HTMLFormElement>(null);
    const [waiting, setWaiting] = useState<boolean>(false);
    const [Key, setKey] = useState<string>("Select key...");
    const [Scale, setScale] = useState<string>("Select mode...");
    const [GuitarStarterType, setGuitarStarterType] = useState<string>("Select the starter type...");

    return (
        <>
            {/*<Box m={150} sx={{ float: "right" }}>
                <img src="https://upload.wikimedia.org/wikipedia/en/9/9a/Trollface_non-free.png" style={{ width: "256px", height: "auto", borderRadius: 10 }} />
                <Text></Text>
            </Box>*/}
            <Heading>Create a New Draft</Heading>
            <Text>Drafts are private versions of Tracks, only available to you. If you want to publish that track, click the "Publish" button on the management page.</Text>
            <form method="GET" action="" ref={formRef}>
                <FormControl required={true} sx={formControlStyle}>
                    <FormControl.Label>Song Name</FormControl.Label>
                    <TextInput />
                </FormControl>
                <FormControl required={true} sx={formControlStyle}>
                    <FormControl.Label>Artist</FormControl.Label>
                    <FormControl.Caption>If there are multiple artists, separate them with a comma.</FormControl.Caption>
                    <TextInput />
                </FormControl>
                <FormControl required={true} sx={formControlStyle}>
                    <FormControl.Label>Album</FormControl.Label>
                    <TextInput />
                </FormControl>
                <FormControl required={true} sx={formControlStyle}>
                    <FormControl.Label>Release Year</FormControl.Label>
                    <TextInput type="number" />
                </FormControl>
                <FormControl required={true} sx={formControlStyle}>
                    <FormControl.Label>Length (in seconds)</FormControl.Label>
                    <TextInput type="number" />
                </FormControl>
                <FormControl required={true} sx={formControlStyle}>
                    <FormControl.Label>Key</FormControl.Label>
                    <ActionMenu>
                        <ActionMenu.Button>{Key}</ActionMenu.Button>
                        <ActionMenu.Overlay width="medium">
                            {
                                ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"].map(x => {
                                    return (
                                        <ActionList.Item onSelect={() => setKey(x)}>
                                            {x}
                                        </ActionList.Item>
                                    )
                                })
                            }
                        </ActionMenu.Overlay>
                    </ActionMenu>
                </FormControl>
                <FormControl required={true} sx={formControlStyle}>
                    <FormControl.Label>Mode</FormControl.Label>
                    <ActionMenu>
                        <ActionMenu.Button>{Scale}</ActionMenu.Button>
                        <ActionMenu.Overlay width="medium">
                            <ActionList.Item onSelect={() => setScale("Minor")}>Minor</ActionList.Item>
                            <ActionList.Item onSelect={() => setScale("Major")}>Major</ActionList.Item>
                        </ActionMenu.Overlay>
                    </ActionMenu>
                </FormControl>
                <FormControl required={true} sx={formControlStyle}>
                    <FormControl.Label>Lead Type</FormControl.Label>
                    <FormControl.Caption>This is defining what lead instrument the song is going to start with. You can change the instrument mid-game with [keytar] and [guitar] text events.</FormControl.Caption>
                    <ActionMenu>
                        <ActionMenu.Button>{GuitarStarterType}</ActionMenu.Button>
                        <ActionMenu.Overlay width="medium">
                            <ActionList.Item onSelect={() => setGuitarStarterType("Guitar")}>Guitar</ActionList.Item>
                            <ActionList.Item onSelect={() => setGuitarStarterType("Keytar")}>Keytar</ActionList.Item>
                        </ActionMenu.Overlay>
                    </ActionMenu>
                </FormControl>
                <FormControl required={true} sx={formControlStyle}>
                    <FormControl.Label>Tempo</FormControl.Label>
                    <TextInput type="number" />
                </FormControl>
                <FormControl required={true} sx={formControlStyle}>
                    <FormControl.Label>MIDI File (.mid)</FormControl.Label>
                    <TextInput type="file" />
                    <FormControl.Caption>You can use the #tools-and-resources channel to find useful resources on how to create MIDIs.</FormControl.Caption>
                </FormControl>
                <FormControl required={true} sx={formControlStyle}>
                    <FormControl.Label>Audio File (.m4a, .mp3, .wav, .ogg)</FormControl.Label>
                    <TextInput type="file" />
                    <FormControl.Caption>This will play in the background of your song. Make sure it was exported from REAPER.</FormControl.Caption>
                </FormControl>
                <FormControl required={true} sx={formControlStyle}>
                    <FormControl.Label>Cover Image (.png)</FormControl.Label>
                    <TextInput type="file" />
                    <FormControl.Caption>Must be a 1:1 ratio. Max: 2048x2048, min: 512x512</FormControl.Caption>
                </FormControl>
                <FormControl required={true} sx={formControlStyle}>
                    <FormControl.Label>Lead Difficulty</FormControl.Label>
                    <TextInput type="number" />
                    <FormControl.Caption>Ranges from 0-6</FormControl.Caption>
                </FormControl>
                <FormControl required={true} sx={formControlStyle}>
                    <FormControl.Label>Drums Difficulty</FormControl.Label>
                    <TextInput type="number" />
                    <FormControl.Caption>Ranges from 0-6</FormControl.Caption>
                </FormControl>
                <FormControl required={true} sx={formControlStyle}>
                    <FormControl.Label>Vocals Difficulty</FormControl.Label>
                    <TextInput type="number" />
                    <FormControl.Caption>Ranges from 0-6</FormControl.Caption>
                </FormControl>
                <FormControl required={true} sx={formControlStyle}>
                    <FormControl.Label>Bass Difficulty</FormControl.Label>
                    <TextInput type="number" />
                    <FormControl.Caption>Ranges from 0-6</FormControl.Caption>
                </FormControl>
                <Button sx={{ marginTop: 2 }} type="submit" disabled={waiting} onClick={async e => {
                    setWaiting(true);
                    e.preventDefault();
                    console.log(formRef);

                    if (formRef.current == null)
                        return setWaiting(false);

                    const Name = (formRef.current[0] as HTMLInputElement).value;
                    const ArtistName = (formRef.current[1] as HTMLInputElement).value;
                    const Album = (formRef.current[2] as HTMLInputElement).value;
                    const Year = (formRef.current[3] as HTMLInputElement).value;
                    const Length = (formRef.current[4] as HTMLInputElement).valueAsNumber;
                    //const Key = (formRef.current[5] as HTMLInputElement).value;
                    //const Scale = (formRef.current[6] as HTMLInputElement).value;
                    //const GuitarStarterType = (formRef.current[7] as HTMLInputElement).value;
                    const Tempo = (formRef.current[8] as HTMLInputElement).valueAsNumber;
                    const Midi = (formRef.current[9] as HTMLInputElement).files![0];
                    const Music = (formRef.current[10] as HTMLInputElement).files![0];
                    const Cover = (formRef.current[11] as HTMLInputElement).files![0];
                    const GuitarDifficulty = (formRef.current[12] as HTMLInputElement).valueAsNumber;
                    const DrumsDifficulty = (formRef.current[13] as HTMLInputElement).valueAsNumber;
                    const VocalsDifficulty = (formRef.current[14] as HTMLInputElement).valueAsNumber;
                    const BassDifficulty = (formRef.current[15] as HTMLInputElement).valueAsNumber;

                    const B = {
                        Name,
                        ArtistName,
                        Album,
                        Year,
                        Length,
                        Key,
                        Scale,
                        GuitarStarterType,
                        Tempo,
                        GuitarDifficulty,
                        DrumsDifficulty,
                        VocalsDifficulty,
                        BassDifficulty
                    };

                    if (Object.values(B).includes(NaN) || Object.values(B).includes(null) || Object.values(B).includes(undefined))
                    {
                        setWaiting(false);
                        return toast("One or more required fields missing.", { type: "error" });
                    }

                    const SongData = await axios.post("/api/drafts/create", B);

                    toast(SongData.data, { type: SongData.status === 200 ? "success" : "error" });

                    if (SongData.status !== 200)
                        return setWaiting(false);

                    const MidiRes = await axios.post("/api/drafts/upload/midi", { Data: Buffer.from(await Midi.arrayBuffer()).toString("hex"), TargetSong: SongData.data.ID });
                    toast(MidiRes.status === 200 ? "Uploaded MIDI chart successfully." : MidiRes.status === 413 ? "Your MIDI chart is too big to upload!" : MidiRes.data || MidiRes.statusText, { type: MidiRes.status === 200 ? "success" : "error" });

                    const CoverRes = await axios.post("/api/drafts/upload/cover", { Data: Buffer.from(await Cover.arrayBuffer()).toString("hex"), TargetSong: SongData.data.ID });
                    toast(CoverRes.status === 200 ? "Uploaded cover image successfully." : CoverRes.status === 413 ? "Your cover image is too big to upload!" : CoverRes.data || CoverRes.statusText, { type: CoverRes.status === 200 ? "success" : "error" });
                    
                    const AudioRes = await axios.post("/api/drafts/upload/audio", { Data: Buffer.from(await Music.arrayBuffer()).toString("hex"), TargetSong: SongData.data.ID });
                    toast(AudioRes.status === 200 ? "Uploaded audio for processing successfully." : AudioRes.status === 413 ? "Your audio image is too big to upload!" : AudioRes.data || AudioRes.statusText, { type: AudioRes.status === 200 ? "success" : "error" });

                    setWaiting(false);
                    toast("Finished processing song. You can now find it in your profile tab.");
                }}>{waiting ? "Please wait..." : "Create"}</Button>
            </form>
        </>
    )
}
