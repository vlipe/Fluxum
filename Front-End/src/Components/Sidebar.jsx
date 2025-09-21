import { Link as RouterLink } from "react-router-dom";
import Logo from "../assets/logo.svg";

import HomeIcon from '@mui/icons-material/Home';
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import MapIcon from "@mui/icons-material/Map";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import Link from "@mui/material/Link";
import Avatar from "@mui/material/Avatar";

import F9 from "../assets/assetsHome/CelularH.svg"

const Sidebar = () => {
  return (
    <div className="flex h-[2000px] w-full bg-indigo-50 pl-24">
      <div className="w-2/12 h-[95%] top-6 left-4 bg-white rounded-2xl flex-col fixed justify-between">
        <img src={Logo} alt="" className=" bg-blue-700" />
        <div className="flex flex-col bg-yellow-400 gap-y-4 items-center flex-grow">
          <Link
            to="/Dashboard"
            component={RouterLink}
            fontSize={18}
            underline="none"
            className="py-1 flex bg-indigo-500 w-9/12 mx-auto rounded-2xl"
          >
            <HomeIcon
              sx={{ fontSize: "2.6rem", color: "white", backgroundColor: "indigo" }}
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
              className="mx-auto text-indigo-500"
              style={{ fontSize: "3rem" }}
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
              className="mx-auto text-indigo-500"
              style={{ fontSize: "3rem" }}
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
              className="mx-auto text-indigo-500"
              style={{ fontSize: "3rem" }}
            />
          </Link>
        </div>
        <div className="bg-teal-500">
          <Link
            to="/Dashboard"
            component={RouterLink}
            fontSize={18}
            underline="none"
            className="py-2 flex"
          >
            <HomeIcon
              sx={{ fontSize: "3rem", color: "white" }}
            />
          </Link>
          <Avatar sx={{ bgcolor: 'gray/70', width: 55, height: 55, fontSize: 28 }} className="mx-auto">JP</Avatar>
        </div>
      </div>

      <div className="bg-yellow-100 w-8/12 flex flex-col">
        <img src={F9} alt="" />
        <img src={F9} alt="" />
        <img src={F9} alt="" />
        <img src={F9} alt="" />
      </div>
    </div>
  );
};

export default Sidebar;
