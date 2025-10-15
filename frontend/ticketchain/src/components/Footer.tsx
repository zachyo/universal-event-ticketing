import { Ticket } from 'lucide-react';

export const Footer = () => (
  <footer className="bg-secondary border-t border-secondary/50">
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center space-x-2 mb-4 md:mb-0">
          <Ticket className="text-primary" size={24} />
          <h4 className="text-xl font-bold">TicketChain</h4>
        </div>
        <div className="text-gray-600">
          &copy; {new Date().getFullYear()} TicketChain. All rights reserved.
        </div>
      </div>
    </div>
  </footer>
);
