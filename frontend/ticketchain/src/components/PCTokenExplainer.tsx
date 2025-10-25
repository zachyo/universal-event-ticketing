import { Info, ArrowRight } from "lucide-react";

interface PCTokenExplainerProps {
  pcPrice: bigint;
  estimatedNativePrice: bigint;
  nativeCurrency: string;
}

export const PCTokenExplainer = ({
  pcPrice,
  estimatedNativePrice,
  nativeCurrency,
}: PCTokenExplainerProps) => {
  return (
    <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 p-4">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="mb-2 font-medium text-primary">
            How Push Chain Universal Payments Work
          </h4>

          <div className="space-y-3 text-sm">
            {/* Step 1 */}
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                1
              </div>
              <span className="text-gray-700">
                Ticket is priced at{" "}
                <span className="font-medium">
                  {(Number(pcPrice) / 1e18).toFixed(2)} PC
                </span>{" "}
                tokens
              </span>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                2
              </div>
              <span className="text-gray-700">
                You pay approximately{" "}
                <span className="font-medium">
                  {(Number(estimatedNativePrice) / 1e18).toFixed(6)}{" "}
                  {nativeCurrency}
                </span>{" "}
                from your wallet
              </span>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>

            {/* Step 3 */}
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                3
              </div>
              <span className="text-gray-700">
                Push Chain automatically converts your {nativeCurrency} to PC
                tokens
              </span>
            </div>

            {/* Benefits */}
            <div className="mt-4 rounded border border-primary/25 bg-white p-3">
              <p className="mb-1 font-medium text-primary">Benefits:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Pay with any supported cryptocurrency</li>
                <li>• No manual token swapping required</li>
                <li>• Real-time exchange rates</li>
                <li>• Seamless cross-chain experience</li>
              </ul>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-gray-500 italic">
              * Final conversion rate determined at transaction time. Estimated
              amounts may vary slightly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
