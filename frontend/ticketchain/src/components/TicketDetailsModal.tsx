import { useState, useEffect } from "react";
import { ExternalLink, Image as ImageIcon, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useReadContract } from "wagmi";
import {
  TICKET_NFT_ADDRESS,
  TicketNFTABI,
  TICKET_FACTORY_ADDRESS,
  TicketFactoryABI,
} from "../lib/contracts";
import { formatPrice, formatAddress } from "../lib/formatters";
import type { TicketType } from "../types";

interface TicketMetadata {
  eventId: bigint;
  ticketTypeId: bigint;
  originalOwner: string;
  purchasePrice: bigint;
  purchaseChain: string;
  used: boolean;
  qrCodeHash: string;
}

// Type for the raw tuple returned from the contract
type TicketMetadataTuple = readonly [
  bigint,
  bigint,
  string,
  bigint,
  string,
  boolean,
  string
];

interface TicketDetailsModalProps {
  tokenId: number;
  onClose: () => void;
}

/**
 * TicketDetailsModal - Shows detailed ticket information
 */
export function TicketDetailsModal({
  tokenId,
  onClose,
}: TicketDetailsModalProps) {
  // Fetch ticket metadata from contract
  const { data: ticketData } = useReadContract({
    address: TICKET_NFT_ADDRESS as `0x${string}`,
    abi: TicketNFTABI,
    functionName: "ticketDetails",
    args: [BigInt(tokenId)],
  });

  // Fetch token URI for image
  const { data: tokenURI } = useReadContract({
    address: TICKET_NFT_ADDRESS as `0x${string}`,
    abi: TicketNFTABI,
    functionName: "tokenURI",
    args: [BigInt(tokenId)],
  });

  console.log("[TicketDetailsModal] Token ID:", tokenId);
  console.log("[TicketDetailsModal] Raw ticket data:", ticketData);
  console.log("[TicketDetailsModal] Token URI:", tokenURI);

  // Parse metadata first to get eventId
  const metadata = ticketData
    ? ({
        eventId: (ticketData as TicketMetadataTuple)[0],
        ticketTypeId: (ticketData as TicketMetadataTuple)[1],
        originalOwner: (ticketData as TicketMetadataTuple)[2],
        purchasePrice: (ticketData as TicketMetadataTuple)[3],
        purchaseChain: (ticketData as TicketMetadataTuple)[4],
        used: (ticketData as TicketMetadataTuple)[5],
        qrCodeHash: (ticketData as TicketMetadataTuple)[6],
      } as TicketMetadata)
    : undefined;

  // Fetch ticket types for the event to get the ticket type name
  const { data: ticketTypesData } = useReadContract({
    address: TICKET_FACTORY_ADDRESS as `0x${string}`,
    abi: TicketFactoryABI,
    functionName: "getTicketTypes",
    args: metadata ? [metadata.eventId] : undefined,
    query: {
      enabled: !!metadata?.eventId,
    },
  });

  const ticketTypes = ticketTypesData as TicketType[] | undefined;
  // ticketTypeId is the array index in the contract
  const ticketType =
    ticketTypes && metadata?.ticketTypeId !== undefined
      ? ticketTypes[Number(metadata.ticketTypeId)]
      : undefined;

  console.log("[TicketDetailsModal] Parsed metadata:", metadata);
  console.log("[TicketDetailsModal] Ticket Types:", ticketTypes);
  console.log("[TicketDetailsModal] Ticket Type ID:", metadata?.ticketTypeId);
  console.log("[TicketDetailsModal] Selected Ticket Type:", ticketType);

  const [showImage, setShowImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Parse token URI to get image
  useEffect(() => {
    if (tokenURI && typeof tokenURI === "string") {
      // If it's an IPFS URI, convert to HTTP gateway
      if (tokenURI.startsWith("ipfs://")) {
        const ipfsHash = tokenURI.replace("ipfs://", "");
        setImageUrl(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
      } else {
        setImageUrl(tokenURI);
      }
    }
  }, [tokenURI]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Ticket #{tokenId}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {metadata && metadata.eventId !== undefined ? (
            <div className="space-y-4">
              {/* NFT Image Toggle */}
              {imageUrl && (
                <div className="border-b pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => setShowImage(!showImage)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <ImageIcon className="w-5 h-5" />
                      {showImage ? "Hide NFT Image" : "View NFT Image"}
                    </button>

                    {showImage && (
                      <a
                        href={imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open Full Size
                      </a>
                    )}
                  </div>

                  {showImage && (
                    <div className="rounded-lg overflow-hidden border-2 border-gray-200">
                      <a
                        href={imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <img
                          src={imageUrl}
                          alt={`Ticket #${tokenId} NFT`}
                          className="w-full h-auto"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder-event.jpg";
                          }}
                        />
                      </a>
                      <div className="bg-gray-50 px-3 py-2 text-xs text-gray-600 border-t">
                        Click image to view in full size
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Ticket Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <p className="text-sm text-gray-600 mb-2">Event</p>
                  <Link
                    to={`/events/${metadata.eventId.toString()}`}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                  >
                    Event #{metadata.eventId.toString()}
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>

                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Ticket Type</p>
                  <p className="font-semibold text-lg">
                    {ticketType?.name ||
                      `Type #${metadata.ticketTypeId.toString()}`}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">
                    Original Purchase Price
                  </p>
                  <p className="font-semibold">
                    {formatPrice(metadata.purchasePrice)} PC
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Purchase Chain</p>
                  <p className="font-semibold">
                    {metadata.purchaseChain || "Push Chain"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p
                    className={`font-semibold ${
                      metadata.used ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {metadata.used ? "Used" : "Valid"}
                  </p>
                </div>
              </div>

              {/* Original Owner */}
              {metadata.originalOwner &&
                metadata.originalOwner !==
                  "0x0000000000000000000000000000000000000000" && (
                  <div className="border-t pt-4">
                    <div className="flex items-start gap-2">
                      <User className="w-5 h-5 text-gray-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Original Owner
                        </p>
                        <p className="font-mono text-sm break-all">
                          {formatAddress(metadata.originalOwner)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          This is the first person who purchased this ticket
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* Info Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> All ticket data is stored on-chain and
                  cannot be tampered with. The NFT image and metadata are stored
                  on IPFS for permanent availability.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading ticket details...</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
