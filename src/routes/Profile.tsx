import axios from "axios";
import { Buffer } from "buffer/";
import { ActionList, ActionMenu, Avatar, Box, Button, Dialog, FormControl, Heading, Label, Text, TextInput } from "@primer/react"
import { Divider } from "@primer/react/lib-esm/ActionList/Divider";
import { PageHeader } from "@primer/react/drafts";
import { useContext, useEffect, useRef, useState } from "react";
import { SiteContext } from "../utils/State";
import { useCookies } from "react-cookie";
import { Song } from "../components/Song";
import { toast } from "react-toastify";
import { SongStatus, UserPermissions } from "../utils/Extensions";
import { LabelColorOptions } from "@primer/react/lib-esm/Label/Label";
import { BetterSystemStyleObject } from "@primer/react/lib-esm/sx";

const formControlStyle = { paddingTop: 3 };

export function GetPermissionLevelString(Role: UserPermissions) {
	switch (Role) {
		case UserPermissions.User:
			return "User";
		
		case UserPermissions.VerifiedUser:
			return "Verified Track Creator";

		case UserPermissions.TrackVerifier:
			return "Track Verifier";

		case UserPermissions.Moderator:
			return "Moderator";

		case UserPermissions.Administrator:
			return "Administrator";
	}
}

export function GetLabelStyle(Role: UserPermissions, Style: BetterSystemStyleObject, Size: "small" | "large" = "large") {
	let Variant: LabelColorOptions = "default";

	switch (Role) {
		case UserPermissions.User:
			Variant = "secondary";
			break;
		
		case UserPermissions.VerifiedUser:
			Variant = "success";
			break;

		case UserPermissions.TrackVerifier:
			Variant = "done";
			break;

		case UserPermissions.Moderator:
			Variant = "accent";
			break;

		case UserPermissions.Administrator:
			Variant = "danger";
			break;
	}

	return <Label sx={Style} size={Size} variant={Variant}>{GetPermissionLevelString(Role)}</Label>
}

