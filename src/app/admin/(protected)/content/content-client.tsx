"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  getTestimonials,
  deleteTestimonial,
  toggleTestimonialPublished,
  toggleTestimonialFeatured,
  reorderTestimonials,
  getFAQs,
  deleteFAQ,
  toggleFAQPublished,
  reorderFAQs,
  getAnnouncements,
  deleteAnnouncement,
  toggleAnnouncementActive,
} from "@/lib/actions/content";
import type { Testimonial, FAQ, Announcement } from "@/types/content";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { TestimonialDialog } from "@/components/admin/testimonial-dialog";
import { FAQDialog } from "@/components/admin/faq-dialog";
import { AnnouncementDialog } from "@/components/admin/announcement-dialog";
import { Button } from "@/components/ui/button";

interface ContentClientProps {
  initialTestimonials: Testimonial[];
  initialFAQs: FAQ[];
  initialAnnouncements: Announcement[];
}

export function ContentClient({
  initialTestimonials,
  initialFAQs,
  initialAnnouncements,
}: ContentClientProps) {
  const [activeTab, setActiveTab] = React.useState<
    "testimonials" | "faqs" | "announcements"
  >("testimonials");

  // State
  const [testimonials, setTestimonials] =
    React.useState<Testimonial[]>(initialTestimonials);
  const [faqs, setFaqs] = React.useState<FAQ[]>(initialFAQs);
  const [announcements, setAnnouncements] =
    React.useState<Announcement[]>(initialAnnouncements);

  // FAQ filter
  const [faqGroupFilter, setFaqGroupFilter] = React.useState<string>("all");

  // Dialog states
  const [testimonialDialog, setTestimonialDialog] = React.useState<{
    open: boolean;
    item: Testimonial | null;
  }>({ open: false, item: null });

  const [faqDialog, setFaqDialog] = React.useState<{
    open: boolean;
    item: FAQ | null;
  }>({ open: false, item: null });

  const [announcementDialog, setAnnouncementDialog] = React.useState<{
    open: boolean;
    item: Announcement | null;
  }>({ open: false, item: null });

  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    type: "testimonial" | "faq" | "announcement";
    id: string;
    name: string;
  } | null>(null);

  // Refresh helpers
  const refreshTestimonials = async () => {
    const res = await getTestimonials();
    if (res.success) setTestimonials(res.data);
  };

  const refreshFaqs = async () => {
    const res = await getFAQs();
    if (res.success) setFaqs(res.data);
  };

  const refreshAnnouncements = async () => {
    const res = await getAnnouncements();
    if (res.success) setAnnouncements(res.data);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;

    if (type === "testimonial") {
      const res = await deleteTestimonial(id);
      if (!res.success) {
        toast.error(res.error || "Failed to delete testimonial");
        return;
      }
      toast.success("Testimonial deleted");
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
    } else if (type === "faq") {
      const res = await deleteFAQ(id);
      if (!res.success) {
        toast.error(res.error || "Failed to delete FAQ");
        return;
      }
      toast.success("FAQ deleted");
      setFaqs((prev) => prev.filter((f) => f.id !== id));
    } else if (type === "announcement") {
      const res = await deleteAnnouncement(id);
      if (!res.success) {
        toast.error(res.error || "Failed to delete announcement");
        return;
      }
      toast.success("Announcement deleted");
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    }

    setDeleteConfirm(null);
  };

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleTestimonialsDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = testimonials.findIndex((t) => t.id === active.id);
    const newIndex = testimonials.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(testimonials, oldIndex, newIndex);
    setTestimonials(reordered);

    const ids = reordered.map((t) => t.id);
    const res = await reorderTestimonials(ids);
    if (!res.success) {
      toast.error(res.error || "Failed to reorder testimonials");
      await refreshTestimonials();
    } else {
      toast.success("Testimonials reordered");
    }
  };

  const handleFAQsDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = faqs.findIndex((f) => f.id === active.id);
    const newIndex = faqs.findIndex((f) => f.id === over.id);
    const reordered = arrayMove(faqs, oldIndex, newIndex);
    setFaqs(reordered);

    const ids = reordered.map((f) => f.id);
    const res = await reorderFAQs(ids);
    if (!res.success) {
      toast.error(res.error || "Failed to reorder FAQs");
      await refreshFaqs();
    } else {
      toast.success("FAQs reordered");
    }
  };

  const filteredFaqs = React.useMemo(() => {
    if (faqGroupFilter === "all") return faqs;
    return faqs.filter((f) => f.group === faqGroupFilter);
  }, [faqs, faqGroupFilter]);

  // Is Announcement Live helper
  const getAnnouncementStatus = (a: Announcement) => {
    if (!a.is_active) {
      return {
        status: "Inactive",
        className: "bg-surface text-foreground/60 border",
      };
    }
    const now = new Date();
    if (a.start_date && new Date(a.start_date) > now) {
      return {
        status: "Scheduled",
        className: "bg-yellow-100 text-yellow-800 border",
      };
    }
    if (a.end_date && new Date(a.end_date) < now) {
      return {
        status: "Expired",
        className: "bg-surface text-foreground/50 border",
      };
    }
    return {
      status: "Live Now",
      className:
        "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300 font-semibold",
    };
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-border flex gap-4 border-b pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("testimonials")}
          className={`pb-2 text-sm font-semibold transition-colors ${
            activeTab === "testimonials"
              ? "border-foreground text-foreground border-b-2"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          Testimonials ({testimonials.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("faqs")}
          className={`pb-2 text-sm font-semibold transition-colors ${
            activeTab === "faqs"
              ? "border-foreground text-foreground border-b-2"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          FAQs ({faqs.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("announcements")}
          className={`pb-2 text-sm font-semibold transition-colors ${
            activeTab === "announcements"
              ? "border-foreground text-foreground border-b-2"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          Announcements ({announcements.length})
        </button>
      </div>

      {/* ========================================================= */}
      {/* TESTIMONIALS TAB */}
      {/* ========================================================= */}
      {activeTab === "testimonials" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-foreground/70 text-xs font-medium">
              Drag items to change their display order on public pages.
            </p>
            <Button
              onClick={() => setTestimonialDialog({ open: true, item: null })}
            >
              Add Testimonial
            </Button>
          </div>

          {testimonials.length === 0 ? (
            <div className="border-border rounded-lg border p-8 text-center">
              <p className="text-foreground/60 text-sm">
                No testimonials added yet.
              </p>
              <Button
                className="mt-4"
                onClick={() => setTestimonialDialog({ open: true, item: null })}
              >
                Create First Testimonial
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleTestimonialsDragEnd}
            >
              <SortableContext
                items={testimonials.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {testimonials.map((t) => (
                    <SortableTestimonialRow
                      key={t.id}
                      item={t}
                      onEdit={() =>
                        setTestimonialDialog({ open: true, item: t })
                      }
                      onDelete={() =>
                        setDeleteConfirm({
                          type: "testimonial",
                          id: t.id,
                          name: `testimonial from "${t.customer_name}"`,
                        })
                      }
                      onTogglePublished={async () => {
                        const next = !t.is_published;
                        setTestimonials((prev) =>
                          prev.map((item) =>
                            item.id === t.id
                              ? { ...item, is_published: next }
                              : item
                          )
                        );
                        const res = await toggleTestimonialPublished(
                          t.id,
                          next
                        );
                        if (!res.success) {
                          toast.error(res.error || "Failed to update status");
                          await refreshTestimonials();
                        } else {
                          toast.success(next ? "Published" : "Unpublished");
                        }
                      }}
                      onToggleFeatured={async () => {
                        const next = !t.is_featured;
                        setTestimonials((prev) =>
                          prev.map((item) =>
                            item.id === t.id
                              ? { ...item, is_featured: next }
                              : item
                          )
                        );
                        const res = await toggleTestimonialFeatured(t.id, next);
                        if (!res.success) {
                          toast.error(
                            res.error || "Failed to update featured status"
                          );
                          await refreshTestimonials();
                        } else {
                          toast.success(
                            next ? "Marked featured" : "Removed featured"
                          );
                        }
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* FAQS TAB */}
      {/* ========================================================= */}
      {activeTab === "faqs" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-foreground/70 text-xs font-medium">
                Group:
              </span>
              <select
                value={faqGroupFilter}
                onChange={(e) => setFaqGroupFilter(e.target.value)}
                className="border-input bg-background text-foreground h-9 rounded-md border px-3 text-sm"
              >
                <option value="all">All Groups</option>
                <option value="general">General</option>
                <option value="services">Services</option>
                <option value="jewellery">Jewellery</option>
                <option value="orders_and_shipping">Orders & Shipping</option>
              </select>
            </div>

            <Button onClick={() => setFaqDialog({ open: true, item: null })}>
              Add FAQ
            </Button>
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="border-border rounded-lg border p-8 text-center">
              <p className="text-foreground/60 text-sm">No FAQs found.</p>
              <Button
                className="mt-4"
                onClick={() => setFaqDialog({ open: true, item: null })}
              >
                Create First FAQ
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleFAQsDragEnd}
            >
              <SortableContext
                items={filteredFaqs.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {filteredFaqs.map((f) => (
                    <SortableFAQRow
                      key={f.id}
                      item={f}
                      onEdit={() => setFaqDialog({ open: true, item: f })}
                      onDelete={() =>
                        setDeleteConfirm({
                          type: "faq",
                          id: f.id,
                          name: `FAQ: "${f.question}"`,
                        })
                      }
                      onTogglePublished={async () => {
                        const next = !f.is_published;
                        setFaqs((prev) =>
                          prev.map((item) =>
                            item.id === f.id
                              ? { ...item, is_published: next }
                              : item
                          )
                        );
                        const res = await toggleFAQPublished(f.id, next);
                        if (!res.success) {
                          toast.error(res.error || "Failed to update status");
                          await refreshFaqs();
                        } else {
                          toast.success(next ? "Published" : "Unpublished");
                        }
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* ANNOUNCEMENTS TAB */}
      {/* ========================================================= */}
      {activeTab === "announcements" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-foreground/70 text-xs font-medium">
              Announcements appear in the top banner bar when Active and within
              scheduled dates.
            </p>
            <Button
              onClick={() => setAnnouncementDialog({ open: true, item: null })}
            >
              New Announcement
            </Button>
          </div>

          {announcements.length === 0 ? (
            <div className="border-border rounded-lg border p-8 text-center">
              <p className="text-foreground/60 text-sm">
                No announcements configured.
              </p>
              <Button
                className="mt-4"
                onClick={() =>
                  setAnnouncementDialog({ open: true, item: null })
                }
              >
                Create Announcement
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => {
                const liveStatus = getAnnouncementStatus(a);
                return (
                  <div
                    key={a.id}
                    className="bg-surface border-border flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${liveStatus.className}`}
                        >
                          {liveStatus.status}
                        </span>
                        {a.link_url && (
                          <span className="text-foreground/60 text-xs">
                            Link: {a.link_url}{" "}
                            {a.link_label ? `("${a.link_label}")` : ""}
                          </span>
                        )}
                      </div>
                      <p className="text-foreground font-medium">{a.message}</p>
                      {(a.start_date || a.end_date) && (
                        <p className="text-foreground/60 text-xs">
                          {a.start_date
                            ? `From: ${new Date(a.start_date).toLocaleString()}`
                            : ""}
                          {a.start_date && a.end_date ? " • " : ""}
                          {a.end_date
                            ? `Until: ${new Date(a.end_date).toLocaleString()}`
                            : ""}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={async () => {
                          const next = !a.is_active;
                          setAnnouncements((prev) =>
                            prev.map((item) =>
                              item.id === a.id
                                ? { ...item, is_active: next }
                                : item
                            )
                          );
                          const res = await toggleAnnouncementActive(
                            a.id,
                            next
                          );
                          if (!res.success) {
                            toast.error(res.error || "Failed to update status");
                            await refreshAnnouncements();
                          } else {
                            toast.success(next ? "Activated" : "Deactivated");
                          }
                        }}
                        className={`cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                          a.is_active
                            ? "bg-accent text-foreground font-semibold"
                            : "bg-surface text-foreground/60 hover:bg-surface/80 border"
                        }`}
                      >
                        {a.is_active ? "Active" : "Inactive"}
                      </button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setAnnouncementDialog({ open: true, item: a })
                        }
                      >
                        Edit
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() =>
                          setDeleteConfirm({
                            type: "announcement",
                            id: a.id,
                            name: `announcement: "${a.message}"`,
                          })
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <TestimonialDialog
        open={testimonialDialog.open}
        item={testimonialDialog.item}
        onClose={() => setTestimonialDialog({ open: false, item: null })}
        onSuccess={async () => {
          setTestimonialDialog({ open: false, item: null });
          await refreshTestimonials();
        }}
      />

      <FAQDialog
        open={faqDialog.open}
        item={faqDialog.item}
        onClose={() => setFaqDialog({ open: false, item: null })}
        onSuccess={async () => {
          setFaqDialog({ open: false, item: null });
          await refreshFaqs();
        }}
      />

      <AnnouncementDialog
        open={announcementDialog.open}
        item={announcementDialog.item}
        onClose={() => setAnnouncementDialog({ open: false, item: null })}
        onSuccess={async () => {
          setAnnouncementDialog({ open: false, item: null });
          await refreshAnnouncements();
        }}
      />

      {/* Confirm Deletion */}
      <ConfirmDialog
        open={Boolean(deleteConfirm)}
        title="Confirm Delete"
        itemName={deleteConfirm?.name || ""}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirmed}
        onClose={() => setDeleteConfirm(null)}
      />
    </div>
  );
}

// ==========================================
// SORTABLE ROWS
// ==========================================

function SortableTestimonialRow({
  item,
  onEdit,
  onDelete,
  onTogglePublished,
  onToggleFeatured,
}: {
  item: Testimonial;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublished: () => void;
  onToggleFeatured: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const stars = "★".repeat(item.rating) + "☆".repeat(5 - item.rating);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-surface border-border flex items-center justify-between rounded-md border p-3"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag handle"
          className="text-foreground/40 hover:text-foreground cursor-grab p-1 active:cursor-grabbing"
        >
          ⋮⋮
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-foreground text-sm font-medium">
              {item.customer_name}
            </span>
            {item.occasion && (
              <span className="text-foreground/60 text-xs">
                ({item.occasion})
              </span>
            )}
            <span className="text-xs tracking-wider text-amber-500">
              {stars}
            </span>
            <span className="bg-surface text-foreground/60 py-0.2 rounded-full border px-1.5 text-[10px] capitalize">
              {item.source}
            </span>
          </div>
          <p className="text-foreground/80 mt-0.5 line-clamp-1 text-xs">
            &ldquo;{item.quote}&rdquo;
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleFeatured}
          className={`cursor-pointer rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
            item.is_featured
              ? "bg-accent text-foreground font-semibold"
              : "bg-surface text-foreground/50 hover:bg-surface/80 border"
          }`}
        >
          {item.is_featured ? "Featured" : "No"}
        </button>

        <button
          type="button"
          onClick={onTogglePublished}
          className={`cursor-pointer rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
            item.is_published
              ? "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300"
              : "bg-surface text-foreground/50 border"
          }`}
        >
          {item.is_published ? "Published" : "Draft"}
        </button>

        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700"
          onClick={onDelete}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

function SortableFAQRow({
  item,
  onEdit,
  onDelete,
  onTogglePublished,
}: {
  item: FAQ;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublished: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-surface border-border flex items-center justify-between rounded-md border p-3"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag handle"
          className="text-foreground/40 hover:text-foreground cursor-grab p-1 active:cursor-grabbing"
        >
          ⋮⋮
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-foreground text-sm font-medium">
              {item.question}
            </span>
            <span className="bg-surface text-foreground/60 py-0.2 rounded-full border px-2 text-[10px] capitalize">
              {item.group.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-foreground/60 mt-0.5 line-clamp-1 text-xs">
            {item.answer}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onTogglePublished}
          className={`cursor-pointer rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
            item.is_published
              ? "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300"
              : "bg-surface text-foreground/50 border"
          }`}
        >
          {item.is_published ? "Published" : "Draft"}
        </button>

        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700"
          onClick={onDelete}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
