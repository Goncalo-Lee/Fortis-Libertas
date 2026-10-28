import React from 'react';
import {DataTable} from "@/components/data-table";
import data from "@/app/dashboard/data.json";

export default function page() {
  return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/*<SectionCards />*/}
          <DataTable data={data} />
      </div>
  );
}