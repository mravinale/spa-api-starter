import { SectionCards } from "@/shared/components/ui/section-cards";
import { ChartAreaInteractive } from "@/shared/components/ui/chart-area-interactive";
import { DataTable } from "@/shared/components/ui/data-table";
import data from "@/app/dashboard/data.json";

export default function DashboardPage() {
    return (
        <div className="flex flex-1 flex-col @container/main">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <SectionCards />
                <div className="px-4 lg:px-6">
                    <ChartAreaInteractive />
                </div>
                <DataTable data={data} />
            </div>
        </div>
    );
}
