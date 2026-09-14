import { Construction } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div>
      <PageHeader title={title} subtitle={description} />
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Construction className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground">Coming in the next phase</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          This feature is planned and will be built in an upcoming implementation phase.
        </p>
      </div>
    </div>
  );
}
