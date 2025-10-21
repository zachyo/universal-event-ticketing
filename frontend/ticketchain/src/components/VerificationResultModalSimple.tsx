import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface VerificationResultModalSimpleProps {
  isOpen: boolean;
  onClose: () => void;
  status: "success" | "error" | "warning";
  message: string;
}

export function VerificationResultModalSimple({
  isOpen,
  onClose,
  status,
  message,
}: VerificationResultModalSimpleProps) {
  if (!isOpen) return null;

  console.log("Simple Modal Rendering:", { isOpen, status, message });

  const Icon =
    status === "success"
      ? CheckCircle2
      : status === "error"
      ? XCircle
      : AlertCircle;
  const color =
    status === "success" ? "green" : status === "error" ? "red" : "yellow";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-8">
        <div className="text-center">
          <Icon className={`w-16 h-16 text-${color}-600 mx-auto mb-4`} />
          <h2 className={`text-2xl font-bold text-${color}-700 mb-4`}>
            {message}
          </h2>
          <p className="text-gray-600 mb-6">Status: {status}</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
