import type { JSX } from "react";
import { Button } from "@shared/components/ui";
import { cn } from "@shared/lib/utils";

export interface IButtonProps {
  icon: JSX.Element;
  active: boolean;
  handleClick: () => void;
}

const IconButton = ({ icon, handleClick, active }: IButtonProps) => {
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="icon"
      className={cn(
        "rounded-full h-10 w-10 transition-transform active:scale-95",
        active && "bg-primary text-primary-foreground"
      )}
      onClick={handleClick}
    >
      {icon}
    </Button>
  );
};

export default IconButton;
