import { useState, useEffect } from "react";
import { ExternalLink, Image as ImageIcon } from "lucide-react";
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

export function TicketDetailsModal({
  tokenId,
  onClose,
}: TicketDetailsModalProps) {
  const { data: ticketData } = useReadContract({
    address: TICKET_NFT_ADDRESS as `0x${string}`,
    abi: TicketNFTABI,
    functionName: "ticketDetails",
    args: [BigInt(tokenId)],
  });

  const { data: tokenURI } = useReadContract({
    address: TICKET_NFT_ADDRESS as `0x${string}`,
    abi: TicketNFTABI,
    functionName: "tokenURI",
    args: [BigInt(tokenId)],
  });

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
  const ticketType =
    ticketTypes && metadata?.ticketTypeId !== undefined
      ? ticketTypes[Number(metadata.ticketTypeId)]
      : undefined;

  const [showImage, setShowImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (tokenURI && typeof tokenURI === "string") {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-card max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-border/70 bg-card/90 p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">
            Ticket #{tokenId}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full border border-border/60 p-1 text-muted-foreground transition hover:border-primary/40 hover:text-primary"
          >
            ×
          </button>
        </div>

        {metadata && metadata.eventId !== undefined ? (
          <div className="space-y-5">
            {imageUrl && (
              <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setShowImage(!showImage)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-accent"
                  >
                    <ImageIcon className="h-4 w-4" />
                    {showImage ? "Hide NFT Image" : "View NFT Image"}
                  </button>
                  {showImage && (
                    <a
                      href={imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition hover:text-accent"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Full Size
                    </a>
                  )}
                </div>

                {showImage && (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-border/60">
                    <a
                      href={imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block transition hover:opacity-90"
                    >
                      <img
                        src={imageUrl}
                        alt={`Ticket #${tokenId} NFT`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder-event.jpg";
                        }}
                      />
                    </a>
                    <div className="border-t border-border/60 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                      Click image to view in full size
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Event
                </p>
                <Link
                  to={`/events/${metadata.eventId.toString()}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-accent"
                >
                  Event #{metadata.eventId.toString()}
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>

              <DetailRow label="Ticket Type ID" value={`#${metadata.ticketTypeId.toString()}`} />
              <DetailRow
                label="Purchase Price"
                value={`${formatPrice(metadata.purchasePrice)} PC`}
              />
              <DetailRow
                label="Original Owner"
                value={formatAddress(metadata.originalOwner)}
                mono
              />
              <DetailRow label="Purchase Chain" value={metadata.purchaseChain} />
              <DetailRow
                label="Usage Status"
                value={metadata.used ? "Used" : "Not Used"}
                valueClass={metadata.used ? "text-destructive" : "text-primary"}
              />
              <DetailRow
                label="Ticket Type"
                value={ticketType ? ticketType.name : "Not available"}
              />
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                QR Code Hash
              </p>
              <p className="mt-2 break-words font-mono text-xs text-foreground/80">
                {metadata.qrCodeHash}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-6 text-center text-sm text-muted-foreground">
            Ticket metadata could not be loaded.
          </div>
        )}

        {tokenURI && typeof tokenURI === "string" && (
          <div className="mt-6 border-t border-border/60 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Token URI
            </p>
            <a
              href={
                tokenURI.startsWith("ipfs://")
                  ? tokenURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")
                  : tokenURI
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-primary transition hover:text-accent"
            >
              {tokenURI}
            </a>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  valueClass,
  mono,
}: {
  label: string;
  value: string;
  valueClass?: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={
          mono
            ? `font-mono text-xs text-foreground ${valueClass ?? ""}`
            : `text-sm font-semibold text-foreground ${valueClass ?? ""}`
        }
      >
        {value}
      </p>
    </div>
  );
}
