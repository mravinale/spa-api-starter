import Header from "./Header";
import NavigationTabs from "./NavigationTabs";
import { Outlet } from "react-router-dom";

const RootLayout = () => {
  return (
    <div className="h-dvh overflow-y-auto relative m-0 p-0">
      <div className="mx-auto sticky top-0 left-0 right-0 z-50 flex flex-col border-x border-border bg-background md:w-1/2 md:max-w-3xl">
        <Header />
        <NavigationTabs />
      </div>
      <div className="mx-auto flex flex-col md:w-1/2 md:max-w-3xl md:border-x md:border-border">
        <div className="p-4 h-[calc(100dvh-(var(--header-height)+var(--navigation-height)))] overflow-y-auto pb-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default RootLayout;
