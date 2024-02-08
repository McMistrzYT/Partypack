import { Box, Button, Text } from "@primer/react";
import { PageHeader } from "@primer/react/drafts";
import { useNavigate } from "react-router-dom";

export function AdminHome() {
    const navigate = useNavigate();

    return (
        <Box>
            <PageHeader>
                <PageHeader.TitleArea>
                    <PageHeader.Title>Partypack Admin Management Panel</PageHeader.Title>
                </PageHeader.TitleArea>
                <PageHeader.Description>
                    Welcome! Please select a management page you'd like to visit:
                    <Button onClick={() => navigate("/admin/tracks")}>Tracks</Button>
                    <Button onClick={() => navigate("/admin/featured")}>Discovery</Button>
                </PageHeader.Description>
            </PageHeader>
        </Box>
    )
}