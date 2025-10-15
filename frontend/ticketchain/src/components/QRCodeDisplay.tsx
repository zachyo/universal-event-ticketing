import { QRCodeSVG } from 'qrcode.react';
import { generateQRCodeData } from '../lib/formatters';

interface QRCodeDisplayProps {
  tokenId: number;
  eventId: number;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  includeMargin?: boolean;
}

export function QRCodeDisplay({ 
  tokenId, 
  eventId, 
  size = 256, 
  level = 'H',
  includeMargin = true 
}: QRCodeDisplayProps) {
  const qrData = generateQRCodeData(tokenId, eventId);

  return (
    <div className="flex flex-col items-center">
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <QRCodeSVG
          value={qrData}
          size={size}
          level={level}
          includeMargin={includeMargin}
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>
      <div className="mt-2 text-xs text-gray-500 text-center">
        <p>Token ID: {tokenId}</p>
        <p>Event ID: {eventId}</p>
      </div>
    </div>
  );
}
