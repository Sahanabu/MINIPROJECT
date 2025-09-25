import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Download,
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

import { RootState, AppDispatch } from '../store';
import { fetchAssets, deleteAsset, setFilters, setPagination } from '../store/slices/assetsSlice';
import { fetchDepartments } from '../store/slices/departmentsSlice';
import { useToast } from '../hooks/use-toast';

const subcategories = [
  'furniture',
  'IT/computers',
  'equipment',
  'machines',
  'consumables',
  'other'
];

const AssetsList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  
  const type = searchParams.get('type') as 'capital' | 'revenue' || 'capital';
  
  const { assets, loading, pagination, filters } = useSelector((state: RootState) => state.assets);
  const { departments } = useSelector((state: RootState) => state.departments);

  // Fetch data on mount and when filters change
  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchAssets({ 
      type, 
      page: pagination.page,
      limit: pagination.limit,
      ...filters 
    }));
  }, [dispatch, type, pagination.page, pagination.limit, filters]);

  const handleFilterChange = (key: string, value: string) => {
    dispatch(setFilters({ [key]: value || undefined }));
    dispatch(setPagination({ page: 1 })); // Reset to first page when filtering
  };

  const handlePageChange = (newPage: number) => {
    dispatch(setPagination({ page: newPage }));
  };

  const handleDelete = async (assetId: string) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await dispatch(deleteAsset(assetId)).unwrap();
        toast({
          title: 'Success',
          description: 'Asset deleted successfully',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete asset',
          variant: 'destructive',
        });
      }
    }
  };

  const getDepartmentName = (departmentId: string) => {
    return departments.find(d => d._id === departmentId)?.name || 'Unknown';
  };

  const filteredAssets = assets.filter(asset =>
    searchTerm === '' ||
    asset.items.some(item => 
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="animate-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {type === 'capital' ? 'Capital' : 'Revenue'} Assets
          </h1>
          <p className="text-muted-foreground">
            Manage and track your {type} assets
          </p>
        </div>
        <Link to={`/asset/${type}`}>
          <Button className="bg-primary hover:bg-primary-hover">
            <Plus className="mr-2 h-4 w-4" />
            Add {type === 'capital' ? 'Capital' : 'Revenue'} Asset
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items or vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select 
              value={filters.departmentId || 'all'} 
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

            <Select 
              value={filters.subcategory || 'all'} 
              onValueChange={(value) => handleFilterChange('subcategory', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {subcategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Vendor name..."
              value={filters.vendorName || ''}
              onChange={(e) => handleFilterChange('vendorName', e.target.value)}
            />

            <Input
              placeholder="Academic year..."
              value={filters.academicYear || ''}
              onChange={(e) => handleFilterChange('academicYear', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading assets...</p>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset Details</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Items Count</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-muted-foreground">
                          No assets found. Try adjusting your filters or{' '}
                          <Link 
                            to={`/asset/${type}`} 
                            className="text-primary hover:underline"
                          >
                            add a new asset
                          </Link>
                          .
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAssets.map((asset) => (
                      <TableRow key={asset._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {asset.items[0]?.itemName}
                              {asset.items.length > 1 && ` +${asset.items.length - 1} more`}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {asset.items[0]?.vendorName}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{getDepartmentName(asset.departmentId)}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {asset.subcategory}
                          </Badge>
                        </TableCell>
                        <TableCell>{asset.items.length}</TableCell>
                        <TableCell className="font-medium">
                          ₹{asset.grandTotal.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {asset.createdAt && format(new Date(asset.createdAt), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setSelectedAsset(asset)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Asset Details</DialogTitle>
                                </DialogHeader>
                                {selectedAsset && (
                                  <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm text-muted-foreground">Department</p>
                                        <p className="font-medium">{getDepartmentName(selectedAsset.departmentId)}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground">Category</p>
                                        <p className="font-medium">{selectedAsset.subcategory}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground">Academic Year</p>
                                        <p className="font-medium">{selectedAsset.academicYear}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground">Officer</p>
                                        <p className="font-medium">{selectedAsset.officer.name}</p>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <h4 className="font-medium mb-4">Items ({selectedAsset.items.length})</h4>
                                      <div className="space-y-4">
                                        {selectedAsset.items.map((item, index) => (
                                          <Card key={index}>
                                            <CardContent className="p-4">
                                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                  <h5 className="font-medium">{item.itemName}</h5>
                                                  <p className="text-sm text-muted-foreground">
                                                    Qty: {item.quantity} × ₹{item.pricePerItem.toLocaleString()}
                                                  </p>
                                                  <p className="text-sm font-medium">
                                                    Total: ₹{item.totalAmount.toLocaleString()}
                                                  </p>
                                                </div>
                                                <div>
                                                  <p className="font-medium">{item.vendorName}</p>
                                                  <p className="text-sm text-muted-foreground">{item.email}</p>
                                                  <p className="text-sm text-muted-foreground">{item.contactNumber}</p>
                                                </div>
                                                <div>
                                                  <p className="text-sm">
                                                    <span className="text-muted-foreground">Bill:</span> {item.billNo}
                                                  </p>
                                                  <p className="text-sm">
                                                    <span className="text-muted-foreground">Date:</span> {format(new Date(item.billDate), 'MMM dd, yyyy')}
                                                  </p>
                                                  {item.billFileUrl && (
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      className="mt-2"
                                                      onClick={() => window.open(item.billFileUrl, '_blank')}
                                                    >
                                                      <Download className="mr-2 h-3 w-3" />
                                                      View Bill
                                                    </Button>
                                                  )}
                                                </div>
                                              </div>
                                            </CardContent>
                                          </Card>
                                        ))}
                                      </div>
                                      <div className="mt-4 text-right">
                                        <p className="text-lg font-semibold">
                                          Grand Total: ₹{selectedAsset.grandTotal.toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(asset._id!)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} assets
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={page === pagination.page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AssetsList;