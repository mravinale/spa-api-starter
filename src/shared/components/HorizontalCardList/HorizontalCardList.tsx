import type { JSX } from "react";
import { ScrollArea, ScrollBar } from "@shared/components/ui";

export interface IHorizontalCardListProps {
  cards: JSX.Element[];
}

const HorizontalCardList = ({ cards }: IHorizontalCardListProps) => {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-4 py-4 w-max">
        {cards.map((card, index) => (
          <div key={index} className="shrink-0">
            {card}
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default HorizontalCardList;
