"use client";

import * as React from "react";
import { toast } from "sonner";
import type { RedirectRow } from "@/types/redirects";
import { deleteAdminRedirect } from "@/lib/actions/redirects-admin";
import { RedirectDialog } from "./redirect-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RedirectsClientProps {
  initialRedirects: RedirectRow[];
}

export function RedirectsClient({ initialRedirects }: RedirectsClientProps) {
  const [redirects, setRedirects] =
    React.useState<RedirectRow[]>(initialRedirects);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<RedirectRow | null>(
    null
  );
  const [isDeletingId, setIsDeletingId] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    return redirects.filter((item) => {
      if (
        statusFilter !== "all" &&
        item.status_code.toString() !== statusFilter
      ) {
        return false;
      }
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        return (
          item.from_path.toLowerCase().includes(query) ||
          item.to_path.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [redirects, search, statusFilter]);

  const handleCreate = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  const handleEdit = (item: RedirectRow) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleDelete = async (item: RedirectRow) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete redirect from "${item.from_path}" to "${item.to_path}"?`
    );
    if (!confirmed) return;

    setIsDeletingId(item.id);
    try {
      const res = await deleteAdminRedirect(item.id);
      if (res.success) {
        toast.success("Redirect deleted successfully.");
        setRedirects((prev) => prev.filter((r) => r.id !== item.id));
      } else {
        toast.error(res.error || "Failed to delete redirect.");
      }
    } catch {
      toast.error("Failed to delete redirect.");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleSaveSuccess = (saved: RedirectRow) => {
    setRedirects((prev) => {
      const idx = prev.findIndex(
        (r) => r.id === saved.id || r.from_path === saved.from_path
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex max-w-md flex-1 items-center gap-3">
          <Input
            placeholder="Search from or to path..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-border bg-page-background text-foreground focus:ring-foreground rounded-md border px-3 py-2 text-sm focus:ring-1"
          >
            <option value="all">All Types</option>
            <option value="301">301 Permanent</option>
            <option value="302">302 Temporary</option>
          </select>
        </div>

        <Button onClick={handleCreate} className="sm:self-end">
          + Add Redirect
        </Button>
      </div>

      {/* Table */}
      <div className="border-border bg-surface overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="border-border bg-page-background/50 text-foreground/70 border-b text-xs uppercase">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">
                Source Path (Incoming)
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Target Destination
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Status
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Created
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-foreground/60 px-4 py-8 text-center text-sm"
                >
                  {search || statusFilter !== "all"
                    ? "No redirects matching the search criteria."
                    : "No redirects configured yet."}
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-page-background/30 transition-colors"
                >
                  <td className="text-foreground px-4 py-3 font-mono text-xs font-medium">
                    {item.from_path}
                  </td>
                  <td className="text-foreground/80 max-w-xs truncate px-4 py-3 font-mono text-xs">
                    {item.to_path}
                  </td>
                  <td className="px-4 py-3">
                    {item.status_code === 301 ? (
                      <span className="inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                        301 Permanent
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                        302 Temporary
                      </span>
                    )}
                  </td>
                  <td className="text-foreground/60 px-4 py-3 text-xs whitespace-nowrap">
                    {new Date(item.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive/50 hover:bg-destructive/10"
                        onClick={() => handleDelete(item)}
                        disabled={isDeletingId === item.id}
                      >
                        {isDeletingId === item.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-foreground/50 text-xs">
        Showing {filtered.length} of {redirects.length} total redirects
      </div>

      <RedirectDialog
        open={dialogOpen}
        redirectItem={editingItem}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleSaveSuccess}
      />
    </div>
  );
}
