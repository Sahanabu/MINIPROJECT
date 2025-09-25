import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FileText, Download, BarChart3, PieChart, TrendingUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

import { RootState, AppDispatch } from '../store';
import { generateReport, exportReport, setFilters } from '../store/slices/reportsSlice';
import { fetchDepartments } from '../store/slices/departmentsSlice';
import { useToast } from '../hooks/use-toast';

const Reports = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  
  const { reportData, loading, filters } = useSelector((state: RootState) => state.reports);
  const { departments } = useSelector((state: RootState) => state.departments);
  
  const [localFilters, setLocalFilters] = useState({
    academicYear: '',
    departmentId: 'all',
    itemName: '',
    vendorName: '',
    groupBy: 'department' as 'department' | 'item' | 'vendor',
  });

  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  const handleFilterChange = (key: string, value: string) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerateReport = () => {
    dispatch(setFilters(localFilters));
    dispatch(generateReport(localFilters));
  };

  const handleExport = async (format: 'excel' | 'word') => {
    try {
      await dispatch(exportReport({ ...localFilters, format })).unwrap();
      toast({
        title: 'Success',
        description: `Report exported as ${format.toUpperCase()} successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to export report as ${format.toUpperCase()}`,
        variant: 'destructive',
      });
    }
  };

  const getDepartmentName = (departmentId: string) => {
    return departments.find(d => d._id === departmentId)?.name || 'Unknown';
  };

  return (
    <div className="animate-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">
            Generate and export comprehensive asset reports
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
                <p className="text-2xl font-bold">
                  {reportData?.data.reduce((sum, group) => sum + group.items.length, 0) || 0}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
                  ₹{reportData?.grandTotal.toLocaleString() || 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Groups</p>
                <p className="text-2xl font-bold">{reportData?.data.length || 0}</p>
              </div>
              <PieChart className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Departments</p>
                <p className="text-2xl font-bold">{departments.length}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Input
              placeholder="Academic Year (e.g., 2024-25)"
              value={localFilters.academicYear}
              onChange={(e) => handleFilterChange('academicYear', e.target.value)}
            />
            
            <Select 
              value={localFilters.departmentId} 
              onValueChange={(value) => handleFilterChange('departmentId', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept._id} value={dept._id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Item Name"
              value={localFilters.itemName}
              onChange={(e) => handleFilterChange('itemName', e.target.value)}
            />

            <Input
              placeholder="Vendor Name"
              value={localFilters.vendorName}
              onChange={(e) => handleFilterChange('vendorName', e.target.value)}
            />

            <Select 
              value={localFilters.groupBy} 
              onValueChange={(value) => handleFilterChange('groupBy', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Group By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="department">Department</SelectItem>
                <SelectItem value="item">Item</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={handleGenerateReport}
              disabled={loading}
              className="bg-primary hover:bg-primary-hover"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Report Results</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleExport('excel')}
                disabled={loading}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('word')}
                disabled={loading}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Word
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {localFilters.groupBy === 'department' && 'Department'}
                    {localFilters.groupBy === 'item' && 'Item'}
                    {localFilters.groupBy === 'vendor' && 'Vendor'}
                  </TableHead>
                  <TableHead>Items Count</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="text-muted-foreground">
                        No data found for the selected filters.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  reportData.data.map((group, index) => {
                    const percentage = ((group.subtotal / reportData.grandTotal) * 100).toFixed(1);
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="font-medium">
                            {localFilters.groupBy === 'department' 
                              ? getDepartmentName(group.groupKey)
                              : group.groupKey
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {group.items.length} items
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          ₹{group.subtotal.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{percentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
                {reportData.data.length > 0 && (
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell>Total</TableCell>
                    <TableCell>
                      <Badge>
                        {reportData.data.reduce((sum, group) => sum + group.items.length, 0)} items
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold">
                      ₹{reportData.grandTotal.toLocaleString()}
                    </TableCell>
                    <TableCell>100%</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!reportData && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Report Generated</h3>
            <p className="text-muted-foreground mb-4">
              Set your filters and click "Generate Report" to view asset data.
            </p>
            <Button onClick={handleGenerateReport}>
              Generate Your First Report
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Reports;