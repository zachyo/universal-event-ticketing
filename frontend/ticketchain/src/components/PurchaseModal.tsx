import { useState } from "react";
import { X, CreditCard, Loader2 } from "lucide-react";
import type { FormattedEvent, TicketType } from "../types";
import { formatPrice, formatDateTime } from "../lib/formatters";
import { convertPCToNative } from "../lib/contracts";
import { usePurchaseTicket } from "../hooks/useContracts";
import { usePushWalletContext, usePushChainClient } from "@pushchain/ui-kit";
import {
  debugTicketType,
  validateTicketType,
  validatePurchaseParams,
} from "../utils/debug";
import { SUPPORTED_CHAINS, getChainById, DEFAULT_CHAIN } from "../types/chains";
import { PCTokenExplainer } from "./PCTokenExplainer";

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: FormattedEvent;
  ticketTypes: TicketType[];
}

export function PurchaseModal({
  isOpen,
  onClose,
  event,
  ticketTypes,
}: PurchaseModalProps) {
  const [selectedTicketType, setSelectedTicketType] =
    useState<TicketType | null>(null);
  const [selectedChain, setSelectedChain] = useState(DEFAULT_CHAIN);
  const [quantity, setQuantity] = useState(1);

  const { purchaseTicket, isPending } = usePurchaseTicket();
  const { connectionStatus } = usePushWalletContext();
  const { pushChainClient } = usePushChainClient();

  const originChain = pushChainClient?.universal.origin.chain;
  const chainMismatch = Boolean(
    originChain && selectedChain && originChain !== selectedChain
  );

  // Debug ticket types received
  // console.log("PurchaseModal received ticket types:", ticketTypes);
  ticketTypes?.forEach((tt, i) => debugTicketType(tt, i));

  const handlePurchase = async () => {
    if (!selectedTicketType || connectionStatus !== "connected") return;
    if (chainMismatch) {
      alert(
        "Please switch the Push Universal Wallet to the payment chain you selected before purchasing."
      );
      return;
    }

    // Validate ticket type data using debug utility
    const validation = validateTicketType(selectedTicketType);
    if (!validation.valid) {
      console.error("Invalid ticket type:", validation.errors);
      alert(`Invalid ticket type: ${validation.errors.join(", ")}`);
      return;
    }

    const purchaseParams = {
      eventId: BigInt(event.eventId),
      ticketTypeId: selectedTicketType.ticketTypeId,
      price: selectedTicketType.price,
      quantity,
      chain: selectedChain,
    };

    // Validate purchase params
    const paramValidation = validatePurchaseParams(purchaseParams);
    if (!paramValidation.valid) {
      console.error("Invalid purchase params:", paramValidation.errors);
      alert(
        `Invalid purchase parameters: ${paramValidation.errors.join(", ")}`
      );
      return;
    }

    // Enhanced debugging
    // debugPurchaseParams(purchaseParams);

    try {
      await purchaseTicket(purchaseParams);

      // Close modal on success
      onClose();
    } catch (error) {
      console.error("Purchase failed:", error);
      // Enhanced error logging
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        alert(`Purchase failed: ${error.message}`);
      }
      // Handle error (show toast, etc.)
    }
  };

  const totalPrice = selectedTicketType
    ? selectedTicketType.price * BigInt(quantity)
    : BigInt(0);
  const isAvailable = selectedTicketType
    ? selectedTicketType.sold < selectedTicketType.supply
    : false;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg md:text-xl font-bold">Purchase Tickets</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Event Info */}
        <div className="p-4 md:p-6 border-b">
          <h3 className="font-bold text-base md:text-lg mb-2">{event.name}</h3>
          <p className="text-gray-600 text-sm mb-2">
            {formatDateTime(event.startTime)}
          </p>
          <p className="text-gray-600 text-sm">{event.venue}</p>
        </div>

        {/* Ticket Type Selection */}
        <div className="p-4 md:p-6 border-b">
          <h4 className="font-medium mb-4 text-sm md:text-base">
            Select Ticket Type
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {" "}
            {ticketTypes.map((ticketType, i) => {
              const available =
                Number(ticketType.supply) - Number(ticketType.sold);
              // Use a more reliable selection comparison
              const isSelected =
                selectedTicketType?.ticketTypeId === ticketType.ticketTypeId;

              return (
                <div
                  key={`${ticketType.ticketTypeId?.toString()}-${i}`}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-gray-200 hover:border-gray-300"
                  } ${available === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => {
                    if (available > 0) {
                      console.log("Selecting ticket type:");
                      debugTicketType(ticketType, i);

                      // Validate before selecting
                      const validation = validateTicketType(ticketType);
                      if (!validation.valid) {
                        console.error(
                          "Cannot select invalid ticket type:",
                          validation.errors
                        );
                        alert(
                          `Cannot select this ticket type: ${validation.errors.join(
                            ", "
                          )}`
                        );
                        return;
                      }

                      // Don't override ticketTypeId - use the one from the hook
                      setSelectedTicketType(ticketType);
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium">{ticketType.name}</h5>
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">
                          {formatPrice(ticketType.price)} PC
                        </p>
                        <p className="text-xs">
                          ≈{" "}
                          {formatPrice(
                            convertPCToNative(
                              ticketType.price,
                              getChainById(selectedChain)?.symbol || "ETH"
                            )
                          )}{" "}
                          {getChainById(selectedChain)?.symbol || "ETH"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {available} available
                      </p>
                      {available === 0 && (
                        <p className="text-xs text-red-600 font-medium">
                          Sold Out
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quantity Selection */}
        {selectedTicketType && isAvailable && (
          <div className="p-4 md:p-6 border-b">
            <h4 className="font-medium mb-4 text-sm md:text-base">Quantity</h4>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 md:w-8 md:h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-lg md:text-base font-medium"
                disabled={quantity <= 1}
              >
                -
              </button>
              <span className="font-medium text-lg md:text-base min-w-[2rem] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(5, quantity + 1))} // Max 5 tickets
                className="w-10 h-10 md:w-8 md:h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-lg md:text-base font-medium"
                disabled={
                  quantity >=
                  Number(selectedTicketType?.supply ?? event?.totalSupply)
                }
              >
                +
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Maximum {selectedTicketType?.supply ?? event?.totalSupply} tickets
              per purchase
            </p>
          </div>
        )}

        {/* Chain Selection */}
        {selectedTicketType && isAvailable && (
          <div className="p-4 md:p-6 border-b">
            <h4 className="font-medium mb-4 text-sm md:text-base">
              Payment Chain
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Choose which blockchain to pay from. Push Chain will automatically
              convert your payment to the required amount.
            </p>

            {/* Testnet Chains */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">
                Testnet Chains
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {" "}
                {SUPPORTED_CHAINS.filter((chain) => chain.testnet)
                  .slice(0, 6)
                  .map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => setSelectedChain(chain.id)}
                      className={`p-2 rounded border text-left transition-colors text-xs ${
                        selectedChain === chain.id
                          ? "border-primary bg-primary/10"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-medium">{chain.name}</div>
                      <div className="text-gray-600">{chain.symbol}</div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Selected Chain Info */}
            {selectedChain && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm">
                  <span className="font-medium">Selected: </span>
                  {getChainById(selectedChain)?.name} (
                  {getChainById(selectedChain)?.symbol})
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Push Chain will automatically convert your{" "}
                  {getChainById(selectedChain)?.symbol} payment to the required
                  amount.
                </div>
                {chainMismatch && originChain && (
                  <div className="mt-3 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-xs text-yellow-900">
                    <p className="font-medium">Chain mismatch detected</p>
                    <p>
                      Your wallet is currently set to {originChain}. Open the
                      Push wallet modal and switch to {selectedChain} before
                      confirming this purchase, otherwise the transaction will
                      fail.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Total and Purchase */}
        <div className="p-4 md:p-6 sticky bottom-0 bg-white border-t md:border-t-0">
          {selectedTicketType && isAvailable ? (
            <>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm md:text-base">
                    Total (PC):
                  </span>
                  <span className="text-lg md:text-xl font-bold">
                    {formatPrice(totalPrice)} PC
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>You'll pay approximately:</span>
                  <span className="font-medium">
                    {formatPrice(
                      convertPCToNative(
                        totalPrice,
                        getChainById(selectedChain)?.symbol || "ETH"
                      )
                    )}{" "}
                    {getChainById(selectedChain)?.symbol || "ETH"}
                  </span>
                </div>
              </div>
              <PCTokenExplainer
                pcPrice={totalPrice}
                estimatedNativePrice={convertPCToNative(
                  totalPrice,
                  getChainById(selectedChain)?.symbol || "ETH"
                )}
                nativeCurrency={getChainById(selectedChain)?.symbol || "ETH"}
              />

              {connectionStatus === "connected" ? (
                <button
                  onClick={handlePurchase}
                  disabled={isPending || chainMismatch}
                  className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-400 text-white py-3.5 md:py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-base md:text-sm touch-manipulation"
                >
                  {" "}
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Purchase Tickets
                    </>
                  )}
                </button>
              ) : (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Connect your wallet to purchase tickets
                  </p>
                  <button className="text-primary hover:text-primary/80 font-medium">
                    Connect Wallet
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-600">
              {!selectedTicketType
                ? "Select a ticket type to continue"
                : "This ticket type is sold out"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
