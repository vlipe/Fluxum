import { Link as RouterLink } from "react-router-dom";
import Logo from "../assets/logo.svg";

import HomeOutline from "@mui/icons-material/HomeOutlined";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import MapIcon from "@mui/icons-material/Map";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import Link from "@mui/material/Link";
import Avatar from "@mui/material/Avatar";

import Icon from "@mdi/react";
import { mdiCubeOutline } from "@mdi/js";

import { mdiChartDonut } from "@mdi/js";

import { mdiBellOutline } from "@mdi/js";

import { mdiMapMarkerRadiusOutline } from '@mdi/js';

import { mdiExitToApp } from '@mdi/js';



import F9 from "../assets/assetsHome/CelularH.svg";

const Sidebar2 = () => {
  return (
    <div className="bg-white w-2/12 rounded-2xl flex flex-col justify-between my-6 mb-12 ml-4
    sm:mb-22 sm:w-24 ">
      <div className="w-full  h-3/6 mt-2 text-white flex flex-col gap-y-4 items-center">
        <img src={Logo} alt="" className=" mb-4" />

        <Link
          to="/Dashboard"
          component={RouterLink}
          fontSize={18}
          underline="none"
          className="py-1 flex bg-indigo-500 w-9/12 mx-auto rounded-2xl
          sm:max-w-14"
        >
          <Icon
            path={mdiCubeOutline}
            size={1.8}
            className="text-white mx-auto bg-indigo-500 rounded-lg"
          />
        </Link>
        <Link
          to="/Relatorios"
          component={RouterLink}
          fontSize={18}
          underline="none"
          className="py-2 flex"
        >
          <Icon
            className=" mx-auto text-indigo-500"
            path={mdiChartDonut}
            strokeWidth={0.5}
            size={1.8}
          />
        </Link>
        <Link
          to="/Mapa"
          component={RouterLink}
          fontSize={18}
          underline="none"
          className="py-2 flex"
        >
          <Icon
            path={mdiMapMarkerRadiusOutline}
            size={1.8}
            className=" mx-auto  text-indigo-500"
          />
        </Link>
        <Link
          to="/Alertas"
          comprfonent={RouterLink}
          fontSize={18}
          underline="none"
          className="py-2 flex"
        >
          <Icon
            path={mdiBellOutline}
            size={1.8}
            className=" mx-auto  text-indigo-500"
          />
        </Link>
      </div>

      <div className="h-1/6 w-full flex-col mb-6">
        {" "}
        <Link
          to="/Home"
          component={RouterLink}
          fontSize={18}
          underline="none"
          className="py-5 flex"
        >
          <Icon
            path={mdiExitToApp}
            size={1.8}
            className=" mx-auto  text-indigo-500 rotate-180"
          />
        </Link>
        <Avatar
          sx={{ bgcolor: "gray/50", width: 55, height: 55, fontSize: 28 }}
          className="mx-auto"
        >
          JP
        </Avatar>
      </div>
    </div>
  );
};

export default Sidebar2;
