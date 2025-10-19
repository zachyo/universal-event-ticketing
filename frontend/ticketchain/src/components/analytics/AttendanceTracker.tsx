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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-gray-600" />
        <h3 className="text-base md:text-lg font-semibold text-gray-900">
          Attendance Tracker
        </h3>
      </div>

      {totalSold === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No tickets sold yet</p>
        </div>
      ) : (
        <>
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Overall Attendance
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {scanRate.toFixed(1)}%
              </span>
            </div>
            <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                style={{ width: `${Math.min(scanRate, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>{ticketsScanned} scanned</span>
              <span>{notScanned} not scanned</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Scanned */}
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-green-700 font-medium">
                  Tickets Scanned
                </p>
                <p className="text-xl font-bold text-green-900">
                  {ticketsScanned}
                </p>
                <p className="text-xs text-green-600">
                  {scanRate.toFixed(1)}% of sold
                </p>
              </div>
            </div>

            {/* Not Scanned */}
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-red-700 font-medium">No-Shows</p>
                <p className="text-xl font-bold text-red-900">{notScanned}</p>
                <p className="text-xs text-red-600">
                  {noShowRate.toFixed(1)}% of sold
                </p>
              </div>
            </div>
          </div>

          {/* Info Note */}
          {ticketsScanned === 0 && totalSold > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
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
