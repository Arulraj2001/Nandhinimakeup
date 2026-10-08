import type { Metadata } from "next";
import { connection } from "next/server";
import {
  getAdminBlogPosts,
  getAdminBlogCategories,
} from "@/lib/actions/blog-admin";
import { getPublicSiteSettings } from "@/lib/data/settings";
import { PageHeader } from "@/components/admin/page-header";
import { BlogClient } from "./blog-client";

export const metadata: Metadata = {
  title: "Blog | Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminBlogPage() {
  await connection();
  const [postsRes, categoriesRes, settings] = await Promise.all([
    getAdminBlogPosts({ page: 1, pageSize: 20 }),
    getAdminBlogCategories(),
    getPublicSiteSettings(),
  ]);

  const posts = postsRes.success ? postsRes.data.items : [];
  const totalPosts = postsRes.success ? postsRes.data.total : 0;
  const categories = categoriesRes.success ? categoriesRes.data : [];
  const defaultAuthor =
    settings.business.business_name || "Nandhini Makeup & Jewellery";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog"
        description="Write and publish educational articles, tips, and updates for your clients."
      />
      <BlogClient
        initialPosts={posts}
        initialTotalPosts={totalPosts}
        initialCategories={categories}
        defaultAuthorName={defaultAuthor}
      />
    </div>
  );
}
