import { Download, QrCode as QrCodeIcon, RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { useQRCode, type QRCodeData } from "../hooks/useQRCode";
import { TICKET_NFT_ADDRESS } from "../lib/contracts";

interface QRCodeDisplayProps {
  tokenId: bigint;
  eventId: bigint;
  owner: string;
  showDownload?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function QRCodeDisplay({
  tokenId,
  eventId,
  owner,
  showDownload = true,
  size = "md",
  className = "",
}: QRCodeDisplayProps) {
  // Memoize qrData to prevent infinite re-renders
  // Only recreate when tokenId, eventId, or owner changes
  const qrData: QRCodeData = useMemo(
    () => ({
      tokenId,
      eventId,
      owner,
      contractAddress: TICKET_NFT_ADDRESS as string,
      chainId: 42101, // Push Chain Testnet
      timestamp: Date.now(),
    }),
    [tokenId, eventId, owner]
  );

  const { qrCodeUrl, isGenerating, error, downloadQRCode } = useQRCode(qrData);

  const sizeClasses = {
    sm: "w-32 h-32",
    md: "w-48 h-48",
    lg: "w-64 h-64",
  };

  if (isGenerating) {
    return (
      <div
        className={`flex flex-col items-center justify-center ${sizeClasses[size]} bg-gray-100 rounded-lg ${className}`}
      >
        <RefreshCw className="w-12 h-12 text-gray-400 animate-spin" />
        <p className="text-sm text-gray-500 mt-2">Generating QR Code...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex flex-col items-center justify-center ${sizeClasses[size]} bg-red-50 border-2 border-red-200 rounded-lg ${className}`}
      >
        <QrCodeIcon className="w-12 h-12 text-red-400" />
        <p className="text-sm text-red-600 mt-2 text-center px-4">
          {error.message || "Failed to generate QR code"}
        </p>
      </div>
    );
  }

  if (!qrCodeUrl) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        className={`${sizeClasses[size]} bg-white p-4 rounded-lg shadow-md border-2 border-gray-200`}
      >
        <img
          src={qrCodeUrl}
          alt="Ticket QR Code"
          className="w-full h-full object-contain"
        />
      </div>

      {showDownload && (
        <button
          onClick={() => downloadQRCode(`ticket-${tokenId.toString()}.png`)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download QR Code
        </button>
      )}

      <div className="mt-3 text-center">
        <p className="text-xs text-gray-600 font-medium">
          Ticket #{tokenId.toString()}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Event #{eventId.toString()}
        </p>
        <p className="text-xs text-gray-400 mt-1">Scan to verify ownership</p>
      </div>
    </div>
  );
}
