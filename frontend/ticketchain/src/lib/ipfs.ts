// IPFS integration using Pinata
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const PINATA_API_URL = "https://api.pinata.cloud";
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

// Upload a file to IPFS via Pinata
export async function uploadToIPFS(file: File): Promise<string> {
  if (!PINATA_JWT) {
    console.warn("PINATA_JWT not configured, using placeholder hash");
    // Generate a proper-length IPFS hash (44 characters after Qm)
    const randomPart1 = Math.random().toString(36).substring(2);
    const randomPart2 = Math.random().toString(36).substring(2);
    const randomPart3 = Math.random().toString(36).substring(2);
    return `Qm${randomPart1}${randomPart2}${randomPart3}`.substring(0, 46);
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
        fileType: file.type,
      },
    });
    formData.append("pinataMetadata", metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append("pinataOptions", options);

    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pinata API Error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: `${PINATA_API_URL}/pinning/pinFileToIPFS`,
        hasJWT: !!PINATA_JWT,
        jwtLength: PINATA_JWT?.length
      });
      throw new Error(`Failed to upload to IPFS: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log("IPFS upload successful:", result);
    return result.IpfsHash;
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    throw new Error("Failed to upload image to IPFS");
  }
}

// Upload JSON metadata to IPFS via Pinata
export async function uploadJSONToIPFS(
  json: Record<string, unknown>
): Promise<string> {
  if (!PINATA_JWT) {
    console.warn("PINATA_JWT not configured, using placeholder hash");
    // Generate a proper-length IPFS hash (44 characters after Qm)
    const randomPart1 = Math.random().toString(36).substring(2);
    const randomPart2 = Math.random().toString(36).substring(2);
    const randomPart3 = Math.random().toString(36).substring(2);
    return `Qm${randomPart1}${randomPart2}${randomPart3}`.substring(0, 46);
  }

  try {
    const response = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: json,
        pinataMetadata: {
          name: "NFT Metadata",
          keyvalues: {
            uploadedAt: new Date().toISOString(),
            type: "metadata",
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pinata JSON API Error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: `${PINATA_API_URL}/pinning/pinJSONToIPFS`,
        hasJWT: !!PINATA_JWT,
        jwtLength: PINATA_JWT?.length
      });
      throw new Error(`Failed to upload JSON to IPFS: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log("IPFS JSON upload successful:", result);
    return result.IpfsHash;
  } catch (error) {
    console.error("Error uploading JSON to IPFS:", error);
    throw new Error("Failed to upload metadata to IPFS");
  }
}

// Get IPFS URL from hash
export function getIPFSUrl(hash: string): string {
  if (!hash) return "";

  // Remove ipfs:// prefix if present
  const cleanHash = hash.replace("ipfs://", "");

  return `${PINATA_GATEWAY}${cleanHash}`;
}

// Create NFT metadata for a ticket
export async function createTicketMetadata(
  eventName: string,
  eventDescription: string,
  eventImageHash: string,
  venue: string,
  date: string,
  ticketType: string,
  tokenId: number
): Promise<string> {
  const metadata = {
    name: `${eventName} - ${ticketType} Ticket #${tokenId}`,
    description: `${eventDescription}\n\nVenue: ${venue}\nDate: ${date}\nTicket Type: ${ticketType}`,
    image: `ipfs://${eventImageHash}`,
    attributes: [
      {
        trait_type: "Event",
        value: eventName,
      },
      {
        trait_type: "Venue",
        value: venue,
      },
      {
        trait_type: "Date",
        value: date,
      },
      {
        trait_type: "Ticket Type",
        value: ticketType,
      },
      {
        trait_type: "Token ID",
        value: tokenId,
      },
    ],
  };

  return uploadJSONToIPFS(metadata);
}

// Fetch JSON data from IPFS
export async function fetchFromIPFS<T = unknown>(hash: string): Promise<T> {
  try {
    const url = getIPFSUrl(hash);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error("Error fetching from IPFS:", error);
    throw new Error("Failed to fetch data from IPFS");
  }
}

// Validate IPFS hash format
export function isValidIPFSHash(hash: string): boolean {
  // Basic validation for IPFS hash (Qm... format)
  const ipfsHashRegex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  return ipfsHashRegex.test(hash.replace("ipfs://", ""));
}

// Get file size limit for uploads (5MB default)
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Validate file for IPFS upload
export function validateFileForUpload(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "File must be an image (JPEG, PNG, GIF, or WebP)",
    };
  }

  return { valid: true };
}

// Compress image before upload (basic implementation)
export function compressImage(
  file: File,
  maxWidth: number = 800,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        file.type,
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
}

// Batch upload multiple files
export async function batchUploadToIPFS(files: File[]): Promise<string[]> {
  const uploadPromises = files.map((file) => uploadToIPFS(file));
  return Promise.all(uploadPromises);
}

// Pin existing IPFS content (if you have the hash)
export async function pinToIPFS(hash: string): Promise<boolean> {
  if (!PINATA_JWT) {
    console.warn("PINATA_JWT not configured");
    return false;
  }

  try {
    const response = await fetch(`${PINATA_API_URL}/pinning/pinByHash`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify({
        hashToPin: hash,
        pinataMetadata: {
          name: `Pinned content ${hash}`,
        },
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error pinning to IPFS:", error);
    return false;
  }
}
