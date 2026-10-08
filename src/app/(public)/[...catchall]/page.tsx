import { handleRedirectOrNotFound } from "@/lib/utils/redirects";

interface CatchAllProps {
  params: Promise<{
    catchall: string[];
  }>;
}

export default async function CatchAllPublicPage({ params }: CatchAllProps) {
  const { catchall } = await params;
  const path = "/" + (catchall || []).join("/");
  await handleRedirectOrNotFound(path);
}
