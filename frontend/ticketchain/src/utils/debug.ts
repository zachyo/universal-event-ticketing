// Debug utilities for troubleshooting purchase issues

export function debugTicketType(ticketType: any, index: number) {
  console.log(`=== Ticket Type ${index} Debug ===`);
  console.log("Raw ticket type:", ticketType);
  console.log("Type of ticketType:", typeof ticketType);
  console.log("Keys:", Object.keys(ticketType || {}));
  
  if (ticketType) {
    console.log("Fields:");
    console.log("  eventId:", ticketType.eventId, typeof ticketType.eventId);
    console.log("  ticketTypeId:", ticketType.ticketTypeId, typeof ticketType.ticketTypeId);
    console.log("  name:", ticketType.name, typeof ticketType.name);
    console.log("  price:", ticketType.price, typeof ticketType.price);
    console.log("  supply:", ticketType.supply, typeof ticketType.supply);
    console.log("  sold:", ticketType.sold, typeof ticketType.sold);
    
    if (ticketType.price) {
      console.log("  price.toString():", ticketType.price.toString());
    }
    if (ticketType.ticketTypeId) {
      console.log("  ticketTypeId.toString():", ticketType.ticketTypeId.toString());
    }
  }
  console.log("=== End Debug ===");
}

export function debugPurchaseParams(params: any) {
  console.log("=== Purchase Params Debug ===");
  console.log("Raw params:", params);
  console.log("Type of params:", typeof params);
  
  if (params) {
    console.log("Fields:");
    console.log("  eventId:", params.eventId, typeof params.eventId);
    console.log("  ticketTypeId:", params.ticketTypeId, typeof params.ticketTypeId);
    console.log("  price:", params.price, typeof params.price);
    console.log("  quantity:", params.quantity, typeof params.quantity);
    console.log("  chain:", params.chain, typeof params.chain);
    
    if (params.eventId) {
      console.log("  eventId.toString():", params.eventId.toString());
    }
    if (params.ticketTypeId) {
      console.log("  ticketTypeId.toString():", params.ticketTypeId.toString());
    }
    if (params.price) {
      console.log("  price.toString():", params.price.toString());
    }
  }
  console.log("=== End Debug ===");
}

export function validateTicketType(ticketType: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!ticketType) {
    errors.push("Ticket type is null or undefined");
    return { valid: false, errors };
  }
  
  if (ticketType.ticketTypeId === undefined || ticketType.ticketTypeId === null) {
    errors.push("Missing ticketTypeId");
  }
  
  if (!ticketType.name || typeof ticketType.name !== 'string') {
    errors.push("Missing or invalid name");
  }
  
  if (!ticketType.price || ticketType.price <= 0) {
    errors.push("Missing or invalid price");
  }
  
  if (ticketType.supply === undefined || ticketType.supply < 0) {
    errors.push("Missing or invalid supply");
  }
  
  if (ticketType.sold === undefined || ticketType.sold < 0) {
    errors.push("Missing or invalid sold count");
  }
  
  return { valid: errors.length === 0, errors };
}

export function validatePurchaseParams(params: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!params) {
    errors.push("Purchase params is null or undefined");
    return { valid: false, errors };
  }
  
  if (params.eventId === undefined || params.eventId === null) {
    errors.push("Missing eventId");
  }
  
  if (params.ticketTypeId === undefined || params.ticketTypeId === null) {
    errors.push("Missing ticketTypeId");
  }
  
  if (!params.price || params.price <= 0) {
    errors.push("Missing or invalid price");
  }
  
  if (params.quantity !== undefined && (params.quantity <= 0 || params.quantity > 10)) {
    errors.push("Invalid quantity (must be 1-10)");
  }
  
  return { valid: errors.length === 0, errors };
}

// Helper to compare BigInt values safely
export function compareBigInt(a: any, b: any): boolean {
  try {
    if (typeof a === 'bigint' && typeof b === 'bigint') {
      return a === b;
    }
    if (typeof a === 'number' && typeof b === 'bigint') {
      return BigInt(a) === b;
    }
    if (typeof a === 'bigint' && typeof b === 'number') {
      return a === BigInt(b);
    }
    return a === b;
  } catch (error) {
    console.error("Error comparing values:", error);
    return false;
  }
}

// Helper to format BigInt for display
export function formatBigInt(value: any): string {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  return String(value);
}
