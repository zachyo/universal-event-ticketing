import { Routes, Route, Outlet } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import { MarketplacePage } from "./pages/MarketplacePage";
import { CreateEventPage } from "./pages/CreateEventPage";
import MyTicketsPage from "./pages/MyTicketsPage";
import VerifyPage from "./pages/VerifyPage";
import { OrganizerVerificationPage } from "./pages/OrganizerVerificationPage";
import EventAnalyticsPage from "./pages/EventAnalyticsPage";

const AppLayout = () => (
  <div className="min-h-screen flex flex-col font-sans">
    <Header />
    <main className="flex-grow">
      <Outlet />
    </main>
    <Footer />
  </div>
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/:id" element={<EventDetailPage />} />
        <Route
          path="event-analytics/:eventId"
          element={<EventAnalyticsPage />}
        />
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path="create-event" element={<CreateEventPage />} />
        <Route path="my-tickets" element={<MyTicketsPage />} />
        <Route path="verify" element={<VerifyPage />} />
        <Route path="organizer-scan" element={<OrganizerVerificationPage />} />
      </Route>
    </Routes>
  );
}

export default App;
