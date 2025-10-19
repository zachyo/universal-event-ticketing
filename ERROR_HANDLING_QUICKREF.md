# Error Handling Quick Reference

## Quick Usage Examples

### Toast Notifications

```tsx
import { toastSuccess, toastError, toastPromise } from "@/lib/toast";

// Simple notifications
toastSuccess("Event created!");
toastError("Failed to create event");
toastWarning("Event is ending soon");
toastInfo("New feature available");

// For async operations
toastPromise(createEvent(data), {
  loading: "Creating event...",
  success: "Event created!",
  error: (err) => getErrorMessage(err),
});

// For transactions
toastTransaction(purchaseTicket(), {
  loading: "Processing purchase...",
  success: "Ticket purchased!",
  error: "Purchase failed",
});
```

### Error Display

```tsx
import { ErrorDisplay } from "@/components/ErrorDisplay";

// Full error card with retry
{
  error && <ErrorDisplay error={error} retry={() => refetch()} />;
}

// Compact inline error
{
  error && <ErrorDisplay error={error} compact />;
}
```

### Empty States

```tsx
import { Ticket } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

<EmptyState
  icon={Ticket}
  title="No tickets yet"
  message="You haven't purchased any tickets."
  action={{
    label: "Browse Events",
    onClick: () => navigate("/events"),
  }}
/>;
```

### Error Utilities

```tsx
import { getErrorMessage, retryWithBackoff } from "@/lib/errorUtils";

// Parse any error to user-friendly message
try {
  await doSomething();
} catch (error) {
  toastError(getErrorMessage(error));
}

// Retry with exponential backoff
const data = await retryWithBackoff(
  () => fetchData(),
  3, // max attempts
  1000 // base delay ms
);
```

### Error Boundary

```tsx
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Wrap critical sections
<ErrorBoundary>
  <CriticalForm />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary fallback={<CustomError />}>
  <Section />
</ErrorBoundary>
```

## Standard Error Handling Pattern

```tsx
function MyComponent() {
  const { data, isLoading, error, refetch } = useQuery();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorDisplay error={error} retry={refetch} />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={YourIcon}
        title="No data"
        message="Description here"
        action={{ label: "Action", onClick: handleAction }}
      />
    );
  }

  return <YourContent data={data} />;
}
```

## Transaction Pattern

```tsx
const handlePurchase = async () => {
  try {
    const tx = await retryWithBackoff(async () => {
      return await writeContract({
        address: contractAddress,
        abi: ABI,
        functionName: "purchase",
        args: [id],
      });
    });

    toastTransaction(Promise.resolve(tx), {
      loading: "Processing...",
      success: "Success!",
      error: "Failed",
    });

    await waitForTransactionReceipt({ hash: tx.hash });
  } catch (error) {
    if (!isUserRejection(error)) {
      toastError(getErrorMessage(error));
    }
  }
};
```

## Contract Error Messages

The system automatically converts contract errors to user-friendly messages:

| Contract Error      | User Message                                      |
| ------------------- | ------------------------------------------------- |
| `notorganizer`      | "You are not the event organizer"                 |
| `notowner`          | "You are not the owner of this ticket"            |
| `ticketalreadyused` | "This ticket has already been used"               |
| `ticketnotvalid`    | "This ticket is not valid"                        |
| `invalidtokenid`    | "Invalid ticket ID"                               |
| `invalidprice`      | "Invalid price amount"                            |
| `notlisted`         | "This ticket is not listed for sale"              |
| `invalidoffer`      | "This offer is no longer valid"                   |
| `offerexpired`      | "This offer has expired"                          |
| User rejection      | "Transaction was cancelled"                       |
| Network error       | "Network error. Please check your connection..."  |
| Insufficient funds  | "Insufficient funds to complete this transaction" |

## Files Reference

- **ErrorBoundary**: `frontend/ticketchain/src/components/ErrorBoundary.tsx`
- **ErrorDisplay**: `frontend/ticketchain/src/components/ErrorDisplay.tsx`
- **EmptyState**: `frontend/ticketchain/src/components/EmptyState.tsx`
- **Toast**: `frontend/ticketchain/src/lib/toast.tsx`
- **Error Utils**: `frontend/ticketchain/src/lib/errorUtils.ts`
