import type { ResellerAnalytics } from "../hooks/useResellerAnalytics";
import { formatPrice } from "./formatters";

export function exportResellerAnalyticsToCSV(
  analytics: ResellerAnalytics,
  eventName: string,
  sellerAddress: string
) {
  const { stats, activeListings, historicalListings } = analytics;

  // Summary data
  const summaryRows = [
    ["Reseller Analytics Report"],
    ["Event", eventName],
    ["Seller Address", sellerAddress],
    ["Generated", new Date().toLocaleString()],
    [""],
    ["SUMMARY STATISTICS"],
    ["Total Listed", stats.totalListed.toString()],
    ["Currently Listed", stats.currentlyListed.toString()],
    ["Total Sold", stats.totalSold.toString()],
    ["Total Canceled", stats.totalCanceled.toString()],
    [
      "Total Revenue",
      formatPrice(stats.totalRevenue) + " PC",
      Number(stats.totalRevenue) / 1e18 + " PC",
    ],
    [
      "Total Royalties Paid",
      formatPrice(stats.totalRoyaltiesPaid) + " PC",
      Number(stats.totalRoyaltiesPaid) / 1e18 + " PC",
    ],
    [
      "Net Revenue",
      formatPrice(analytics.netRevenue) + " PC",
      Number(analytics.netRevenue) / 1e18 + " PC",
    ],
    ["Profit Margin", analytics.profitMargin.toFixed(2) + "%"],
    ["Success Rate", analytics.listingSuccessRate.toFixed(2) + "%"],
    [
      "Average Sale Price",
      formatPrice(analytics.averageSalePrice) + " PC",
      Number(analytics.averageSalePrice) / 1e18 + " PC",
    ],
    [""],
    ["ACTIVE LISTINGS"],
    [
      "Listing ID",
      "Ticket ID",
      "Price (PC)",
      "Price (Wei)",
      "Listed Date",
      "Status",
    ],
  ];

  // Active listings
  activeListings.forEach((listing: any) => {
    summaryRows.push([
      listing.listingId.toString(),
      listing.tokenId.toString(),
      formatPrice(listing.price),
      listing.price.toString(),
      new Date(Number(listing.createdAt) * 1000).toLocaleString(),
      "Active",
    ]);
  });

  summaryRows.push([""]);
  summaryRows.push(["HISTORICAL LISTINGS"]);
  summaryRows.push([
    "Listing ID",
    "Ticket ID",
    "Price (PC)",
    "Price (Wei)",
    "Listed Date",
    "Status",
  ]);

  // Historical listings
  historicalListings.forEach((listing: any) => {
    summaryRows.push([
      listing.listingId.toString(),
      listing.tokenId.toString(),
      formatPrice(listing.price),
      listing.price.toString(),
      new Date(Number(listing.createdAt) * 1000).toLocaleString(),
      "Sold/Canceled",
    ]);
  });

  // Convert to CSV
  const csvContent = summaryRows
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  // Download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `reseller-analytics-${eventName.replace(/\s+/g, "-")}-${Date.now()}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
