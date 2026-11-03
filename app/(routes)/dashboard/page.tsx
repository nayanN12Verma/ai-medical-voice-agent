import React from "react";
import HistoryList from "./_components/HistoryList";
import AddNewSession from "./_components/AddNewSession";
import DoctorAgentList from "./_components/DoctorAgentList";
function DashboardPage() {
  return (
   <div>
    <div className="flex justify-between items-center"> 
    <h2 className=" font-bold text-2xl">My Dashboard </h2>
    <AddNewSession />
    </div>
    <HistoryList />
    <DoctorAgentList />
   </div>
  );
}
export default DashboardPage;