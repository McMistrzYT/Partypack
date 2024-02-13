import { Box, Button, Dialog, FormControl, Heading, TextInput } from "@primer/react";
import { AdminCategory } from "../components/AdminCategory";
import { useEffect, useRef, useState } from "react";
import { moveElement } from "../utils/Extensions";
import { toast } from "react-toastify";
import axios from "axios";

export interface LibraryObject {
    ID: string,
    Header: string,
    Songs: { ID: string }[],
    Custom: boolean,
    Priority: number,
    ShouldDelete: boolean
}

const formControlStyle = { paddingBottom: 3 };

export function AdminFeaturedTab() {
    const formRef = useRef<HTMLFormElement>(null);
    const [library, setLibrary] = useState<LibraryObject[] | null>(null);
    const [hackyRevertChanges, setHackyRevertChanges] = useState<boolean>(false); // trust this
    const [addSongsOpen, setAddSongsOpen] = useState<boolean>(false);
    const [editedCategory, setEditedCategory] = useState<{ Obj: LibraryObject, Index: number }>(null)

    useEffect(() => {
        (async () => {
            const Featured = await axios.get("/api/discovery");
            if (Featured.status !== 200)
                return toast("Something went wrong while loading discovery. Try again later.", { type: "error" });

            setLibrary(Featured.data.map(x => {
                return {
                    ...x,
                    ShouldDelete: false
                };
            }));
        })();
    }, [hackyRevertChanges]);

    return (
        <>
            <Dialog isOpen={addSongsOpen} onDismiss={() => setAddSongsOpen(false)}>
                <Dialog.Header>Modify Category</Dialog.Header>
                <Box p={3}>
                    <form method="GET" action="" ref={formRef}>
                        <FormControl required={true} sx={formControlStyle}>
                            <FormControl.Label>Category Name</FormControl.Label>
                            <TextInput placeholder={editedCategory?.Obj.Header} />
                        </FormControl>
                        <FormControl required={true} sx={formControlStyle}>
                            <FormControl.Label>Custom Priority</FormControl.Label>
                            <TextInput placeholder={editedCategory?.Obj.Priority.toString()} type="number" />
                            <FormControl.Caption>The lower, the higher the category goes.</FormControl.Caption>
                        </FormControl>
                    </form>
                    <Box sx={{ float: "right", display: "inline-flex", gap: 2, marginBottom: 3 }}>
                        <Button variant="primary" type="submit" onClick={async e => {
                            e.preventDefault();
                            setAddSongsOpen(false);

                            const Name = (formRef.current[0] as HTMLInputElement).value;
                            const Priority = (formRef.current[1] as HTMLInputElement).valueAsNumber;

                            library[editedCategory.Index] = {
                                ...editedCategory.Obj,
                                Header: Name.trim() === "" ? editedCategory.Obj.Header : Name,
                                Priority: isNaN(Priority) ? editedCategory.Obj.Priority : Priority
                            };
                            setLibrary(library.sort((a, b) => a.Priority - b.Priority));
                        }}>Confirm changes</Button>
                        <Button onClick={() => setAddSongsOpen(false)}>Cancel</Button>
                    </Box>
                </Box>
            </Dialog>
            <Heading>Featured Tabs</Heading>
            {
                library?.filter(x => !x.ShouldDelete).map((x, i) => {
                    return (
                        <AdminCategory
                            priority={x.Priority}
                            isForced={!x.Custom}
                            categoryName={x.Header}
                            songs={x.Songs}
                            moveDown={() => {
                                if (i + 1 >= library.length)
                                    return toast("You cannot move this category further down.", { type: "error" });

                                const Sorted = library.sort((a, b) => a.Priority - b.Priority);
                                
                                const Idx = Sorted.findIndex(y => y.ID === x.ID);
                                
                                console.log(Sorted);
                                moveElement(Idx, Idx + 1, Sorted);
                                console.log(Sorted);
                                
                                setLibrary(Sorted.map((y, idx, a) => { return {
                                    ...y,
                                    Priority:
                                        y.Custom ?
                                            (idx === 0 ? 0 : a[idx - 1].Priority + 1) :
                                            y.Priority
                                }; }));
                            }}
                            moveUp={() => {
                                if (i - 1 < 0)
                                    return toast("You cannot move this category further up.", { type: "error" });

                                const Sorted = library.sort((a, b) => a.Priority - b.Priority);
                                
                                const Idx = Sorted.findIndex(y => y.ID === x.ID);
                                
                                console.log(Sorted);
                                moveElement(Idx, Idx - 1, Sorted);
                                console.log(Sorted);
                                
                                setLibrary(Sorted.map((y, idx, a) => { return {
                                    ...y,
                                    Priority:
                                        y.Custom ?
                                            (idx === 0 ? 0 : a[idx - 1].Priority + 1) :
                                            y.Priority
                                }; }).sort((a, b) => a.Priority - b.Priority));
                            }}
                            onDelete={() => {
                                library[library.findIndex(y => y.ID === x.ID)].ShouldDelete = true;
                                setLibrary([...library])
                            }}
                            onEdit={() => {
                                setEditedCategory({ Obj: x, Index: i });
                                setAddSongsOpen(true);
                            }} />
                    )
                })
            }
            <Box sx={{ float: "right", display: "inline-flex", gap: 2 }}>
                <Button variant="primary" onClick={async () => {
                    console.log(library);
                    const SaveResponse = await axios.post("/api/admin/update/discovery", [
                        ...library!.filter(x => x.Custom).map(
                            x => {
                                return {
                                    ...x,
                                    Custom: undefined,
                                    Activated: undefined,
                                    Songs: x.Songs.map(y => y.ID)
                                };
                            }
                        )
                    ]);

                    if (SaveResponse.status === 200)
                        return toast("Saved changes successfully.", { type: "success" });

                    toast("An unknown error has occured. Please check the console.", { type: "error" });
                }}>Save</Button>
                <Button onClick={() => setHackyRevertChanges(!hackyRevertChanges)}>Revert changes</Button>
            </Box>
        </>
    )
}