import React from "react";
import { doctorAgent } from "./DoctorCard";
import Image from "next/image";

type prop = {
  doctorAgent: doctorAgent;
  setSelectedDoctor:any;
  selectedDoctor?: doctorAgent | null;
};

export default function SuggestDoctorCard({ doctorAgent ,setSelectedDoctor,selectedDoctor}: prop) {
  return (
    <div
    className={`w-full p-5 bg-white rounded-xl border transition-all duration-200 
                text-center flex flex-col items-center cursor-pointer
                ${selectedDoctor?.id === doctorAgent?.id ? 'border-blue-500 shadow-md scale-[1.02]' : 'border-gray-200 shadow-sm hover:border-blue-500 hover:shadow-md hover:scale-[1.02]'}`}
    onClick={() => setSelectedDoctor(doctorAgent)}
  >
    <Image
      src={doctorAgent.image}
      alt={doctorAgent.specialist}
      width={64}
      height={64}
      className="w-16 h-16 rounded-full object-cover border mb-3"
    />
    <h3 className="text-sm font-semibold text-gray-800">{doctorAgent.specialist}</h3>
    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{doctorAgent.description}</p>
  </div>
  
  );
}
  


