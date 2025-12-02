import { Suspense } from "react";
import { SourceLoader } from "@shared/components";
import { HighlightedProducts } from "../../Products";
import { Card, CardContent } from "@shared/components/ui";

export default function Home() {
  return (
    <main className="flex flex-col justify-center items-center gap-6">
      <div className="w-full min-h-[300px] flex items-center justify-center">
        <Suspense fallback={<SourceLoader />}>
          <HighlightedProducts />
        </Suspense>
      </div>

      <Card className="w-[90%]">
        <CardContent className="flex flex-col justify-center items-center min-h-[200px] pt-6">
          <span className="text-muted-foreground">Offers</span>
        </CardContent>
      </Card>
      <Card className="w-[90%]">
        <CardContent className="flex flex-col justify-center items-center min-h-[200px] pt-6">
          <span className="text-muted-foreground">Brands</span>
        </CardContent>
      </Card>
    </main>
  );
}
