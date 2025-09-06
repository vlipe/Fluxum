import Sidebar from "../Components/Sidebar";
import Sidebar2 from "../Components/Sidebar2";
import SearchIcon from "@mui/icons-material/Search";

const Dashboard = () => {
  return (
    <div className="flex min-w-full min-h-svh bg-indigo-50">
      <Sidebar2 />
      <div className="ml-24 bga-red-400 w-9/12">

        <div className="w-full bag-yellow-200 mt-10 flex justify-center items-center">

          <div className="text-lg">Oi, Felipe!</div>

          <div className="w-7/12 h-10 rounded-3xl bg-white ml-4">
            <SearchIcon
              className="text-gray-400/80 mx-auto rounded-lg bg-read-500 my-auto"
              style={{ fontSize: "2rem", marginLeft: "10", marginTop: "4"}}
            />
          </div>

        </div>


        <div className="w-[96%] bg-white h-5/6 mt-8 rounded-xl flex flex-col pl-4">
        <div className="mt-4 text-xl font-semibold text-indigo-900">Dashboard</div>
        <div className="flex w-full justify-between bg-ared-300 mt-4">
            <div className="w-2/4 bg-indigo-100 rounded-2xl h-32"></div>
        </div>
        </div>


      </div>
    </div>
  );
};
export default Dashboard;
