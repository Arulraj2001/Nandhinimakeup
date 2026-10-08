import { Suspense } from "react";
import { handleRedirectOrNotFound } from "@/lib/utils/redirects";

interface CatchAllProps {
  params: Promise<{
    catchall: string[];
  }>;
}

async function CatchAllInner({ params }: CatchAllProps) {
  const { catchall } = await params;
  const path = "/" + (catchall || []).join("/");
  await handleRedirectOrNotFound(path);
  return null;
}

export default function CatchAllPublicPage({ params }: CatchAllProps) {
  return (
    <Suspense fallback={null}>
      <CatchAllInner params={params} />
    </Suspense>
  );
}
