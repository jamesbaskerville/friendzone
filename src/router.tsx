import { createBrowserRouter } from "react-router";
import { Landing } from "./pages/Landing";
import { SignIn } from "./pages/SignIn";
import { SignUp } from "./pages/SignUp";
import { GroupLayout } from "./pages/group/GroupLayout";
import { GroupHome } from "./pages/group/GroupHome";
import { Channel } from "./pages/group/Channel";
import { Thread } from "./pages/group/Thread";
import { Bracket } from "./pages/group/Bracket";
import { HallOfFame } from "./pages/group/HallOfFame";
import { Media } from "./pages/group/Media";
import { Splits } from "./pages/group/Splits";
import { Settings } from "./pages/group/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/sign-in",
    element: <SignIn />,
  },
  {
    path: "/sign-up",
    element: <SignUp />,
  },
  {
    path: "/g/:groupId",
    element: <GroupLayout />,
    children: [
      { index: true, element: <GroupHome /> },
      { path: "channel/:channelId", element: <Channel /> },
      {
        path: "channel/:channelId/thread/:messageId",
        element: <Thread />,
      },
      { path: "bracket/:bracketId", element: <Bracket /> },
      { path: "hall-of-fame", element: <HallOfFame /> },
      { path: "media", element: <Media /> },
      { path: "splits", element: <Splits /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);
