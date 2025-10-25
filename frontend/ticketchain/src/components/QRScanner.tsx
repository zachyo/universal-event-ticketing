import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, CheckCircle, XCircle } from "lucide-react";

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function QRScanner({ onScan, onError, className = "" }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = "qr-reader";

  const startScanning = async () => {
    try {
      setScanError(null);

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrRegionId);
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await scannerRef.current.start(
        { facingMode: "environment" }, // Use back camera
        config,
        (decodedText) => {
          // Success callback
          setScanSuccess(true);
          onScan(decodedText);

          // Auto-stop after successful scan
          setTimeout(() => {
            stopScanning();
            setScanSuccess(false);
          }, 1500);
        },
        (errorMessage) => {
          // Error callback (can be ignored for continuous scanning)
          // Only log significant errors
          if (!errorMessage.includes("NotFoundException")) {
            console.debug("QR Scan error:", errorMessage);
          }
        }
      );

      setIsScanning(true);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to start camera";
      setScanError(errorMsg);
      if (onError) onError(errorMsg);
      console.error("Error starting QR scanner:", err);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        // Ignore "scanner is not running" errors
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (!errorMessage.includes('scanner is not running') && 
            !errorMessage.includes('not running or paused')) {
          console.error("Error stopping QR scanner:", err);
        }
        // Always set scanning to false even if stop fails
        setIsScanning(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        try {
          // Only try to stop if we think it's running
          if (isScanning) {
            scannerRef.current.stop().catch((err) => {
              // Ignore "scanner is not running" errors during cleanup
              const errorMessage = err instanceof Error ? err.message : String(err);
              if (!errorMessage.includes('scanner is not running') && 
                  !errorMessage.includes('not running or paused')) {
                console.error("Error stopping QR scanner during cleanup:", err);
              }
            });
          }
          // Always clear the scanner
          scannerRef.current.clear();
        } catch (err) {
          // Ignore cleanup errors
          console.log("Scanner cleanup completed");
        }
      }
    };
  }, [isScanning]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative w-full max-w-md">
        {/* Scanner Container */}
        <div
          id={qrRegionId}
          className={`rounded-lg overflow-hidden ${
            isScanning ? "border-4 border-primary" : "border-2 border-gray-300"
          }`}
        />

        {/* Success Overlay */}
        {scanSuccess && (
          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center rounded-lg">
            <div className="bg-white rounded-full p-4 shadow-lg">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
        )}

        {/* Error Message */}
        {scanError && (
          <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white p-3 text-sm">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              {scanError}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-6 flex gap-4">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2 transition-colors"
          >
            <Camera className="w-5 h-5" />
            Start Scanning
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors"
          >
            <CameraOff className="w-5 h-5" />
            Stop Scanning
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-sm text-gray-600 max-w-md">
        <p>
          {isScanning
            ? "Point your camera at a ticket QR code to scan"
            : 'Click "Start Scanning" to begin verifying tickets'}
        </p>
      </div>
    </div>
  );
}
