import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import api from '@/services/api';

const Admin = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [capital, setCapital] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);

  const [openDeptDialog, setOpenDeptDialog] = useState(false);
  const [editingDept, setEditingDept] = useState<any | null>(null);
  const [deptForm, setDeptForm] = useState<{ name: string; type: 'major' | 'academic' | 'service' }>({ name: '', type: 'major' });

  const [openVendorDialog, setOpenVendorDialog] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any | null>(null);
  const [vendorForm, setVendorForm] = useState<{ name: string; email: string; contactNumber: string; address: string }>({ name: '', email: '', contactNumber: '', address: '' });

  useEffect(() => {
    refreshAll();
  }, []);

  async function refreshAll() {
    const [deps, cap, rev, vnd] = await Promise.all([
      api.get('/departments'),
      api.get('/assets', { params: { type: 'capital', limit: 100 } }),
      api.get('/assets', { params: { type: 'revenue', limit: 100 } }),
      api.get('/vendors')
    ]);
    setDepartments(deps.data.data || []);
    setCapital(cap.data.data || []);
    setRevenue(rev.data.data || []);
    setVendors(vnd.data.data || []);
  }

  // Departments CRUD
  const onCreateDepartment = async () => {
    await api.post('/departments', deptForm);
    setOpenDeptDialog(false);
    setDeptForm({ name: '', type: 'major' });
    await refreshAll();
  };

  const onUpdateDepartment = async () => {
    if (!editingDept) return;
    await api.put(`/departments/${editingDept._id}`, deptForm);
    setOpenDeptDialog(false);
    setEditingDept(null);
    setDeptForm({ name: '', type: 'major' });
    await refreshAll();
  };

  const onDeleteDepartment = async (id: string) => {
    if (!confirm('Delete this department?')) return;
    await api.delete(`/departments/${id}`);
    await refreshAll();
  };

  // Vendors CRUD
  const onCreateVendor = async () => {
    await api.post('/vendors', vendorForm);
    setOpenVendorDialog(false);
    setVendorForm({ name: '', email: '', contactNumber: '', address: '' });
    await refreshAll();
  };

  const onUpdateVendor = async () => {
    if (!editingVendor) return;
    await api.put(`/vendors/${editingVendor._id}`, vendorForm);
    setOpenVendorDialog(false);
    setEditingVendor(null);
    setVendorForm({ name: '', email: '', contactNumber: '', address: '' });
    await refreshAll();
  };

  const onDeleteVendor = async (id: string) => {
    if (!confirm('Delete this vendor?')) return;
    await api.delete(`/vendors/${id}`);
    await refreshAll();
  };

  // Assets delete
  const onDeleteAsset = async (id: string) => {
    if (!confirm('Delete this asset?')) return;
    await api.delete(`/assets/${id}`);
    await refreshAll();
  };

  return (
    <div className="animate-in space-y-6">
      <h1 className="text-3xl font-bold">Admin Panel</h1>
      <Tabs defaultValue="departments">
        <TabsList>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="capital">Capital Assets</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Assets</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
        </TabsList>

        <TabsContent value="departments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Departments</CardTitle>
              <Dialog open={openDeptDialog} onOpenChange={(v) => { setOpenDeptDialog(v); if (!v) { setEditingDept(null); setDeptForm({ name: '', type: 'major' }); } }}>
                <DialogTrigger asChild>
                  <Button size="sm">{editingDept ? 'Edit Department' : 'Add Department'}</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingDept ? 'Edit Department' : 'Add Department'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm">Name</label>
                      <Input value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm">Type</label>
                      <Select value={deptForm.type} onValueChange={(val) => setDeptForm({ ...deptForm, type: val as any })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="major">major</SelectItem>
                          <SelectItem value="academic">academic</SelectItem>
                          <SelectItem value="service">service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      {editingDept ? (
                        <Button onClick={onUpdateDepartment}>Update</Button>
                      ) : (
                        <Button onClick={onCreateDepartment}>Create</Button>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((d) => (
                    <TableRow key={d._id}>
                      <TableCell>{d.name}</TableCell>
                      <TableCell>{d.type}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => { setEditingDept(d); setDeptForm({ name: d.name, type: d.type }); setOpenDeptDialog(true); }}>Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => onDeleteDepartment(d._id)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capital">
          <Card>
            <CardHeader>
              <CardTitle>Capital Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Subcategory</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {capital.map((a) => (
                    <TableRow key={a._id}>
                      <TableCell>{a.items?.[0]?.itemName}{a.items?.length > 1 ? ` +${a.items.length - 1}` : ''}</TableCell>
                      <TableCell>{a.departmentId}</TableCell>
                      <TableCell>{a.subcategory}</TableCell>
                      <TableCell>₹{a.grandTotal?.toLocaleString?.() || a.grandTotal}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="destructive" size="sm" onClick={() => onDeleteAsset(a._id)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Subcategory</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenue.map((a) => (
                    <TableRow key={a._id}>
                      <TableCell>{a.items?.[0]?.itemName}{a.items?.length > 1 ? ` +${a.items.length - 1}` : ''}</TableCell>
                      <TableCell>{a.departmentId}</TableCell>
                      <TableCell>{a.subcategory}</TableCell>
                      <TableCell>₹{a.grandTotal?.toLocaleString?.() || a.grandTotal}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="destructive" size="sm" onClick={() => onDeleteAsset(a._id)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Vendors</CardTitle>
              <Dialog open={openVendorDialog} onOpenChange={(v) => { setOpenVendorDialog(v); if (!v) { setEditingVendor(null); setVendorForm({ name: '', email: '', contactNumber: '', address: '' }); } }}>
                <DialogTrigger asChild>
                  <Button size="sm">{editingVendor ? 'Edit Vendor' : 'Add Vendor'}</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingVendor ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm">Name</label>
                      <Input value={vendorForm.name} onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm">Email</label>
                      <Input value={vendorForm.email} onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm">Contact</label>
                      <Input value={vendorForm.contactNumber} onChange={(e) => setVendorForm({ ...vendorForm, contactNumber: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm">Address</label>
                      <Input value={vendorForm.address} onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-2">
                      {editingVendor ? (
                        <Button onClick={onUpdateVendor}>Update</Button>
                      ) : (
                        <Button onClick={onCreateVendor}>Create</Button>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.map((v) => (
                    <TableRow key={v._id}>
                      <TableCell>{v.name}</TableCell>
                      <TableCell>{v.email}</TableCell>
                      <TableCell>{v.contactNumber}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => { setEditingVendor(v); setVendorForm({ name: v.name, email: v.email, contactNumber: v.contactNumber || '', address: v.address || '' }); setOpenVendorDialog(true); }}>Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => onDeleteVendor(v._id)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;


