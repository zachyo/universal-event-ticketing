import { CheckCircle2, XCircle, Users } from "lucide-react";

interface AttendanceTrackerProps {
  totalSold: number;
  ticketsScanned: number;
  scanRate: number;
  noShowRate: number;
}

export function AttendanceTracker({
  totalSold,
  ticketsScanned,
  scanRate,
  noShowRate,
}: AttendanceTrackerProps) {
  const notScanned = totalSold - ticketsScanned;

  return (
    <div className="glass-card rounded-[1.75rem] border border-border bg-card p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-muted-foreground" />
        <h3 className="text-base md:text-lg font-semibold text-foreground">
          Attendance Tracker
        </h3>
      </div>

      {totalSold === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No tickets sold yet</p>
        </div>
      ) : (
        <>
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                Overall Attendance
              </span>
              <span className="text-sm font-semibold text-foreground">
                {scanRate.toFixed(1)}%
              </span>
            </div>
            <div className="relative w-full bg-muted rounded-full h-4 overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-500"
                style={{ width: `${Math.min(scanRate, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>{ticketsScanned} scanned</span>
              <span>{notScanned} not scanned</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Scanned */}
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 bg-green-500/20 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-green-500 font-medium">
                  Tickets Scanned
                </p>
                <p className="text-xl font-bold text-green-500">
                  {ticketsScanned}
                </p>
                <p className="text-xs text-green-500/70">
                  {scanRate.toFixed(1)}% of sold
                </p>
              </div>
            </div>

            {/* Not Scanned */}
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 bg-red-500/20 rounded-lg">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-red-500 font-medium">No-Shows</p>
                <p className="text-xl font-bold text-red-500">{notScanned}</p>
                <p className="text-xs text-red-500/70">
                  {noShowRate.toFixed(1)}% of sold
                </p>
              </div>
            </div>
          </div>

          {/* Info Note */}
          {ticketsScanned === 0 && totalSold > 0 && (
            <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
              <p className="text-sm text-primary">
                <strong>Note:</strong> No tickets have been scanned yet.
                Attendance data will be available once guests start checking in.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
