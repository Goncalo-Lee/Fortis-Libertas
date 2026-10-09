import Image from "next/image";
import ChartPie from "@/components/ChartPie";
import ChartPieLabel from "@/components/ChartPieLabel";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="flex flex-col items-center justify-center gap-4">
          <h1>A nossa welcome page!</h1>
      </div>
    </div>
  );
}
