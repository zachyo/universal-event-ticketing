import { useState, useEffect } from "react";
import QRCode from "qrcode";

export interface QRCodeData {
  tokenId: bigint;
  eventId: bigint;
  owner: string;
  contractAddress: string;
  chainId: number;
  timestamp: number;
}

export function useQRCode(data: QRCodeData | null) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!data) {
      setQrCodeUrl("");
      return;
    }

    const generateQRCode = async () => {
      setIsGenerating(true);
      setError(null);

      try {
        // Create a JSON string with all ticket data
        const qrData = JSON.stringify({
          tokenId: data.tokenId.toString(),
          eventId: data.eventId.toString(),
          owner: data.owner,
          contract: data.contractAddress,
          chainId: data.chainId,
          timestamp: data.timestamp,
          // Add a verification signature to prevent tampering
          signature: generateSimpleHash(data),
        });

        console.log("Generating QR Code with data:", {
          tokenId: data.tokenId.toString(),
          eventId: data.eventId.toString(),
          owner: data.owner,
          ownerType: typeof data.owner,
          ownerLength: data.owner?.length,
        });

        // Generate QR code as data URL
        const url = await QRCode.toDataURL(qrData, {
          width: 400,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
          errorCorrectionLevel: "H", // High error correction for better scanning
        });

        setQrCodeUrl(url);
      } catch (err) {
        console.error("QR Code generation error:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to generate QR code")
        );
      } finally {
        setIsGenerating(false);
      }
    };

    generateQRCode();
  }, [data]);

  const downloadQRCode = (filename?: string) => {
    if (!qrCodeUrl) return;

    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = filename || `ticket-${data?.tokenId.toString()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    qrCodeUrl,
    isGenerating,
    error,
    downloadQRCode,
  };
}

// Simple hash function for verification (in production, use proper cryptographic signing)
function generateSimpleHash(data: QRCodeData): string {
  const str = `${data.tokenId}-${data.eventId}-${data.owner}-${data.contractAddress}-${data.chainId}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

export function verifyQRCodeData(qrDataString: string): {
  isValid: boolean;
  data?: QRCodeData;
  error?: string;
} {
  try {
    const parsed = JSON.parse(qrDataString);

    // Reconstruct data object
    const data: QRCodeData = {
      tokenId: BigInt(parsed.tokenId),
      eventId: BigInt(parsed.eventId),
      owner: parsed.owner,
      contractAddress: parsed.contract,
      chainId: parsed.chainId,
      timestamp: parsed.timestamp,
    };

    // Verify signature
    const expectedHash = generateSimpleHash(data);
    if (parsed.signature !== expectedHash) {
      return {
        isValid: false,
        error: "Invalid signature - QR code may have been tampered with",
      };
    }

    // Check if timestamp is not too old (e.g., QR code generated more than 24 hours ago)
    const age = Date.now() - data.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (age > maxAge) {
      return {
        isValid: false,
        data,
        error: "QR code is expired (older than 24 hours)",
      };
    }

    return {
      isValid: true,
      data,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Invalid QR code format",
    };
  }
}
