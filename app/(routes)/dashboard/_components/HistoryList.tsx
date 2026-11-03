"use client";
import React from "react";
import { useState } from "react";
import Image from "next/image";
import { SessionDetails }from "../medical-agent/[sessionId]/page";
   
import AddNewSession from "./AddNewSession";
import HistoryTable from "./HistoryTable";

function HistoryList() {    
    const [history, setHistory] = useState<SessionDetails[]>([]);

    React.useEffect(() => {
      GetHistoryList();
    }, []);
    const GetHistoryList = async () => {
      const res = await fetch("/api/session-chat?sessionId=all");
      const data = await res.json();  
      console.log("result", data);
      setHistory(data);
    };
    
  return (
    <div className="mt-10">
{history.length == 0 ? 
<div className="flex items-center flex-col justify-center p-7 border border-dashed rounded-2xl border-2">
<Image src="/medical-assistance.png" alt="assistance" width={150} height={150} />
<h2 className="font-bold text-xl mt-2">No recnet history consultations.</h2>
<p>It looks like you haven't consulted with doctors yet.</p>
<AddNewSession />
</div>:
<div>
    <HistoryTable history={history}/>
</div>
}

    </div>
  );
}
export default HistoryList;