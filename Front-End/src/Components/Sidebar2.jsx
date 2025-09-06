import { Link as RouterLink } from "react-router-dom";
import Logo from "../assets/logo.svg";

import HomeOutline from "@mui/icons-material/HomeOutlined";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import MapIcon from "@mui/icons-material/Map";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import Link from "@mui/material/Link";
import Avatar from "@mui/material/Avatar";

import F9 from "../assets/assetsHome/CelularH.svg";

const Sidebar2 = () => {
  return (
    <div className="bg-white w-2/12 h-[95%] top-5 left-4 rounded-2xl fixed flex flex-col justify-between">
      <div className="w-full  h-3/6 mt-2 text-white flex flex-col gap-y-4 items-center">
        <img src={Logo} alt="" className=" mb-4" />

        <Link
          to="/Dashboard"
          component={RouterLink}
          fontSize={18}
          underline="none"
          className="py-2 flex bg-indigo-500 w-9/12 mx-auto rounded-2xl"
        >
          <DashboardRoundedIcon
            className="text-white mx-auto bg-indigo-500 rounded-lg"
            style={{ fontSize: "2.6rem" }}
          />
        </Link>
        <Link
          to="/Relatorios"
          component={RouterLink}
          fontSize={18}
          underline="none"
          className="py-2 flex"
        >
          <AssessmentOutlinedIcon
            className=" mx-auto text-indigo-500"
            style={{ fontSize: "3rem", fontWeight: "3rem" }}
          />
        </Link>
        <Link
          to="/Mapa"
          component={RouterLink}
          fontSize={18}
          underline="none"
          className="py-2 flex"
        >
          <MapIcon
            className=" mx-auto  text-indigo-500"
            style={{ fontSize: "3rem", fontWeight: "3rem" }}
          />
        </Link>
        <Link
          to="/Alertas"
          component={RouterLink}
          fontSize={18}
          underline="none"
          className="py-2 flex"
        >
          <NotificationsActiveRoundedIcon
            className=" mx-auto  text-indigo-500"
            style={{ fontSize: "3rem", fontWeight: "3rem" }}
          />
        </Link>
      </div>

      <div className="h-1/6 w-full flex-col mb-10">
        {" "}
        <Link
          to="/Dashboard"
          component={RouterLink}
          fontSize={18}
          underline="none"
          className="py-5 flex"
        >
          <HomeOutline
            className=" mx-auto  text-indigo-500"
            style={{ fontSize: "3rem", fontWeight: "3rem" }}
          />
        </Link>
        <Avatar
          sx={{ bgcolor: "gray/70", width: 55, height: 55, fontSize: 28 }}
          className="mx-auto"
        >
          JP
        </Avatar>
      </div>
    </div>
  );
};

export default Sidebar2;
