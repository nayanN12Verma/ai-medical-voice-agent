import React from "react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { SessionDetails } from "../medical-agent/[sessionId]/page";
import ViewReportDialog from "./ViewReportDialog";
  type Props = {
    history:SessionDetails[];
  }
function HistoryTable({history}: Props) {
    return(
        <div>
<Table>
  <TableCaption>Previous consultation Reports.</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead >AI Medical Specilist</TableHead>
      <TableHead >Description</TableHead>
      <TableHead>Date</TableHead>
      <TableHead className="text-right">Action</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {history.map((record: SessionDetails, index: number) => (
      <TableRow key={record.sessionId ?? index}>
        <TableCell className="font-medium">{record.selectedDoctor.specialist}</TableCell>
        <TableCell>{record.notes}</TableCell>
        <TableCell>
          {record.createdon
            ? new Date(record.createdon).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "N/A"}
        </TableCell>
        <TableCell className="text-right"><ViewReportDialog record={record} /></TableCell>
      </TableRow>
    ))}
 

  </TableBody>
</Table>
        </div>
    )
}
export default HistoryTable;