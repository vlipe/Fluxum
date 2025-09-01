import { Link as RouterLink } from "react-router-dom";
import Logo from "../assets/logo.svg";

import HomeOutline from "@mui/icons-material/HomeOutlined";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import MapIcon from "@mui/icons-material/Map";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import Link from "@mui/material/Link";
import Avatar from "@mui/material/Avatar";


const Sidebar = () => {
  return (
    <div className="flex h-full w-full bg-indigo-50">
      <div className="w-2/12 h-[95%] my-auto ml-4 bg-white rounded-2xl flex-col ">
        <img src={Logo} alt="" className=" bg-blue-700" />
        <div className="flex flex-col h-1/2 bg-yellow-400 gap-y-2 items-center">
          <Link
            to="/Dashboard"
            component={RouterLink}
            fontSize={18}
            underline="none"
            className="py-1 flex bg-indigo-500 w-9/12 mx-auto rounded-2xl"
          >
            <DashboardRoundedIcon
              className="text-white mx-auto bg-inadigo-500 rounded-lg"
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
        <div className="bg-teal-500 h-1/4">
          <Link
            to="/Dashboard"
            component={RouterLink}
            fontSize={18}
            underline="none"
            className="py-2 flex"
          >
            <HomeOutline
              className=" mx-auto  text-indigo-500"
              style={{ fontSize: "3rem", fontWeight: "3rem" }}
            />
          </Link>
          <Avatar sx={{ bgcolor: 'gray/70', width: 55, height: 55, fontSize: 28 }} className="mx-auto">JP</Avatar>

        </div>
      </div>

      <div className="bg-yellow-100 w-8/12"></div>
    </div>
    
  );
};

export default Sidebar;
