/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  getAdminBlogPosts,
  getAdminBlogCategories,
  deleteBlogCategory,
  reorderBlogCategories,
} from "@/lib/actions/blog-admin";
import type { BlogCategory, BlogPostWithDetails } from "@/types/blog";
import { PostEditDialog } from "./post-edit-dialog";
import { CategoryDialog } from "./category-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BlogClientProps {
  initialPosts: BlogPostWithDetails[];
  initialTotalPosts: number;
  initialCategories: BlogCategory[];
  defaultAuthorName: string;
}

export function BlogClient({
  initialPosts,
  initialTotalPosts,
  initialCategories,
  defaultAuthorName,
}: BlogClientProps) {
  const [activeTab, setActiveTab] = React.useState<"posts" | "categories">("posts");

  // Posts State
  const [posts, setPosts] = React.useState<BlogPostWithDetails[]>(initialPosts);
  const [totalPosts, setTotalPosts] = React.useState(initialTotalPosts);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);
  const [loadingPosts, setLoadingPosts] = React.useState(false);

  // Categories State
  const [categories, setCategories] = React.useState<BlogCategory[]>(initialCategories);

  // Dialogs State
  const [editingPost, setEditingPost] = React.useState<BlogPostWithDetails | null>(null);
  const [postDialogOpen, setPostDialogOpen] = React.useState(false);

  const [editingCategory, setEditingCategory] = React.useState<BlogCategory | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = React.useState(false);

  // Refresh posts list
  const refreshPosts = React.useCallback(async () => {
    setLoadingPosts(true);
    try {
      const res = await getAdminBlogPosts({
        search,
        status: statusFilter,
        categoryId: categoryFilter,
        page,
        pageSize: 20,
      });
      if (res.success) {
        setPosts(res.data.items);
        setTotalPosts(res.data.total);
      }
    } finally {
      setLoadingPosts(false);
    }
  }, [search, statusFilter, categoryFilter, page]);

  // Refresh categories list
  const refreshCategories = React.useCallback(async () => {
    const res = await getAdminBlogCategories();
    if (res.success) {
      setCategories(res.data);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      refreshPosts();
    }, 200);
    return () => clearTimeout(timer);
  }, [refreshPosts]);

  // Handle category delete
  const handleDeleteCategory = async (cat: BlogCategory) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete category "${cat.name}"?`
    );
    if (!confirmed) return;

    const res = await deleteBlogCategory(cat.id);
    if (res.success) {
      toast.success("Category deleted.");
      refreshCategories();
    } else {
      toast.error(res.error || "Failed to delete category.");
    }
  };

  // Handle category reordering
  const handleMoveCategory = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const newOrder = [...categories];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);

    setCategories(newOrder);

    const res = await reorderBlogCategories(newOrder.map((c) => c.id));
    if (!res.success) {
      toast.error("Failed to update sort order.");
      refreshCategories();
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("posts")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "posts"
              ? "border-foreground text-foreground"
              : "border-transparent text-foreground/60 hover:text-foreground"
          }`}
        >
          Blog Posts ({totalPosts})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("categories")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "categories"
              ? "border-foreground text-foreground"
              : "border-transparent text-foreground/60 hover:text-foreground"
          }`}
        >
          Categories ({categories.length})
        </button>
      </div>

      {activeTab === "posts" ? (
        <div className="space-y-4">
          {/* Filters & Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1 max-w-2xl">
              <Input
                placeholder="Search posts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 sm:w-64"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border-input bg-page-background text-foreground text-xs rounded-md border px-3 py-2"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border-input bg-page-background text-foreground text-xs rounded-md border px-3 py-2"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={() => {
                setEditingPost(null);
                setPostDialogOpen(true);
              }}
            >
              + Create Post
            </Button>
          </div>

          {/* Posts Table */}
          <div className="rounded-lg border border-border bg-surface overflow-hidden">
            {posts.length === 0 ? (
              <div className="p-12 text-center text-foreground/60 text-sm">
                {loadingPosts ? "Loading posts..." : "No blog posts found."}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-page-background/50 transition-colors"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground text-sm">
                          {post.title}
                        </span>
                        {post.is_featured && (
                          <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                            ★ Featured
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            post.status === "published"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                          }`}
                        >
                          {post.status}
                        </span>
                        {post.category && (
                          <span className="text-xs text-foreground/60">
                            in {post.category.name}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-foreground/60 line-clamp-1">
                        {post.excerpt || "No excerpt provided."}
                      </p>

                      <div className="text-[11px] text-foreground/50 flex items-center gap-3">
                        <span>
                          {post.published_at
                            ? `Published ${new Date(post.published_at).toLocaleDateString("en-IN")}`
                            : `Created ${new Date(post.created_at).toLocaleDateString("en-IN")}`}
                        </span>
                        <span>•</span>
                        <span>{post.reading_time_minutes} min read</span>
                        <span>•</span>
                        <span>/{post.slug}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-none">
                      <Link
                        href={`/admin/blog/preview/${post.id}`}
                        target="_blank"
                        className="text-xs px-2.5 py-1.5 rounded border border-border text-foreground hover:bg-surface font-medium"
                      >
                        Preview
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingPost(post);
                          setPostDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-foreground/60">
              Manage categories used to organize blog articles. Deleting a category is blocked if articles are assigned to it.
            </p>
            <Button
              onClick={() => {
                setEditingCategory(null);
                setCategoryDialogOpen(true);
              }}
            >
              + New Category
            </Button>
          </div>

          <div className="rounded-lg border border-border bg-surface overflow-hidden">
            {categories.length === 0 ? (
              <div className="p-12 text-center text-foreground/60 text-sm">
                No categories created yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {categories.map((cat, index) => (
                  <div
                    key={cat.id}
                    className="p-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {cat.name}
                        </span>
                        <span className="text-xs text-foreground/50">
                          /{cat.slug}
                        </span>
                      </div>
                      {cat.description && (
                        <p className="text-xs text-foreground/60 mt-0.5">
                          {cat.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMoveCategory(index, "up")}
                        disabled={index === 0}
                        className="p-1 rounded text-foreground/60 hover:text-foreground disabled:opacity-20"
                        title="Move Up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveCategory(index, "down")}
                        disabled={index === categories.length - 1}
                        className="p-1 rounded text-foreground/60 hover:text-foreground disabled:opacity-20"
                        title="Move Down"
                      >
                        ↓
                      </button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingCategory(cat);
                          setCategoryDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive/50 hover:bg-destructive/10"
                        onClick={() => handleDeleteCategory(cat)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post Dialog */}
      <PostEditDialog
        open={postDialogOpen}
        post={editingPost}
        categories={categories}
        defaultAuthorName={defaultAuthorName}
        onClose={() => setPostDialogOpen(false)}
        onSuccess={() => {
          refreshPosts();
          refreshCategories();
        }}
      />

      {/* Category Dialog */}
      <CategoryDialog
        open={categoryDialogOpen}
        category={editingCategory}
        onClose={() => setCategoryDialogOpen(false)}
        onSuccess={() => {
          refreshCategories();
          refreshPosts();
        }}
      />
    </div>
  );
}
