import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Building2, FileBarChart, Settings } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-border bg-surface-elevated shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-primary" />
              <span className="text-xl font-semibold text-foreground">
                Asset Tracker
              </span>
            </Link>
            
            {!isHomePage && (
              <nav className="flex items-center space-x-4">
                <Link to="/">
                  <Button variant="ghost" size="sm">
                    Home
                  </Button>
                </Link>
                <Link to="/assets?type=capital">
                  <Button variant="ghost" size="sm">
                    Capital Assets
                  </Button>
                </Link>
                <Link to="/assets?type=revenue">
                  <Button variant="ghost" size="sm">
                    Revenue Assets
                  </Button>
                </Link>
                <Link to="/reports">
                  <Button variant="ghost" size="sm">
                    <FileBarChart className="mr-2 h-4 w-4" />
                    Reports
                  </Button>
                </Link>
                <Link to="/admin">
                  <Button variant="ghost" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              </nav>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;