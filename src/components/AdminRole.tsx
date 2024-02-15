import { InfoIcon, PencilIcon, TrashIcon } from "@primer/octicons-react";
import { Box, Heading, IconButton, Text, Tooltip } from "@primer/react";
import { UserPermissions } from "../utils/Extensions";
import { GetLabelStyle } from "../routes/Profile";

export function AdminRole({ role, discordRole, onEdit, onDelete }: { role: { ID: string, GrantedPermissions: UserPermissions, Comment: string }, discordRole: { id: string, name: string }, onEdit: () => void, onDelete: () => void }) {
    return (
        <Box m={2} sx={{ height: "auto", width: "100%", padding: 3, borderRadius: 10, border: "solid", borderColor: "border.default" }}>
            <Box>
                <Box sx={{ display: "inline-flex", gap: 2, float: "right" }}>
                    <>
                        <IconButton icon={PencilIcon} variant="primary" aria-label="Default" onClick={onEdit} />
                        <IconButton icon={TrashIcon} variant="danger" aria-label="Default" onClick={onDelete} />
                    </>
                </Box>
                <Heading> {discordRole.name} <Tooltip aria-label={`Role ID: ${role.ID}\nComment: ${role.Comment}`}><InfoIcon verticalAlign="middle" /></Tooltip></Heading>
                <Text>Permission Level:{GetLabelStyle(role.GrantedPermissions, { alignSelf: "center", marginLeft: 2 }, "small")}</Text><br />
            </Box>
        </Box>
    )
}