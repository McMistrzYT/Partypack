import { Box, Heading, IconButton, Text } from "@primer/react";
import { TrashIcon, PencilIcon, ChevronUpIcon, ChevronDownIcon } from "@primer/octicons-react"
import { Song } from "./Song";

export function AdminCategory({ categoryName, songs, isForced, moveUp, moveDown, onEdit, onDelete, priority }: { categoryName: string, songs: any[], isForced: boolean, moveUp: () => void, moveDown: () => void, onEdit: () => void, onDelete: () => void, priority: number }) {
    return (
        <Box m={2} sx={{ overflow: "hidden", width: "100%", padding: 3, borderRadius: 10, border: "solid", borderColor: "border.default" }}>
            <Box>
                <Heading>{categoryName}</Heading>
                <Text>Priority: <b>{priority}</b></Text><br />
                {
                    isForced ?
                        <Text>You cannot edit the songs inside of this category, as it is forced.</Text> :
                        <Text>This is a custom category managed by this instance's admins.</Text>
                }
                <Box sx={{ display: "inline-flex", gap: 2, float: "right" }}>
                    { 
                        !isForced ?
                            <>
                                <IconButton icon={PencilIcon} variant="primary" aria-label="Default" onClick={onEdit} />
                                <IconButton icon={TrashIcon} variant="danger" aria-label="Default" onClick={onDelete} />
                                <IconButton icon={ChevronUpIcon} aria-label="Default" onClick={moveUp} />
                                <IconButton icon={ChevronDownIcon} aria-label="Default" onClick={moveDown} />
                            </> :
                            <></>
                    }
                </Box>
            </Box>
            <Box p={1} className="songCategory">
                {
                    songs.map(x => <Song data={x} />)
                }
            </Box>
        </Box>
    )
}