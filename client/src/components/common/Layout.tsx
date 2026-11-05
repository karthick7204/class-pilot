import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { PortalSyncModal } from '../portal/PortalSyncModal';

export const Layout: React.FC = () => {
  const [portalModalOpen, setPortalModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Sidebar onOpenPortalModal={() => setPortalModalOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onOpenPortalModal={() => setPortalModalOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      <PortalSyncModal
        isOpen={portalModalOpen}
        onClose={() => setPortalModalOpen(false)}
        onSuccess={() => {
          // Trigger a custom event so child pages can refresh
          window.dispatchEvent(new Event('attendwise_data_synced'));
        }}
      />
    </div>
  );
};