export function Profile() {
	const formRef = useRef<HTMLFormElement>(null);
	const { state, setState } = useContext(SiteContext);
	const [, , removeCookie] = useCookies();
	const [isActivateDialogOpen, setIsActivateDialogOpen] = useState<boolean>(false);
	const [librarySongs, setLibrarySongs] = useState<{ ID: string, Override: string }[]>([]);
	const [bookmarkedSongs, setBookmarkedSongs] = useState<{ ID: string }[]>([]);
	const [draftsSongs, setDraftsSongs] = useState<{ ID: string, Status: SongStatus }[]>([]);
	const [availableOverrides, setAvailableOverrides] = useState<{ Name: string, Template: string }[]>([]);
	const [overriding, setOverriding] = useState<{ ID: string }>({ ID: "" });
	const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState<boolean>(false);
	const [updating, setUpdating] = useState<{ Status: SongStatus, ID: string, ReasonForDenial?: string, ReviewedBy?: { PermissionLevel: UserPermissions, Username: string, DisplayName: string } }>({ Status: SongStatus.DEFAULT, ID: "", ReasonForDenial: "", ReviewedBy: null });

	useEffect(() => {
		(async () => {
			const Data = await axios.get("/api/library/me");
			const Overrides = await axios.get("/api/library/available");

			if (Data.status !== 200 || Overrides.status !== 200)
				return toast("An error has occured while getting your library!", { type: "error" });

			const LibSongs = (await Promise.all(
				Data.data.Library.map(
					(x: { SongID: string; }) =>
						axios.get(`/api/library/song/data/${x.SongID}`))
				)).filter(x => x.status === 200).map(
					x => {
						return {
							...x.data,
							Override: Data.data.Library.find((y: { SongID: string; }) => y.SongID === x.data.ID).Overriding }
						});
			
			setLibrarySongs(LibSongs);
			setBookmarkedSongs(Data.data.Bookmarks);
			setDraftsSongs(Data.data.Created);
			setAvailableOverrides(Overrides.data);
		})();
	}, []);

	return (
		<>
			{
				state.UserDetails ?
					<Box>
						<PageHeader>
							<PageHeader.TitleArea variant="large">
								<PageHeader.LeadingVisual>
									<Avatar src={state.UserDetails.Avatar} size={32} alt={`${state.UserDetails.GlobalName} (@${state.UserDetails.Username})`} />
								</PageHeader.LeadingVisual>
								<PageHeader.Title>
									{state.UserDetails.GlobalName} (@{state.UserDetails.Username})
									{ GetLabelStyle(state.UserDetails?.Role, { alignSelf: "center", marginLeft: 2 }) }
								</PageHeader.Title>
								<PageHeader.Actions>
									<Button size="large" variant="danger" onClick={() => { removeCookie("UserDetails"); removeCookie("Token"); setState({ ...state, UserDetails: null }); window.location.assign("/") }}>Log out</Button>
								</PageHeader.Actions>
							</PageHeader.TitleArea>
						</PageHeader>

						<Divider />

						<Dialog isOpen={isUpdateDialogOpen} onDismiss={() => setIsUpdateDialogOpen(false)} aria-labelledby="header">
							<Dialog.Header id="header">Update song</Dialog.Header>
							<Box p={3}>
								{
									updating.Status === SongStatus.DENIED ?
									<Text>
										<p>Your song has been denied from being published by staff. In order to re-apply for publishing, please update your song. Keep in mind that rolling back to previous versions is not possible.</p>
										<p style={{marginTop: 10}}><b>Reason for Denial: </b><Text>{updating.ReasonForDenial}</Text></p>
										{
											updating.ReviewedBy ? <p style={{marginTop: 10}}><b>Reviewed by: </b><Text>{updating.ReviewedBy.DisplayName} (@{updating.ReviewedBy.Username})</Text>{ GetLabelStyle(updating.ReviewedBy.PermissionLevel, { alignSelf: "center", marginLeft: 2 }, "small") }</p> : <></>
										}
									</Text>
									: <Text>Updating your song while it is published will unlist it and queue it for review. Keep in mind that rolling back to previous versions is not possible.</Text>
								}
								<form method="GET" action="" ref={formRef}>
									<FormControl sx={formControlStyle}>
										<FormControl.Label>MIDI File (.mid)</FormControl.Label>
										<TextInput sx={{ width: "100%" }} type="file" />
										<FormControl.Caption>You can use the #tools-and-resources channel to find useful resources on how to create MIDIs.</FormControl.Caption>
									</FormControl>
									<FormControl sx={formControlStyle}>
										<FormControl.Label>Audio File (.m4a, .mp3, .ogg, .wav)</FormControl.Label>
										<TextInput sx={{ width: "100%" }} type="file" />
										<FormControl.Caption>This will play in the background of your song. Make sure it was exported from REAPER.</FormControl.Caption>
									</FormControl>
									<FormControl sx={formControlStyle}>
										<FormControl.Label>Cover Image (.png)</FormControl.Label>
										<TextInput sx={{ width: "100%" }} type="file" />
										<FormControl.Caption>Must be a 1:1 ratio. Max: 2048x2048, min: 512x512</FormControl.Caption>
									</FormControl>
									<Button type="submit" sx={{ marginTop: 3, width: "100%" }} onClick={async e => {
										e.preventDefault();

										const Midi = (formRef.current[0] as HTMLInputElement).files![0];
										const Music = (formRef.current[1] as HTMLInputElement).files![0];
										const Cover = (formRef.current[2] as HTMLInputElement).files![0];

										if (Midi) {
											const MidiRes = await axios.post("/api/drafts/upload/midi", { Data: Buffer.from(await Midi.arrayBuffer()).toString("hex"), TargetSong: updating.ID });
											toast(MidiRes.status === 200 ? "Uploaded MIDI chart successfully." : MidiRes.data, { type: MidiRes.status === 200 ? "success" : "error" });
										}

										if (Cover) {
											const CoverRes = await axios.post("/api/drafts/upload/cover", { Data: Buffer.from(await Cover.arrayBuffer()).toString("hex"), TargetSong: updating.ID });
											toast(CoverRes.status === 200 ? "Uploaded cover image successfully." : CoverRes.data, { type: CoverRes.status === 200 ? "success" : "error" });
										}

										if (Music) {
											const AudioRes = await axios.post("/api/drafts/upload/audio", { Data: Buffer.from(await Music.arrayBuffer()).toString("hex"), TargetSong: updating.ID });
											toast(AudioRes.status === 200 ? "Uploaded audio for processing successfully." : AudioRes.data, { type: AudioRes.status === 200 ? "success" : "error" });			
										}
									}}>{ updating.Status === SongStatus.PUBLIC ? "Unlist and Update" : "Update" }</Button>
								</form>
							</Box>
						</Dialog>

						<Dialog isOpen={isActivateDialogOpen} onDismiss={() => setIsActivateDialogOpen(false)} aria-labelledby="header">
							<Dialog.Header id="header">Activate song</Dialog.Header>
							<Box p={3}>
								<Text>In order to activate a song for use, you need to sacrifice another song.<br />Please select a song you own to replace:</Text>
								<ActionMenu>
									<ActionMenu.Button>Select a song...</ActionMenu.Button>
									<ActionMenu.Overlay width="medium">
										<ActionList>
											{
												availableOverrides.map(x => {
													return <ActionList.Item onSelect={async () => {
														setIsActivateDialogOpen(false);
														const Res = await axios.post("/api/library/me/activate", { SongID: overriding!.ID!, ToOverride: x.Template });
														if (Res.status === 200)
															setLibrarySongs([
																...librarySongs,
																{ ...overriding!, Override: x.Template }
															])
														else
															toast(Res.data, { type: "error" })
													}}>
															{x.Name}
														</ActionList.Item>;
												})
											}
										</ActionList>
									</ActionMenu.Overlay>
								</ActionMenu>
							</Box>
						</Dialog>

						<Heading sx={{ marginBottom: 2 }}>Active Songs</Heading>
						<Box className="songCategory">
							{
								librarySongs.length >= 1 ?
									librarySongs.map(x => {
										return <Song data={x}>
											<center>Overriding: <Text sx={{ display: "block", fontWeight: "700", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{availableOverrides.find(y => y.Template.toLowerCase() === x.Override.toLowerCase())?.Name}</Text></center>
											<Button sx={{ width: "100%", marginTop: 2 }} variant="danger" onClick={async () => {
												const Res = await axios.post("/api/library/me/deactivate", { SongID: x.ID });
												if (Res.status === 200) {
													librarySongs.splice(librarySongs.findIndex(y => y.ID === x.ID), 1);
													setLibrarySongs([...librarySongs]);
												}
												else
													toast(Res.data, { type: "error" })
											}}>Remove from Active</Button>
										</Song>;
									})
									: <Text>You have no activated songs.</Text>
							}
						</Box>

						<Heading sx={{ marginTop: 2, marginBottom: 2 }}>My Subscriptions</Heading>
						<Box className="songCategory">
							{
								bookmarkedSongs.length >= 1 ?
									bookmarkedSongs.map(x => {
										return <Song data={x}>
											<Button sx={{ width: "100%", marginBottom: 1 }} variant="primary" onClick={() => { setIsActivateDialogOpen(true); setOverriding(x) }} disabled={librarySongs.findIndex(y => y.ID === x.ID) !== -1}>Add to Active</Button>
											<Button sx={{ width: "100%" }} variant="danger" onClick={async () => {
												const Res = await axios.post("/api/library/me/unbookmark", { SongID: x.ID });
												if (Res.status === 200) {
													bookmarkedSongs.splice(bookmarkedSongs.findIndex(y => y.ID === x.ID), 1);
													setBookmarkedSongs([...bookmarkedSongs]);
												}
												else
													toast(Res.data, { type: "error" })
											}}>Unsubscribe</Button>
										</Song>;
									})
									: <Text>You didn't subscribe to any songs.</Text>
							}
						</Box>

						<Heading sx={{ marginTop: 2, marginBottom: 2 }}>My Drafts & Published Songs</Heading>
						<Box className="songCategory">
							{
								draftsSongs.length >= 1 ?
								draftsSongs.map((x, i) => {
										return <Song data={x}>
											<Button sx={{ width: "100%", marginBottom: 1 }} variant="primary" onClick={() => { setIsActivateDialogOpen(true); setOverriding(x) }} disabled={x.Status === SongStatus.BROKEN || x.Status === SongStatus.DENIED || x.Status === SongStatus.PROCESSING || librarySongs.findIndex(y => y.ID === x.ID) !== -1}>Add to Active</Button>
											<Button sx={{ width: "100%", marginBottom: 1 }} variant="primary" onClick={() => { setIsUpdateDialogOpen(true); setUpdating(x) }} disabled={x.Status !== SongStatus.BROKEN && x.Status !== SongStatus.DEFAULT && x.Status !== SongStatus.DENIED && x.Status !== SongStatus.PUBLIC}>Update</Button>
											<Button disabled={x.Status !== SongStatus.DEFAULT && x.Status !== SongStatus.ACCEPTED} sx={{ width: "100%", marginBottom: 1 }} onClick={async () => {
												const Res = await axios.post("/api/drafts/submit", { TargetSong: x.ID });
												if (Res.status === 200) {
													x.Status = x.Status === SongStatus.AWAITING_REVIEW ? SongStatus.PUBLIC : SongStatus.AWAITING_REVIEW;
													draftsSongs[i] = x;
													setDraftsSongs([...draftsSongs]);
												}
												
												toast(Res.data, { type: Res.status === 200 ? "success" : "error" });
											}}>{x.Status === SongStatus.DEFAULT ? "Submit for Review" : "Publish"}</Button>
											<Button disabled={!state.UserDetails.IsAdmin && x.Status !== SongStatus.DEFAULT && x.Status !== SongStatus.DENIED && x.Status !== SongStatus.BROKEN} sx={{ width: "100%" }} variant="danger" onClick={async () => {
												const Res = await axios.post("/api/drafts/delete", { TargetSong: x.ID });
												if (Res.status === 200) {
													draftsSongs.splice(draftsSongs.findIndex(y => y.ID === x.ID), 1);
													setDraftsSongs([...draftsSongs]);
												}
												
												toast(Res.data, { type: Res.status === 200 ? "success" : "error" });
											}}>Delete draft</Button>
										</Song>;
									})
									: <Text>You have no drafts.</Text>
							}
						</Box>
					</Box> :
					<>
						<Text>You are not logged in.<br />Log in using the button in the top right.</Text>
					</>
			}
		</>
	)
}
