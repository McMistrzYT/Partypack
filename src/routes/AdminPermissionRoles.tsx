import axios from "axios";
import { ActionList, ActionMenu, Box, Button, Dialog, FormControl, Heading, Octicon, TextInput } from "@primer/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { UserPermissions } from "../utils/Extensions";
import { AdminRole } from "../components/AdminRole";
import { InfoIcon, PlusIcon } from "@primer/octicons-react";
import { GetPermissionLevelString } from "./Profile";

const formControlStyle = { paddingTop: 3 };

export function AdminPermissionRoles() {
    const formRef = useRef<HTMLFormElement>();

    const [roles, setRoles] = useState<{ ID: string, GrantedPermissions: UserPermissions, Comment: string }[]>([]);
    const [discordRoles, setDiscordRoles] = useState<{ id: string, name: string }[]>([]);
    const [isEditing, setEditing] = useState<boolean>(false);
    const [editedRole, setEditedRole] = useState<{ ID: string, GrantedPermissions: UserPermissions, Comment: string }>();
    const [isCreating, setCreating] = useState<boolean>(false);
    const [selectedRole, setSelectedRole] = useState<{ id: string, name: string }>({ id: "0", name: "Select a role..." });
    const [perms, setPerms] = useState<UserPermissions>(UserPermissions.User);

    const [hackyReload, setHackyReload] = useState<boolean>(false);

    useEffect(() => {
		(async () => {
			const Data = await axios.get("/api/admin/roles");
            const Discord = await axios.get("/api/admin/discord/roles");

			if (Data.status !== 200 || Discord.status !== 200)
				return toast("An error has occured while getting the permission override roles!", { type: "error" });

            setRoles(Data.data);
            setDiscordRoles(Discord.data);
		})();
	}, [hackyReload]);
    
    return (
        <>
            <Dialog isOpen={isEditing || isCreating} onDismiss={() => { setCreating(false); setEditing(false); }} aria-labelledby="header">
                <Dialog.Header id="header">{isEditing ? "Update" : "Create"} role permission override</Dialog.Header>
                <Box p={3}>
                    <form method="GET" action="" ref={formRef}>
                        <FormControl>
                            <FormControl.Label>Role</FormControl.Label>
                            <ActionMenu>
                                <ActionMenu.Button>{selectedRole.name}</ActionMenu.Button>
                                <ActionMenu.Overlay>
                                    {
                                        discordRoles.map(x => {
                                            return (
                                                <ActionList.Item onSelect={() => setSelectedRole(x)}>{x.name}</ActionList.Item>
                                            )
                                        })
                                    }
                                </ActionMenu.Overlay>
                            </ActionMenu>
                            <FormControl.Caption>If you cannot find the role, please restart the server.</FormControl.Caption>
                        </FormControl>
                        <FormControl sx={formControlStyle}>
                            <FormControl.Label>Granted Permission Level</FormControl.Label>
                            <ActionMenu>
                                <ActionMenu.Button>{GetPermissionLevelString(perms)}</ActionMenu.Button>
                                <ActionMenu.Overlay>
                                    {
                                        Object.keys(UserPermissions).filter(x => isNaN(Number(x))).map(x => {
                                            return (
                                                <ActionList.Item onSelect={() => setPerms(UserPermissions[x])}>{GetPermissionLevelString(UserPermissions[x])}</ActionList.Item>
                                            )
                                        })
                                    }
                                </ActionMenu.Overlay>
                            </ActionMenu>
                            <FormControl.Caption>Be careful! Anyone who has this role will receive this permission level upon next login.</FormControl.Caption>
                        </FormControl>
                        <FormControl sx={formControlStyle}>
                            <FormControl.Label>Comment (optional)</FormControl.Label>
                            <TextInput width="100%" />
                            <FormControl.Caption>This will only be shown to admins via the <Octicon icon={InfoIcon} /> icon.</FormControl.Caption>
                        </FormControl>
                        <Button type="submit" sx={{ marginTop: 3, width: "100%" }} onClick={async e => {
                            e.preventDefault();

                            const Comment = (formRef.current[2] as HTMLInputElement).value;

                            const Response = await axios.post("/api/admin/create/role", {
                                ID: selectedRole.id,
                                PermissionLevel: perms,
                                Comment
                            });

                            setEditing(false);
                            setCreating(false);

                            setHackyReload(!hackyReload);
                            toast(Response.status === 200 ? "Updated/created role successfully." : "Something went wrong while updating/creating role override.", { type: Response.status === 200 ? "success" : "error" })
                        }}>{ isEditing ? "Update" : "Create" }</Button>
                    </form>
                </Box>
            </Dialog>
            <Heading>[ADMIN] Role Permission Overrides</Heading>
            {
                roles.map(x => {
                    return <AdminRole
                        role={x}
                        discordRole={discordRoles.find(y => y.id === x.ID)}
                        onEdit={() => { setEditedRole(x); setSelectedRole(discordRoles.find(y => y.id === x.ID) ?? { id: "0", name: "Select a role..." }); setPerms(x.GrantedPermissions); setEditing(true); }}
                        onDelete={async () => {
                            const Response = await axios.post("/api/admin/delete/role", {
                                ID: x.ID
                            });

                            toast(Response.status === 200 ? Response.data : "Something went wrong while deleting role override.", { type: Response.status === 200 ? "success" : "error" });

                            if (Response.status === 200)
                                setRoles([...roles.filter(y => y !== x)]);
                        }}
                    />
                })
            }
            <Box onClick={() => {
                setCreating(true);
                setSelectedRole({ id: "0", name: "Select a role..." });
                setPerms(UserPermissions.User);
            }} m={2} sx={{ cursor: "pointer", height: "75px", width: "100%", padding: 3, borderRadius: 10, border: "dashed", borderColor: "border.default" }}>
                <center>
                    <Octicon icon={PlusIcon} size={40} verticalAlign="middle" color="border.default" />
                </center>
            </Box>
        </>
    )
}