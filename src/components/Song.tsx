import { Box, Label, Text, Link } from "@primer/react";
import { Divider } from "@primer/react/lib-esm/ActionList/Divider";
import { SongStatus } from "../utils/Extensions";
import { LabelColorOptions } from "@primer/react/lib-esm/Label/Label";
import { LinkIcon } from "@primer/octicons-react"
import DefaultCover from "../assets/NoCoverDetected.png";
import { toast } from "react-toastify";

export function Song({ data, children }: { data: any, children?: JSX.Element[] | JSX.Element | string }) {
    function GetStatusLabel() {
        let Variant: LabelColorOptions = "default";
        let LabelStr = "";
        let Title = "";
        switch (data.Status) {
            case SongStatus.AWAITING_REVIEW:
                Variant = "accent";
                LabelStr = "Awaiting review";
                break;
            case SongStatus.BROKEN:
                Variant = "severe";
                LabelStr = "Missing assets";
                break;
            case SongStatus.DEFAULT:
                // no label unless draft
                Variant = "danger";
                if (data.IsPublicDraft)
                    LabelStr = "Draft - public"
                else if (data.IsDraft)
                    LabelStr = "Draft - not published"
                break;
            case SongStatus.PUBLIC:
                Variant = "success";
                LabelStr = "Published";
                break;
            case SongStatus.PROCESSING:
                Variant = "done";
                LabelStr = "Assets processing";
                break;
            case SongStatus.ACCEPTED:
                Variant = "sponsors";
                LabelStr = "Ready for publishing";
                break;
            case SongStatus.DENIED:
                Variant = "danger";
                LabelStr = "ACTION NEEDED - Denied";
                Title = data.ReasonForDenial
                break;
            //default:
                //LabelStr = `Unimplemented: ${data.Status}`;
                //break;
        }

        return (
            LabelStr !== "" ? <Label variant={Variant} title={Title}>{LabelStr}</Label> : <></>
        )
    }

    return (
        <Box sx={{ overflow: "hidden", minWidth: 50, maxWidth: 200, padding: 2, borderRadius: 10, border: "solid", borderColor: "border.default" }}>
            <img onError={e => (e.target as HTMLImageElement).src = DefaultCover} src={data.Cover} style={{ width: "100%", borderRadius: 10 }} />
            <center>
                <Text sx={{ display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{data.ArtistName}</Text>
                <Text sx={{ display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}><b>{data.Name}</b></Text>
                {
                    GetStatusLabel()
                }
                {
                    data.Status == SongStatus.PUBLIC || data.IsPublicDraft ? <Link sx={{ cursor: "pointer", marginLeft: 1 }} onClick={() => {
                        navigator.clipboard.writeText(window.location.origin + "/song/" + data.ID);
                        toast("Copied song link to clipboard",{type:"success"})
                    }}><LinkIcon /></Link> : <></>
                }
                {
                    children ? <Divider /> : <></>
                }
            </center>
            {children ?? <></>}
        </Box>
    )
}