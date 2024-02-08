import { Box, Heading, Text } from "@primer/react";
import { SignInIcon } from "@primer/octicons-react";

export function Home() {
    return (
        <>
            <Box>
                <Heading>Welcome to Partypack</Heading>
                <Text>
                    Welcome to Partypack, the ultimate game-changing experience for Fortnite Festival! Partypack brings custom songs into the game, letting players turn it into a community driven experience! 
                    <br />
                    Here, you can view tracks by other people or submit your own, read tutorials and look at the FAQ for important topics. Be sure to also read the quickstart guide to know how to get started!
                    <br />
                    Partypack was created by <a href="/credits">everyone listed here</a>. If you're interested in hosting your own instance of Partypack, be sure to check the <a href="https://github.com/McMistrzYT/Partypack">GitHub repo</a>.</Text>
                <Heading>Quickstart Guide</Heading>
                <Text>
                    <b>Consider watching the easier to understand, visual guide available in the Discord server.</b><br />
                    1. Join this instance's <a href="https://discord.gg/Rhd9Hq4D62">Discord server</a><br />
                    2. Click on the <SignInIcon size={16} /> icon in the top right<br />
                    3. Log in using your Discord account<br />
                    4. Go to <b>Tracks</b> and subscribe to tracks you like<br />
                    5. Click on your profile picture in the top right to access your <b>Profile</b> page<br />
                    6. <b>Activate</b> songs by replacing original Fortnite songs<br />
                    7. <b>Download</b> the Partypacker Launcher from the <b>Download</b> tab<br />
                    8. Run the Partypacker application, log in using your Discord account and press Launch<br />
                    9. If any warnings pop up, press YES on all of them for the proxy to work correctly<br />
                    10. Enter a Festival Main Stage match and try out your custom songs!
                </Text>
            </Box>
        </>
    )
}