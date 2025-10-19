import { Upload, X } from "lucide-react";

interface ImageUploadProps {
  label: string;
  imagePreview: string | null | undefined;
  onImageChange: (file: File) => void;
  onImageRemove: () => void;
  error?: string;
  required?: boolean;
  helpText?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  label,
  imagePreview,
  onImageChange,
  onImageRemove,
  error,
  required = false,
  helpText = "PNG, JPG, GIF up to 5MB",
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center relative transition-colors ${
          error
            ? "border-red-300 bg-red-50"
            : imagePreview
            ? "border-green-300 bg-green-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        {imagePreview ? (
          <div className="space-y-2">
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-32 mx-auto rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={onImageRemove}
                className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-lg transition-colors"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-green-700 font-medium">Image uploaded</p>
          </div>
        ) : (
          <div>
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-gray-500 text-xs">{helpText}</p>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImageChange(file);
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label={label}
        />
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-1 flex items-center">
          <span className="inline-block w-1 h-1 bg-red-500 rounded-full mr-2"></span>
          {error}
        </p>
      )}
    </div>
  );
};
