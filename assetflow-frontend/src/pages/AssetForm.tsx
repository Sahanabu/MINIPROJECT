import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { Plus, Trash2, Eye, Calendar, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { RootState, AppDispatch } from '../store';
import { fetchDepartments } from '../store/slices/departmentsSlice';
import { createAsset, updateAsset, getAsset, AssetItem } from '../store/slices/assetsSlice';
import { useToast } from '../hooks/use-toast';
import FileUploader from '../components/FileUploader';

const subcategories = [
  'furniture',
  'IT/computers',
  'equipment',
  'machines',
  'consumables',
  'other'
];

const itemSchema = yup.object({
  itemName: yup.string().required('Item name is required'),
  quantity: yup.number().min(1, 'Quantity must be at least 1').required('Quantity is required'),
  pricePerItem: yup.number().min(0, 'Price must be non-negative').required('Price is required'),
  totalAmount: yup.number(),
  vendorName: yup.string().required('Vendor name is required'),
  vendorAddress: yup.string(),
  contactNumber: yup.string().matches(/^[0-9]{10}$/, 'Contact number must be 10 digits').required('Contact number is required'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  billNo: yup.string().required('Bill number is required'),
  billDate: yup.date().required('Bill date is required'),
  billFile: yup.mixed(),
  billFileId: yup.string(),
  billFileName: yup.string(),
});

const assetSchema = yup.object({
  departmentId: yup.string().required('Department is required'),
  subcategory: yup.string().required('Subcategory is required'),
  items: yup.array().of(itemSchema).min(1, 'At least one item is required'),
});

const AssetForm = () => {
  const { type, id } = useParams<{ type: 'capital' | 'revenue'; id?: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();

  const isEdit = !!id;
  const [step, setStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);

  const { departments, loading: departmentsLoading } = useSelector((state: RootState) => state.departments);
  const { loading: assetLoading, actionLoading } = useSelector((state: RootState) => state.assets);
  const { user } = useSelector((state: RootState) => state.auth);

  const form = useForm({
    resolver: yupResolver(assetSchema),
    defaultValues: {
      departmentId: '',
      subcategory: '',
      items: [{
        itemName: '',
        quantity: 1,
        pricePerItem: 0,
        totalAmount: 0,
        vendorName: '',
        vendorAddress: '',
        contactNumber: '',
        email: '',
        billNo: '',
        billDate: new Date(),
        billFile: undefined,
        billFileId: '',
        billFileName: '',
      }],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = form.watch('items');

  // Calculate total amount for each item
  useEffect(() => {
    watchedItems.forEach((item, index) => {
      const totalAmount = item.quantity * item.pricePerItem;
      if (item.totalAmount !== totalAmount) {
        form.setValue(`items.${index}.totalAmount`, totalAmount);
      }
    });
  }, [watchedItems, form]);

  // Fetch departments on mount
  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  // Fetch asset data for edit mode
  useEffect(() => {
    if (isEdit && id) {
      const fetchAsset = async () => {
        try {
          const result = await dispatch(getAsset(id)).unwrap();
          const asset = result.data;
          form.reset({
            departmentId: asset.departmentId,
            subcategory: asset.subcategory,
            items: asset.items.map(item => ({
              ...item,
              billDate: new Date(item.billDate),
              billFile: undefined, // Reset file input
            })),
          });
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to load asset data',
            variant: 'destructive',
          });
          navigate('/assets');
        }
      };
      fetchAsset();
    }
  }, [isEdit, id, dispatch, form, toast, navigate]);

  const grandTotal = watchedItems.reduce((sum, item) => sum + item.totalAmount, 0);

  const handleAddItem = () => {
    append({
      itemName: '',
      quantity: 1,
      pricePerItem: 0,
      totalAmount: 0,
      vendorName: '',
      vendorAddress: '',
      contactNumber: '',
      email: '',
      billNo: '',
      billDate: new Date(),
      billFile: undefined,
      billFileId: '',
      billFileName: '',
    });
  };

  const handleSubmit = async (data: any) => {
    if (!type) return;

    const assetData = {
      type,
      departmentId: data.departmentId,
      subcategory: data.subcategory,
      academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1).toString().slice(-2),
      officer: {
        id: user?._id || '',
        name: user?.name || '',
      },
      items: data.items,
      grandTotal,
    };

    try {
      if (isEdit && id) {
        await dispatch(updateAsset({ id, assetData })).unwrap();
        toast({
          title: 'Success',
          description: 'Asset updated successfully',
        });
      } else {
        await dispatch(createAsset(assetData)).unwrap();
        toast({
          title: 'Success',
          description: 'Asset created successfully',
        });
      }
      navigate('/assets?type=' + type);
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${isEdit ? 'update' : 'create'} asset`,
        variant: 'destructive',
      });
    }
  };

  const canProceedToStep = (stepNumber: number) => {
    switch (stepNumber) {
      case 2:
        return form.getValues('departmentId') !== '';
      case 3:
        return form.getValues('subcategory') !== '';
      default:
        return true;
    }
  };

  if (!type || !['capital', 'revenue'].includes(type)) {
    return <div>Invalid asset type</div>;
  }

  if (isEdit && actionLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading asset data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isEdit ? 'Edit' : 'Add'} {type === 'capital' ? 'Capital' : 'Revenue'} Asset
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Update the details of the' : 'Fill in the details to add a new'} {type} asset to the system
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/assets?type=' + type)}
        >
          Cancel
        </Button>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                    step >= stepNumber
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {stepNumber}
                </div>
                <span className={cn(
                  "ml-2 text-sm font-medium",
                  step >= stepNumber ? "text-foreground" : "text-muted-foreground"
                )}>
                  {stepNumber === 1 && "Department"}
                  {stepNumber === 2 && "Subcategory"}
                  {stepNumber === 3 && "Items"}
                </span>
                {stepNumber < 3 && (
                  <div
                    className={cn(
                      "mx-4 h-px flex-1",
                      step > stepNumber ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Step 1: Department Selection */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Select Department</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={actionLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept._id} value={dept._id}>
                              {dept.name} ({dept.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!canProceedToStep(2)}
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Subcategory Selection */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Select Subcategory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="subcategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategory</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={actionLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subcategory" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subcategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!canProceedToStep(3)}
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Items */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Step 3: {isEdit ? 'Edit' : 'Add'} Items</h2>
                <div className="flex gap-2">
                  <Dialog open={showPreview} onOpenChange={setShowPreview}>
                    <DialogTrigger asChild>
                      <Button variant="outline" type="button">
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Asset Preview</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Department</p>
                            <p className="font-medium">
                              {departments.find(d => d._id === form.getValues('departmentId'))?.name}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Subcategory</p>
                            <p className="font-medium">{form.getValues('subcategory')}</p>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Items ({watchedItems.length})</h4>
                          <div className="space-y-2">
                            {watchedItems.map((item, index) => (
                              <Card key={index} className="p-4">
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <p className="font-medium">{item.itemName}</p>
                                    <p className="text-muted-foreground">Qty: {item.quantity}</p>
                                  </div>
                                  <div>
                                    <p>{item.vendorName}</p>
                                    <p className="text-muted-foreground">{item.email}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">₹{item.totalAmount.toLocaleString()}</p>
                                    <p className="text-muted-foreground">₹{item.pricePerItem} each</p>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                          <div className="mt-4 text-right">
                            <p className="text-lg font-semibold">
                              Grand Total: ₹{grandTotal.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-primary hover:bg-primary-hover"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-6">
                {fields.map((field, index) => (
                  <Card key={field.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-base">Item {index + 1}</CardTitle>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name={`items.${index}.itemName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Item Name *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter item name" disabled={actionLoading} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  {...field}
                                  disabled={actionLoading}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 0;
                                    field.onChange(value);
                                    const price = form.getValues(`items.${index}.pricePerItem`) || 0;
                                    form.setValue(`items.${index}.totalAmount`, value * price);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.pricePerItem`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price per Item *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  {...field}
                                  disabled={actionLoading}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    field.onChange(value);
                                    const quantity = form.getValues(`items.${index}.quantity`) || 0;
                                    form.setValue(`items.${index}.totalAmount`, quantity * value);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <FormLabel>Total Amount</FormLabel>
                          <Input
                            value={`₹${watchedItems[index]?.totalAmount?.toLocaleString() || 0}`}
                            disabled
                            className="bg-muted"
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name={`items.${index}.vendorName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vendor Name *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter vendor name" disabled={actionLoading} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`items.${index}.vendorAddress`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vendor Address</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter vendor address" disabled={actionLoading} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.contactNumber`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Number *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="10-digit phone number" disabled={actionLoading} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name={`items.${index}.email`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email *</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} placeholder="vendor@example.com" disabled={actionLoading} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.billNo`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bill Number *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter bill number" disabled={actionLoading} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.billDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bill Date *</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <CalendarComponent
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date > new Date() || date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                    className="p-3 pointer-events-auto"
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`items.${index}.billFile`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bill File {isEdit && watchedItems[index]?.billFileId ? '(Optional - replace existing)' : '*'}</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                {isEdit && watchedItems[index]?.billFileId && (
                                  <div className="flex items-center gap-2 p-2 border rounded">
                                    <span className="text-sm">Current file: {watchedItems[index].billFileName}</span>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(`/api/assets/${id}/file/${index}`, '_blank')}
                                    >
                                      <Eye className="mr-2 h-3 w-3" />
                                      View
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = `/api/assets/${id}/file/${index}?download=true`;
                                        link.download = watchedItems[index].billFileName || 'bill.pdf';
                                        link.click();
                                      }}
                                    >
                                      <Download className="mr-2 h-3 w-3" />
                                      Download
                                    </Button>
                                  </div>
                                )}
                                <FileUploader
                                  onFileSelect={(file) => field.onChange(file)}
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  maxSize={5 * 1024 * 1024} // 5MB
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Grand Total & Actions */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      Grand Total: ₹{grandTotal.toLocaleString()}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(2)}
                      >
                        Previous
                      </Button>
                      <Button
                        type="submit"
                        disabled={assetLoading || actionLoading}
                        className="bg-primary hover:bg-primary-hover"
                      >
                        {assetLoading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Asset' : 'Create Asset')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
};

export default AssetForm;
