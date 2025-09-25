import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, TrendingUp, FileBarChart, ArrowRight } from 'lucide-react';

const Index = () => {
  const [summary, setSummary] = useState<{ totalAssets: number; totalValue: number } | null>(null);
  const [deptCount, setDeptCount] = useState<number>(0);
  const [vendorsCount, setVendorsCount] = useState<number>(0);
  useEffect(() => {
    (async () => {
      try {
        const [sum, deps, vnds] = await Promise.all([
          api.get('/assets/summary/stats'),
          api.get('/departments'),
          api.get('/vendors')
        ]);
        setSummary(sum.data.data);
        setDeptCount((deps.data.data || []).length);
        setVendorsCount((vnds.data.data || []).length);
      } catch (e) {
        setSummary({ totalAssets: 0, totalValue: 0 });
        setDeptCount(0);
        setVendorsCount(0);
      }
    })();
  }, []);
  return (
    <div className="animate-in space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Building2 className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
          Asset Tracking System
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Efficiently manage and track your departmental assets with our comprehensive 
          digital platform. From capital investments to revenue items, keep everything organized.
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {/* Capital Assets Card */}
        <Card className="group hover:shadow-lg transition-all duration-200 border-border hover:border-primary/50">
          <CardHeader className="text-center pb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors mx-auto mb-3">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Capital Assets</CardTitle>
            <CardDescription>
              Long-term investments like equipment, furniture, and machinery that provide value over time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Categories:</span>
                <span className="font-medium">IT, Furniture, Equipment</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Depreciation:</span>
                <span className="font-medium">Tracked</span>
              </div>
            </div>
            <Link to="/asset/capital" className="w-full">
              <Button className="w-full bg-primary hover:bg-primary-hover group-hover:translate-y-[-1px] transition-transform">
                Add Capital Asset
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/assets?type=capital">
              <Button variant="outline" className="w-full">
                View Capital Assets
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Revenue Assets Card */}
        <Card className="group hover:shadow-lg transition-all duration-200 border-border hover:border-accent/50">
          <CardHeader className="text-center pb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <CardTitle className="text-xl">Revenue Assets</CardTitle>
            <CardDescription>
              Short-term items and consumables that support daily operations and generate revenue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Categories:</span>
                <span className="font-medium">Consumables, Supplies</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tracking:</span>
                <span className="font-medium">Usage Based</span>
              </div>
            </div>
            <Link to="/asset/revenue" className="w-full">
              <Button className="w-full bg-accent hover:bg-accent/90 group-hover:translate-y-[-1px] transition-transform">
                Add Revenue Asset
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/assets?type=revenue">
              <Button variant="outline" className="w-full">
                View Revenue Assets
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Reports Card */}
        <Card className="group hover:shadow-lg transition-all duration-200 border-border hover:border-warning/50">
          <CardHeader className="text-center pb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-warning/10 group-hover:bg-warning/20 transition-colors mx-auto mb-3">
              <FileBarChart className="w-6 h-6 text-warning" />
            </div>
            <CardTitle className="text-xl">Reports</CardTitle>
            <CardDescription>
              Generate comprehensive reports and analytics for asset management and financial tracking.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Formats:</span>
                <span className="font-medium">Excel, Word</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Filters:</span>
                <span className="font-medium">Department, Year</span>
              </div>
            </div>
            <Link to="/reports" className="w-full">
              <Button className="w-full bg-warning hover:bg-warning/90 text-warning-foreground group-hover:translate-y-[-1px] transition-transform">
                View Reports
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="bg-surface-elevated rounded-lg p-6 max-w-4xl mx-auto">
        <h2 className="text-lg font-semibold mb-4 text-center">System Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{summary?.totalAssets ?? 0}</div>
            <div className="text-sm text-muted-foreground">Total Assets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">₹{(summary?.totalValue ?? 0).toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Value</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">{deptCount}</div>
            <div className="text-sm text-muted-foreground">Departments</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-muted-foreground">{vendorsCount}</div>
            <div className="text-sm text-muted-foreground">Vendors</div>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Follow these simple steps to start managing your assets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">
                1
              </div>
              <div>
                <h4 className="font-medium">Choose Asset Type</h4>
                <p className="text-sm text-muted-foreground">Select between Capital or Revenue assets based on your needs</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">
                2
              </div>
              <div>
                <h4 className="font-medium">Fill Asset Details</h4>
                <p className="text-sm text-muted-foreground">Enter department, category, and item information with vendor details</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">
                3
              </div>
              <div>
                <h4 className="font-medium">Generate Reports</h4>
                <p className="text-sm text-muted-foreground">Create comprehensive reports for analysis and record-keeping</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
