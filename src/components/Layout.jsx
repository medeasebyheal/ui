import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ maintenance = false }) {
  const location = useLocation();
  // Only treat homepage as maintenance-hidden when maintenance mode is active.
  const isHome = maintenance && location.pathname === '/';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 overflow-x-hidden flex flex-col">
      {!isHome && <Navbar />}
      <main className="flex-1 mt-6 sm:mt-8">
        <Outlet />
      </main>
      {!isHome && <Footer />}
    </div>
  );
}
