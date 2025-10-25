import { useEvent } from "../hooks/useContracts";
import { useMarketplaceListings } from "../hooks/useContracts";
import { useEventAnalytics } from "../hooks/useEventAnalytics";
import { useSimpleSecondarySales } from "../hooks/useSimpleSecondarySales";

interface DebugRoyaltyInfoProps {
  eventId: number;
}

export function DebugRoyaltyInfo({ eventId }: DebugRoyaltyInfoProps) {
  const { event, isLoading: eventLoading, error: eventError } = useEvent(eventId);
  const { listings, error: listingsError } = useMarketplaceListings();
  const { analytics, loading: analyticsLoading, error: analyticsError } = useEventAnalytics(eventId);
  const { analytics: secondarySalesData, loading: secondarySalesLoading, error: secondarySalesError } = useSimpleSecondarySales(eventId);

  // Debug information
  const debugInfo = {
    eventId,
    eventLoading,
    eventError,
    event: event ? {
      eventId: event.eventId?.toString(),
      organizer: event.organizer,
      royaltyBps: event.royaltyBps?.toString(),
      royaltyPercentage: event.royaltyBps ? Number(event.royaltyBps) / 100 : 0,
      sold: event.sold?.toString(),
      totalSupply: event.totalSupply?.toString()
    } : null,
    listingsError,
    totalListings: listings?.length || 0,
    eventListings: listings?.filter(() => {
      // We need to check if the listing is for this event
      // This is a simplified check - in reality we'd need to fetch ticket details
      return true; // For now, show all listings
    }) || [],
    analyticsLoading,
    analyticsError,
    analytics: analytics ? {
      secondarySales: analytics.secondarySales,
      secondaryVolume: analytics.secondaryVolume?.toString(),
      royaltyRevenue: analytics.royaltyRevenue?.toString(),
      royaltyPercentage: analytics.royaltyPercentage,
      avgRoyaltyPerSale: analytics.avgRoyaltyPerSale?.toString(),
      activeListings: analytics.activeListings
    } : null,
    // New secondary sales tracking
    secondarySalesLoading,
    secondarySalesError: secondarySalesError instanceof Error ? secondarySalesError.message : secondarySalesError,
    secondarySalesData: secondarySalesData ? {
      totalSales: secondarySalesData.totalSales,
      totalVolume: secondarySalesData.totalVolume?.toString(),
      totalRoyalties: secondarySalesData.totalRoyalties?.toString(),
      avgPrice: secondarySalesData.avgPrice?.toString(),
      avgRoyalty: secondarySalesData.avgRoyalty?.toString(),
      sales: secondarySalesData.sales.map(s => ({
        listingId: s.listingId.toString(),
        tokenId: s.tokenId.toString(),
        price: s.price.toString(),
        royaltyAmount: s.royaltyAmount.toString(),
        seller: s.seller
      }))
    } : null
  };

  console.log("🔍 Royalty Debug Info:", debugInfo);

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-md rounded-lg border border-blue-300 bg-blue-50 p-4 shadow-lg">
      <h3 className="mb-2 text-sm font-bold text-blue-800">🔍 Royalty Debug Info</h3>
      
      <div className="space-y-2 text-xs text-blue-700">
        <div><strong>Event ID:</strong> {eventId}</div>
        
        {/* Event Data */}
        <div className="border-t pt-2">
          <strong>Event Data:</strong>
          {eventLoading && <div>Loading event...</div>}
          {eventError && <div className="text-red-600">Error: {eventError.toString()}</div>}
          {event && (
            <div className="ml-2">
              <div>Organizer: {event.organizer}</div>
              <div>Royalty BPS: {event.royaltyBps?.toString() || "undefined"}</div>
              <div>Royalty %: {event.royaltyBps ? (Number(event.royaltyBps) / 100).toFixed(1) + "%" : "0%"}</div>
              <div>Sold: {event.sold?.toString()}</div>
              <div>Total Supply: {event.totalSupply?.toString()}</div>
            </div>
          )}
        </div>

        {/* Listings Data */}
        <div className="border-t pt-2">
          <strong>Marketplace Listings:</strong>
          <div>Loading listings...</div>
          {listingsError && <div className="text-red-600">Error: {listingsError.toString()}</div>}
          <div>Total Listings: {listings?.length || 0}</div>
          <div>Event Listings: {debugInfo.eventListings.length}</div>
          {listings && listings.length > 0 && (
            <div className="ml-2">
              <div>All listings:</div>
              {listings.map((listing, i) => (
                <div key={i} className="text-xs">
                  ID: {listing.listingId}, Token: {listing.tokenId}, Price: {listing.price?.toString()}, Active: {listing.active ? "Yes" : "No"}, Seller: {listing.seller}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Analytics Data */}
        <div className="border-t pt-2">
          <strong>Analytics Data:</strong>
          {analyticsLoading && <div>Loading analytics...</div>}
          {analyticsError && <div className="text-red-600">Error: {analyticsError.toString()}</div>}
          {analytics && (
            <div className="ml-2">
              <div>Secondary Sales: {analytics.secondarySales}</div>
              <div>Secondary Volume: {analytics.secondaryVolume?.toString() || "0"}</div>
              <div>Royalty Revenue: {analytics.royaltyRevenue?.toString() || "0"}</div>
              <div>Royalty %: {analytics.royaltyPercentage.toFixed(1)}%</div>
              <div>Avg Royalty/Sale: {analytics.avgRoyaltyPerSale?.toString() || "0"}</div>
              <div>Active Listings: {analytics.activeListings}</div>
            </div>
          )}
        </div>

        {/* Secondary Sales Tracking */}
        <div className="border-t pt-2">
          <strong>Secondary Sales Tracking:</strong>
          {secondarySalesLoading && <div>Loading secondary sales...</div>}
          {secondarySalesError && <div className="text-red-600">Error: {secondarySalesError instanceof Error ? secondarySalesError.message : String(secondarySalesError)}</div>}
          {secondarySalesData && (
            <div className="ml-2">
              <div className="text-green-700 font-bold">Total Sales: {secondarySalesData.totalSales}</div>
              <div>Total Volume: {secondarySalesData.totalVolume?.toString() || "0"}</div>
              <div className="text-green-700 font-bold">Total Royalties: {secondarySalesData.totalRoyalties?.toString() || "0"}</div>
              <div>Avg Price: {secondarySalesData.avgPrice?.toString() || "0"}</div>
              <div>Avg Royalty: {secondarySalesData.avgRoyalty?.toString() || "0"}</div>
              {secondarySalesData.sales.length > 0 && (
                <div>
                  <div className="font-bold mt-1">Sales Details:</div>
                  {secondarySalesData.sales.map((sale, i) => (
                    <div key={i} className="ml-2 text-xs border-l-2 border-green-400 pl-2 my-1">
                      <div>Listing ID: {sale.listingId?.toString()}</div>
                      <div>Token ID: {sale.tokenId?.toString()}</div>
                      <div>Price: {sale.price?.toString()}</div>
                      <div className="text-green-700 font-bold">Royalty: {sale.royaltyAmount?.toString()}</div>
                      <div>Seller: {sale.seller?.substring(0, 10)}...</div>
                      <div>Status: {sale.active ? "Active" : "Completed"}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Issues */}
        <div className="border-t pt-2">
          <strong>Potential Issues:</strong>
          <ul className="ml-2 list-disc">
            {!event && <li>Event data not loaded</li>}
            {event && !event.royaltyBps && <li>No royalty percentage set for event</li>}
            {event && event.royaltyBps && Number(event.royaltyBps) === 0 && <li>Royalty percentage is 0%</li>}
            {(!listings || listings.length === 0) && <li>No marketplace listings found</li>}
            {analytics && analytics.secondarySales === 0 && <li>No secondary sales detected</li>}
            {analytics && analytics.secondaryVolume === BigInt(0) && <li>No secondary market volume</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
