import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Upload,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  useCreateEvent,
  useAddTicketType,
  useEventCounter,
} from "../hooks/useContracts";
import { usePushWalletContext } from "@pushchain/ui-kit";
import { validateFileForUpload, compressImage } from "../lib/ipfs";
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
  const { addTicketType, isPending: isAddingTicketType } = useAddTicketType();
  const { eventCounter } = useEventCounter();

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
    { name: "General Admission", price: BigInt(0), supply: BigInt(0) },
  ]);

  const [errors, setErrors] = useState<FormErrors>({});
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      { name: "", price: BigInt(0), supply: BigInt(0) },
    ]);
  };

  const removeTicketType = (index: number) => {
    if (ticketTypes.length > 1) {
      setTicketTypes((prev) => prev.filter((_, i) => i !== index));
    }
  };

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

      // Create event
      const eventData = {
        name: formData.name,
        description: formData.description,
        startTime,
        endTime,
        venue: formData.venue,
        image: formData.image,
        totalSupply: BigInt(formData.totalSupply),
        royaltyBps: BigInt(formData.royaltyBps),
      };

      await createEvent(eventData);

      // Determine new event ID based on current event counter
      const newEventId = (eventCounter || 0) + 1;

      // Add all defined ticket types to the newly created event
      for (const tt of ticketTypes) {
        await addTicketType(newEventId, tt);
      }
    } catch (error) {
      console.error("Failed to create event:", error);
      alert("Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);

      // Navigate to events page on success
      navigate("/events");
    }
  };

  if (connectionStatus !== "connected") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-600 mb-6">
            You need to connect your wallet to create events on TicketChain.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Create a New Event
          </h1>
          <p className="text-gray-600">
            Fill out the form below to create your event on TicketChain.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter event name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.description ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Describe your event"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.description}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Venue *
                </label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.venue ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Event venue or location"
                />
                {errors.venue && (
                  <p className="text-red-500 text-sm mt-1">{errors.venue}</p>
                )}
              </div>
            </div>
          </div>

          {/* Date and Time */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-2 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Event Schedule
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Set when the event opens and when it ends so attendees know your
              full schedule.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  Event Start
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Choose the date and time when attendees can start checking in
                  or entering the venue.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.startDate ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.startDate && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.startDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.startTime ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.startTime && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.startTime}
                  </p>
                )}
              </div>

              <div className="md:col-span-2 mt-2">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  Event End
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Specify when the event finishes so the ticket automatically
                  closes after this time.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.endDate ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.endDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time *
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.endTime ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.endTime && (
                  <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>
                )}
              </div>
            </div>
          </div>

          {/* Event Image */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6">Event Image</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Event Image *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center relative">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview}
                        alt="Event preview"
                        className="max-h-48 mx-auto rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview("");
                          setFormData((prev) => ({ ...prev, image: null }));
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-gray-500 text-sm">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                {errors.image && (
                  <p className="text-red-500 text-sm mt-1">{errors.image}</p>
                )}
              </div>
            </div>
          </div>

          {/* Ticket Configuration */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6">Ticket Configuration</h2>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Supply *
                  </label>
                  <input
                    type="number"
                    name="totalSupply"
                    value={formData.totalSupply}
                    onChange={handleInputChange}
                    min="1"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.totalSupply ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Total number of tickets"
                  />
                  {errors.totalSupply && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.totalSupply}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2.5"
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Percentage you'll earn from secondary sales
                  </p>
                </div>
              </div>

              {/* Ticket Types */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Ticket Types</h3>
                  <button
                    type="button"
                    onClick={addTicketTypeField}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Ticket Type
                  </button>
                </div>

                <div className="space-y-4">
                  {ticketTypes.map((ticketType, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Ticket Type {index + 1}</h4>
                        {ticketTypes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTicketType(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
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
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors[`ticketType${index}Name`]
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                            placeholder="e.g., VIP, General"
                          />
                          {errors[`ticketType${index}Name`] && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors[`ticketType${index}Name`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
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
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors[`ticketType${index}Price`]
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                            placeholder="10"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Price in PC (Push Chain tokens). Users can pay with
                            any supported currency.
                          </p>
                          {errors[`ticketType${index}Price`] && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors[`ticketType${index}Price`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
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
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors[`ticketType${index}Supply`]
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                            placeholder="100"
                          />
                          {errors[`ticketType${index}Supply`] && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors[`ticketType${index}Supply`]}
                            </p>
                          )}
                        </div>
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
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCreatingEvent || isAddingTicketType}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {isSubmitting || isCreatingEvent || isAddingTicketType ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Event...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Create Event
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
