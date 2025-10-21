import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Upload,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Copy,
} from "lucide-react";
import { useCreateEvent } from "../hooks/useContracts";
import { usePushWalletContext } from "@pushchain/ui-kit";
import { validateFileForUpload, compressImage } from "../lib/ipfs";
import { formatPriceInCurrency } from "../lib/formatters";
import { ImageUpload } from "../components/ImageUpload";
import type { TicketTypeInput } from "../types";

interface FormData {
  name: string;
  description: string;
  venue: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  image: File | null;
  totalSupply: string;
  royaltyBps: string;
}

interface FormErrors {
  [key: string]: string;
}

export const CreateEventPage = () => {
  const navigate = useNavigate();
  const { connectionStatus } = usePushWalletContext();
  const { createEvent, isPending: isCreatingEvent } = useCreateEvent();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    venue: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    image: null,
    totalSupply: "",
    royaltyBps: "250", // 2.5% default
  });

  const [ticketTypes, setTicketTypes] = useState<TicketTypeInput[]>([
    {
      name: "General Admission",
      price: BigInt(0),
      supply: BigInt(0),
      image: null,
      imagePreview: "",
    },
  ]);

  const [errors, setErrors] = useState<FormErrors>({});
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  // Calculate estimated revenue
  const estimatedRevenue = useMemo(() => {
    return ticketTypes.reduce((sum, type) => {
      return sum + Number(type.price) * Number(type.supply);
    }, 0);
  }, [ticketTypes]);

  // Auto-calculate end time (3 hours after start)
  useEffect(() => {
    if (formData.startTime && formData.startDate && !formData.endTime) {
      const [hours, minutes] = formData.startTime.split(":");
      const startHour = parseInt(hours);
      const endHour = (startHour + 3) % 24;
      const suggestedEndTime = `${endHour
        .toString()
        .padStart(2, "0")}:${minutes}`;

      // Set end date same as start date, unless end time wraps to next day
      const suggestedEndDate =
        endHour < startHour
          ? new Date(new Date(formData.startDate).getTime() + 86400000)
              .toISOString()
              .split("T")[0]
          : formData.startDate;

      setFormData((prev) => ({
        ...prev,
        endTime: suggestedEndTime,
        endDate: suggestedEndDate || prev.endDate,
      }));
    }
  }, [formData.startTime, formData.startDate, formData.endTime]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFileForUpload(file);
    if (!validation.valid) {
      setErrors((prev) => ({
        ...prev,
        image: validation.error || "Invalid file",
      }));
      return;
    }

    try {
      // Compress image before setting
      const compressedFile = await compressImage(file);
      setFormData((prev) => ({ ...prev, image: compressedFile }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(compressedFile);

      // Clear image error
      setErrors((prev) => ({ ...prev, image: "" }));
    } catch {
      setErrors((prev) => ({ ...prev, image: "Failed to process image" }));
    }
  };

  const handleTicketTypeChange = (
    index: number,
    field: keyof TicketTypeInput,
    value: string
  ) => {
    setTicketTypes((prev) =>
      prev.map((type, i) => {
        if (i === index) {
          if (field === "price" || field === "supply") {
            return { ...type, [field]: BigInt(value || "0") };
          }
          return { ...type, [field]: value };
        }
        return type;
      })
    );
  };

  const addTicketTypeField = () => {
    setTicketTypes((prev) => [
      ...prev,
      {
        name: "",
        price: BigInt(0),
        supply: BigInt(0),
        image: null,
        imagePreview: "",
      },
    ]);
  };

  const removeTicketType = (index: number) => {
    if (ticketTypes.length > 1) {
      setTicketTypes((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const duplicateTicketType = (index: number) => {
    const typeToDupe = ticketTypes[index];
    setTicketTypes((prev) => [
      ...prev,
      {
        ...typeToDupe,
        name: `${typeToDupe.name} (Copy)`,
        image: null, // Don't copy image - require new upload
        imagePreview: "",
      },
    ]);
  };

  // Handle ticket type image upload
  const handleTicketTypeImageChange = async (index: number, file: File) => {
    const validation = validateFileForUpload(file);
    if (!validation.valid) {
      setErrors((prev) => ({
        ...prev,
        [`ticketType${index}Image`]: validation.error || "Invalid file",
      }));
      return;
    }

    try {
      // Compress image
      const compressedFile = await compressImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setTicketTypes((prev) =>
          prev.map((type, i) =>
            i === index
              ? {
                  ...type,
                  image: compressedFile,
                  imagePreview: e.target?.result as string,
                }
              : type
          )
        );
      };
      reader.readAsDataURL(compressedFile);

      // Clear error
      setErrors((prev) => ({
        ...prev,
        [`ticketType${index}Image`]: "",
      }));
    } catch {
      setErrors((prev) => ({
        ...prev,
        [`ticketType${index}Image`]: "Failed to process image",
      }));
    }
  };

  // Handle ticket type image removal
  const handleTicketTypeImageRemove = (index: number) => {
    setTicketTypes((prev) =>
      prev.map((type, i) =>
        i === index ? { ...type, image: null, imagePreview: "" } : type
      )
    );
  };

  // Draft save/load functionality
  const saveDraft = () => {
    const draft = {
      timestamp: Date.now(),
      formData: { ...formData, image: null }, // Don't save File object
      ticketTypes: ticketTypes.map((tt) => ({
        name: tt.name,
        price: tt.price.toString(),
        supply: tt.supply.toString(),
        image: null, // Don't save File object
        imagePreview: tt.imagePreview || "", // Save preview as data URL
      })),
      imageDataUrl: imagePreview,
    };
    localStorage.setItem("ticketchain_draft_event", JSON.stringify(draft));
    setLastSaved(new Date());
  };

  const loadDraft = () => {
    const draftStr = localStorage.getItem("ticketchain_draft_event");
    if (!draftStr) return;

    try {
      const draft = JSON.parse(draftStr);
      setFormData(draft.formData);
      setTicketTypes(
        draft.ticketTypes.map(
          (tt: {
            name: string;
            price: string;
            supply: string;
            image: null;
            imagePreview?: string;
          }) => ({
            name: tt.name,
            price: BigInt(tt.price),
            supply: BigInt(tt.supply),
            image: null, // File objects can't be restored
            imagePreview: tt.imagePreview || "", // Restore preview
          })
        )
      );
      if (draft.imageDataUrl) {
        setImagePreview(draft.imageDataUrl);
      }
      setHasDraft(false);
      setLastSaved(new Date(draft.timestamp));
    } catch (error) {
      console.error("Failed to load draft:", error);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem("ticketchain_draft_event");
    setHasDraft(false);
    setLastSaved(null);
  };

  // Check for existing draft on mount
  useEffect(() => {
    const draftStr = localStorage.getItem("ticketchain_draft_event");
    if (draftStr) {
      setHasDraft(true);
    }
  }, []);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (formData.name || formData.description || formData.venue) {
      const interval = setInterval(() => {
        saveDraft();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, ticketTypes, imagePreview]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.name.trim()) newErrors.name = "Event name is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.venue.trim()) newErrors.venue = "Venue is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.startTime) newErrors.startTime = "Start time is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";
    if (!formData.endTime) newErrors.endTime = "End time is required";
    if (!formData.image) newErrors.image = "Event image is required";
    if (!formData.totalSupply || parseInt(formData.totalSupply) <= 0) {
      newErrors.totalSupply = "Total supply must be greater than 0";
    }

    // Date validation
    const startDateTime = new Date(
      `${formData.startDate}T${formData.startTime}`
    );
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
    const now = new Date();

    if (startDateTime <= now) {
      newErrors.startDate = "Start date must be in the future";
    }
    if (endDateTime <= startDateTime) {
      newErrors.endDate = "End date must be after start date";
    }

    // Ticket types validation
    const totalTicketSupply = ticketTypes.reduce(
      (sum, type) => sum + Number(type.supply),
      0
    );
    if (totalTicketSupply !== parseInt(formData.totalSupply)) {
      newErrors.totalSupply =
        "Total supply must equal sum of all ticket type supplies";
    }

    ticketTypes.forEach((type, index) => {
      if (!type.name.trim()) {
        newErrors[`ticketType${index}Name`] = "Ticket type name is required";
      }
      if (Number(type.price) < 0) {
        newErrors[`ticketType${index}Price`] = "Price cannot be negative";
      }
      if (Number(type.supply) <= 0) {
        newErrors[`ticketType${index}Supply`] = "Supply must be greater than 0";
      }
      if (!type.image) {
        newErrors[`ticketType${index}Image`] = "Ticket tier image is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !formData.image) return;
    if (connectionStatus !== "connected") {
      alert("Please connect your wallet to create an event");
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert dates to timestamps
      const startTime = BigInt(
        Math.floor(
          new Date(`${formData.startDate}T${formData.startTime}`).getTime() /
            1000
        )
      );
      const endTime = BigInt(
        Math.floor(
          new Date(`${formData.endDate}T${formData.endTime}`).getTime() / 1000
        )
      );

      // Create event with initial ticket types in a single transaction
      const eventData = {
        name: formData.name,
        description: formData.description,
        startTime,
        endTime,
        venue: formData.venue,
        image: formData.image,
        totalSupply: BigInt(formData.totalSupply),
        royaltyBps: BigInt(formData.royaltyBps),
        initialTicketTypes: ticketTypes, // Include ticket types in the event creation
      };

      await createEvent(eventData);

      // Clear draft on success
      clearDraft();

      // Success - navigate to events page
      navigate("/events");
    } catch (error) {
      console.error("Failed to create event:", error);
      alert("Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (connectionStatus !== "connected") {
    return (
      <div className="container px-4 py-16">
        <div className="glass-card mx-auto max-w-xl rounded-[2rem] border border-border bg-card p-10 text-center shadow-lg">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <AlertCircle className="h-9 w-9" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
            Connect your wallet to launch an event
          </h1>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            TicketChain needs a connected Push wallet to mint NFT passes and
            fund your event treasury.
          </p>
          <button className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary">
            Connect wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="glass-card rounded-[2.5rem] border border-border bg-card p-6 md:p-10 shadow-lg">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                Event Studio
              </span>
              <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
                Craft a signature experience
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                Design every tier, automate royalty splits, and launch an
                on-chain event that dazzles attendees.
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 px-5 py-4 text-xs text-muted-foreground">
              <p className="font-semibold uppercase tracking-wider text-foreground">
                Draft status
              </p>
              <p className="mt-1">
                {lastSaved
                  ? `Autosaved ${lastSaved.toLocaleTimeString()}`
                  : "No draft yet"}
              </p>
            </div>
          </div>
        </div>

        {/* Draft Banner */}
        {hasDraft && (
          <div className="glass-card flex flex-col gap-3 rounded-[1.75rem] border border-primary/40 bg-primary/10 p-5 text-primary">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5" />
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider">
                  Resume your draft?
                </h4>
                <p className="text-xs text-primary/80">
                  We found unsaved event configuration from your last session.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={loadDraft}
                className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
              >
                Load draft
              </button>
              <button
                type="button"
                onClick={clearDraft}
                className="inline-flex items-center justify-center rounded-full border border-primary/40 bg-background/70 px-4 py-2 text-xs font-semibold text-primary transition hover:border-primary"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Auto-save Indicator */}
        {lastSaved && !hasDraft && (
          <div className="flex items-center justify-end text-xs uppercase tracking-wider text-muted-foreground">
            <CheckCircle className="mr-2 h-4 w-4 text-primary" />
            Draft saved {lastSaved.toLocaleTimeString()}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-10">
          {/* Basic Information */}
          <div className="glass-card rounded-[2rem] border border-border bg-card p-6 md:p-8">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground md:text-2xl">
                  Basic information
                </h2>
                <p className="text-sm text-muted-foreground">
                  Introduce the experience and set the tone for potential
                  attendees.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Event name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full rounded-2xl border bg-background/80 px-4 py-3 text-sm font-medium text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    errors.name
                      ? "border-destructive/60 shadow-[0_0_0_1px_rgba(244,63,94,0.35)]"
                      : "border-border/60"
                  }`}
                  placeholder="Metaverse Mixer • NYC"
                />
                {errors.name && (
                  <p className="mt-2 text-sm font-semibold text-destructive">
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  maxLength={2000}
                  className={`w-full rounded-2xl border bg-background/80 px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    errors.description
                      ? "border-destructive/60 shadow-[0_0_0_1px_rgba(244,63,94,0.35)]"
                      : "border-border/60"
                  }`}
                  placeholder="Share the vibe, headliners, and exclusive perks attendees unlock by joining."
                />
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  {errors.description ? (
                    <p className="font-semibold text-destructive">
                      {errors.description}
                    </p>
                  ) : (
                    <span>Keep it punchy—highlight the why and wow.</span>
                  )}
                  <span
                    className={
                      formData.description.length > 1800
                        ? "text-amber-500"
                        : ""
                    }
                  >
                    {formData.description.length} / 2000
                  </span>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Venue / location *
                </label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  className={`w-full rounded-2xl border bg-background/80 px-4 py-3 text-sm font-medium text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    errors.venue
                      ? "border-destructive/60 shadow-[0_0_0_1px_rgba(244,63,94,0.35)]"
                      : "border-border/60"
                  }`}
                  placeholder="123 Web3 Way, Brooklyn, NY or Metaverse District 4"
                />
                {errors.venue && (
                  <p className="mt-2 text-sm font-semibold text-destructive">
                    {errors.venue}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Date and Time */}
          <div className="glass-card rounded-[2rem] border border-border bg-card p-6 md:p-8">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground md:text-2xl">
                    Event schedule
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Set check-in and closing times so ticket utility updates
                    automatically.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Event start
                </h3>
                <p className="text-xs text-muted-foreground/80">
                  Choose when doors open or the livestream goes live—attendees
                  gain access at this time.
                </p>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Start date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className={`w-full rounded-2xl border bg-background/80 px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    errors.startDate
                      ? "border-destructive/60 shadow-[0_0_0_1px_rgba(244,63,94,0.35)]"
                      : "border-border/60"
                  }`}
                />
                {errors.startDate && (
                  <p className="mt-2 text-sm font-semibold text-destructive">
                    {errors.startDate}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Start time *
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className={`w-full rounded-2xl border bg-background/80 px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    errors.startTime
                      ? "border-destructive/60 shadow-[0_0_0_1px_rgba(244,63,94,0.35)]"
                      : "border-border/60"
                  }`}
                />
                {errors.startTime && (
                  <p className="mt-2 text-sm font-semibold text-destructive">
                    {errors.startTime}
                  </p>
                )}
              </div>

              <div className="md:col-span-2 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Event end
                </h3>
                <p className="text-xs text-muted-foreground/80">
                  After this timestamp, tickets will display as inactive—great
                  for redeemables or post-event gating.
                </p>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  End date *
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className={`w-full rounded-2xl border bg-background/80 px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    errors.endDate
                      ? "border-destructive/60 shadow-[0_0_0_1px_rgba(244,63,94,0.35)]"
                      : "border-border/60"
                  }`}
                />
                {errors.endDate && (
                  <p className="mt-2 text-sm font-semibold text-destructive">
                    {errors.endDate}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  End time *
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className={`w-full rounded-2xl border bg-background/80 px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    errors.endTime
                      ? "border-destructive/60 shadow-[0_0_0_1px_rgba(244,63,94,0.35)]"
                      : "border-border/60"
                  }`}
                />
                {errors.endTime && (
                  <p className="mt-2 text-sm font-semibold text-destructive">
                    {errors.endTime}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Event Image */}
          <div className="glass-card rounded-[2rem] border border-border bg-card p-6 md:p-8">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground md:text-2xl">
                  Event imagery
                </h2>
                <p className="text-sm text-muted-foreground">
                  Showcase the vibe—this artwork appears across the entire
                  ticketing journey.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Upload cover image *
              </label>
              <div className="relative overflow-hidden rounded-[1.75rem] border-2 border-dashed border-border/60 bg-background/60 p-6 text-center">
                {imagePreview ? (
                  <div className="space-y-4">
                    <img
                      src={imagePreview}
                      alt="Event preview"
                      className="mx-auto max-h-56 rounded-[1.5rem] border border-border/60 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview("");
                        setFormData((prev) => ({ ...prev, image: null }));
                      }}
                      className="inline-flex items-center justify-center rounded-full border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-destructive transition hover:bg-destructive/15"
                    >
                      Remove image
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <Upload className="mx-auto h-12 w-12 text-primary" />
                    <p>Click to upload or drag and drop a high-res visual</p>
                    <p className="text-xs">PNG, JPG, or GIF up to 5MB</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </div>
              {errors.image && (
                <p className="text-sm font-semibold text-destructive">
                  {errors.image}
                </p>
              )}
            </div>
          </div>

          {/* Ticket Configuration */}
          <div className="glass-card rounded-[2rem] border border-border bg-card p-6 md:p-8">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground md:text-2xl">
                  Ticket configuration
                </h2>
                <p className="text-sm text-muted-foreground">
                  Define supply, tiers, and pricing for your universal passes.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Total Supply *
                  </label>
                  <input
                    type="number"
                    name="totalSupply"
                    value={formData.totalSupply}
                    onChange={handleInputChange}
                    min="1"
                    className={`w-full rounded-2xl border bg-background/80 px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                      errors.totalSupply
                        ? "border-destructive/60 shadow-[0_0_0_1px_rgba(244,63,94,0.35)]"
                        : "border-border/60"
                    }`}
                    placeholder="Total number of tickets"
                  />
                  {errors.totalSupply && (
                    <p className="mt-2 text-sm font-semibold text-destructive">
                      {errors.totalSupply}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Royalty (%)
                  </label>
                  <input
                    type="number"
                    name="royaltyBps"
                    value={Number(formData.royaltyBps) / 100}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        royaltyBps: (
                          parseFloat(e.target.value) * 100
                        ).toString(),
                      }))
                    }
                    min="0"
                    max="10"
                    step="0.1"
                    className="w-full rounded-2xl border border-border/60 bg-background/80 px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="2.5"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Percentage you'll earn from secondary sales
                  </p>
                </div>
              </div>

              {/* Revenue Estimate */}
              {estimatedRevenue > 0 && (
                <div className="rounded-[1.75rem] border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-400">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wider">
                          Estimated revenue
                        </h4>
                        <p className="text-xs text-emerald-300">
                          If every ticket sells out
                        </p>
                      </div>
                    </div>
                    <p className="text-2xl font-semibold text-emerald-200">
                      {formatPriceInCurrency(BigInt(estimatedRevenue), "PC")}
                    </p>
                  </div>
                </div>
              )}

              {/* Ticket Types */}
              <div>
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h3 className="text-base md:text-lg font-medium">
                    Ticket Types
                  </h3>
                  <button
                    type="button"
                    onClick={addTicketTypeField}
                    className="flex items-center gap-1.5 md:gap-2 text-primary hover:text-accent text-xs md:text-sm font-medium touch-manipulation"
                  >
                    <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Add Ticket Type</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                </div>

                <div className="space-y-3 md:space-y-4">
                  {ticketTypes.map((ticketType, index) => (
                    <div
                      key={index}
                      className="rounded-[1.75rem] border border-border/60 bg-background/70 p-4 md:p-5"
                    >
                      <div className="flex items-center justify-between mb-3 md:mb-4">
                        <h4 className="text-sm md:text-base font-medium">
                          Ticket Type {index + 1}
                        </h4>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => duplicateTicketType(index)}
                            className="text-primary hover:text-accent flex items-center gap-1 text-xs md:text-sm touch-manipulation p-1"
                            title="Duplicate this ticket type"
                          >
                            <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span className="hidden sm:inline">Duplicate</span>
                          </button>
                          {ticketTypes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTicketType(index)}
                              className="text-destructive hover:text-destructive touch-manipulation p-1"
                              title="Remove this ticket type"
                            >
                              <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                        <div>
                          <label className="block text-xs md:text-sm font-medium text-foreground/80 mb-1.5 md:mb-2">
                            Name *
                          </label>
                          <input
                            type="text"
                            value={ticketType.name}
                            onChange={(e) =>
                              handleTicketTypeChange(
                                index,
                                "name",
                                e.target.value
                              )
                            }
                            className={`w-full px-3 py-2.5 md:py-2 text-base border rounded-[1.5rem] focus:ring-2 focus:ring-primary/40 focus:border-primary/50 touch-manipulation ${
                              errors[`ticketType${index}Name`]
                                ? "border-destructive/60"
                                : "border-border/60"
                            }`}
                            placeholder="e.g., VIP, General"
                          />
                          {errors[`ticketType${index}Name`] && (
                            <p className="text-destructive text-sm mt-1">
                              {errors[`ticketType${index}Name`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs md:text-sm font-medium text-foreground/80 mb-1.5 md:mb-2">
                            Price (PC) *
                          </label>
                          <input
                            type="number"
                            value={Number(ticketType.price) / 1e18}
                            onChange={(e) =>
                              handleTicketTypeChange(
                                index,
                                "price",
                                (
                                  parseFloat(e.target.value || "0") * 1e18
                                ).toString()
                              )
                            }
                            min="0"
                            step="0.001"
                            className={`w-full px-3 py-2.5 md:py-2 text-base border rounded-[1.5rem] focus:ring-2 focus:ring-primary/40 focus:border-primary/50 touch-manipulation ${
                              errors[`ticketType${index}Price`]
                                ? "border-destructive/60"
                                : "border-border/60"
                            }`}
                            placeholder="10"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Price in PC (Push Chain tokens). Users can pay with
                            any supported currency.
                          </p>
                          {errors[`ticketType${index}Price`] && (
                            <p className="text-destructive text-sm mt-1">
                              {errors[`ticketType${index}Price`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs md:text-sm font-medium text-foreground/80 mb-1.5 md:mb-2">
                            Supply *
                          </label>
                          <input
                            type="number"
                            value={Number(ticketType.supply)}
                            onChange={(e) =>
                              handleTicketTypeChange(
                                index,
                                "supply",
                                e.target.value
                              )
                            }
                            min="1"
                            className={`w-full px-3 py-2.5 md:py-2 text-base border rounded-[1.5rem] focus:ring-2 focus:ring-primary/40 focus:border-primary/50 touch-manipulation ${
                              errors[`ticketType${index}Supply`]
                                ? "border-destructive/60"
                                : "border-border/60"
                            }`}
                            placeholder="100"
                          />
                          {errors[`ticketType${index}Supply`] && (
                            <p className="text-destructive text-sm mt-1">
                              {errors[`ticketType${index}Supply`]}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Ticket Tier Image Upload */}
                      <div className="mt-4 md:col-span-3">
                        <ImageUpload
                          label="Ticket Tier Image"
                          imagePreview={ticketType.imagePreview}
                          onImageChange={(file) =>
                            handleTicketTypeImageChange(index, file)
                          }
                          onImageRemove={() =>
                            handleTicketTypeImageRemove(index)
                          }
                          error={errors[`ticketType${index}Image`]}
                          required
                          helpText="Upload a unique image for this ticket tier. This will be the NFT image for purchasers. PNG, JPG, GIF up to 5MB"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/events")}
              className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-muted-foreground transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCreatingEvent}
              className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary sm:w-auto"
            >
              {isSubmitting || isCreatingEvent ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Event...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Create Event</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
