import { useLocation } from "react-router-dom";
import { NAVIGATION_TABS } from "../utils/constants";
import { Link } from "react-router-dom";
import { cn } from "@shared/lib/utils";

const NavigationTabs = () => {
  const location = useLocation();

  return (
    <div className="w-full border-y border-border">
      <div className="flex">
        {NAVIGATION_TABS.map((tab) => (
          <Link
            key={tab.id}
            to={tab.path}
            className={cn(
              "flex flex-col p-4 bg-background cursor-pointer w-full justify-evenly items-center uppercase text-sm font-medium transition-colors",
              location.pathname === tab.path
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default NavigationTabs;
