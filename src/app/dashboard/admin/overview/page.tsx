import React from 'react';
import {DataTable} from "@/components/data-table";
import data from "@/app/dashboard/data.json";
import {ChartAreaInteractive} from "@/components/chart-area-interactive";

export default function OverviewPage() {
    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/*<SectionCards />*/}
            <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
            </div>
            <DataTable data={data} />
        </div>
    );
}