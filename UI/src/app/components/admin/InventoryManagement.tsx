import { useState } from 'react';
import { useInventory } from '@/hooks';
import inventoryService from '@/api/inventory.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { Package, Plus, Trash2, Upload, Percent, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import type { InventoryItem } from '@/types';
import { BulkUploadInventory } from './BulkUploadInventory';

export function InventoryManagement() {
  const { inventory, isLoading, mutate } = useInventory();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<InventoryItem | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [editingMedicine, setEditingMedicine] = useState<InventoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingDiscount, setIsSavingDiscount] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [packingInfo, setPackingInfo] = useState('');
  const [substitutes, setSubstitutes] = useState('');
  const [type, setType] = useState<'injection' | 'tablet' | 'capsule' | 'syrup'>('tablet');
  const [dosage, setDosage] = useState('');
  const [dosageUnit, setDosageUnit] = useState('mg');
  const [quantityValue, setQuantityValue] = useState('');
  const [quantityUnit, setQuantityUnit] = useState('qty/strip');
  const [disease, setDisease] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('');

  // Update units based on type
  const handleTypeChange = (newType: 'injection' | 'tablet' | 'capsule' | 'syrup') => {
    setType(newType);
    if (newType === 'injection' || newType === 'syrup') {
      setDosageUnit('ml');
      setQuantityUnit('ml');
    } else {
      setDosageUnit('mg');
      setQuantityUnit('qty/strip');
    }
  };

  const handleAddMedicine = async () => {
    // Validate required fields
    if (!name || !dosage || !quantityValue || !disease || !price) {
      toast.error('Please fill in all required fields (Name, Dosage, Quantity, Disease, Price)');
      return;
    }

    setIsUpdating(true);
    try {
      const newItem: InventoryItem = {
        id: 0, // Backend will assign ID
        name,
        genericName: genericName || name,
        type,
        disease,
        dosageValue: parseFloat(dosage),
        dosageUnits: dosageUnit,
        quantityValue: parseInt(quantityValue),
        quantityUnits: quantityUnit,
        packingInfo: packingInfo || `Package of ${quantityValue} ${quantityUnit}`,
        mrp: parseFloat(price),
        discount: discount ? parseFloat(discount) : 0,
        finalPrice: parseFloat(price) - (discount ? parseFloat(discount) : 0),
        substitutes: substitutes ? substitutes.split(',').map(s => s.trim()).filter(s => s) : undefined,
        status: 1,
        createdBy: null,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        updatedBy: null,
      };
      
      const result = await inventoryService.addInventoryItem(newItem);
      if (result.success) {
        mutate();
        toast.success(result.message || 'Medicine added successfully');
        
        // Reset form
        setName('');
        setGenericName('');
        setPackingInfo('');
        setSubstitutes('');
        setType('tablet');
        setDosage('');
        setDosageUnit('mg');
        setQuantityValue('');
        setQuantityUnit('qty/strip');
        setDisease('');
        setPrice('');
        setDiscount('');
        setIsAddDialogOpen(false);
      } else {
        toast.error(result.error || 'Failed to add medicine');
      }
    } catch (error) {
      console.error('Add medicine error:', error);
      toast.error('Failed to add medicine');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkUploadSuccess = () => {
    mutate(); // Refresh inventory list
  };

  const getTypeColor = (type: string | null) => {
    switch (type) {
      case 'injection':
        return 'bg-blue-100 text-blue-800';
      case 'tablet':
        return 'bg-green-100 text-green-800';
      case 'capsule':
        return 'bg-purple-100 text-purple-800';
      case 'syrup':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEditMedicine = (medicine: InventoryItem) => {
    setEditingMedicine(medicine);
    setName(medicine.name || '');
    setGenericName(medicine.genericName || '');
    setPackingInfo(medicine.packingInfo || '');
    setSubstitutes(medicine.substitutes ? medicine.substitutes.join(', ') : '');
    setType((medicine.type as any) || 'tablet');
    setDosage(medicine.dosageValue.toString());
    setDosageUnit(medicine.dosageUnits || 'mg');
    setQuantityValue(medicine.quantityValue.toString());
    setQuantityUnit(medicine.quantityUnits || 'qty/strip');
    setDisease(medicine.disease || '');
    setPrice(medicine.mrp.toString());
    setDiscount(medicine.discount ? medicine.discount.toString() : '');
    setIsAddDialogOpen(true);
  };

  const openDiscountDialog = (medicine: InventoryItem) => {
    setSelectedMedicine(medicine);
    setDiscountPercentage(medicine.discount ? medicine.discount.toString() : '');
    setIsDiscountDialogOpen(true);
  };

  const handleSetDiscount = async () => {
    if (selectedMedicine && discountPercentage) {
      setIsSavingDiscount(true);
      try {
        const updatedItem = {
          ...selectedMedicine,
          discount: parseFloat(discountPercentage),
          finalPrice: selectedMedicine.mrp - parseFloat(discountPercentage),
          updatedDate: new Date().toISOString(),
        };
        
        const result = await inventoryService.updateInventoryItem(updatedItem);
        if (result.success) {
          mutate();
          toast.success(result.message || 'Discount updated successfully');
          setIsDiscountDialogOpen(false);
          setSelectedMedicine(null);
          setDiscountPercentage('');
        } else {
          toast.error(result.error || 'Failed to update discount');
        }
      } catch (error) {
        toast.error('Failed to update discount');
      } finally {
        setIsSavingDiscount(false);
      }
    }
  };

  const handleUpdateMedicine = async () => {
    // Validate required fields
    if (!editingMedicine) {
      toast.error('No medicine selected for editing');
      return;
    }
    
    if (!name || !dosage || !quantityValue || !disease || !price) {
      toast.error('Please fill in all required fields (Name, Dosage, Quantity, Disease, Price)');
      return;
    }

    setIsUpdating(true);
    try {
      const updatedItem: InventoryItem = {
        ...editingMedicine,
        name,
        genericName: genericName || name,
        type,
        disease,
        dosageValue: parseFloat(dosage),
        dosageUnits: dosageUnit,
        quantityValue: parseInt(quantityValue),
        quantityUnits: quantityUnit,
        packingInfo: packingInfo || `Package of ${quantityValue} ${quantityUnit}`,
        mrp: parseFloat(price),
        discount: discount ? parseFloat(discount) : 0,
        finalPrice: parseFloat(price) - (discount ? parseFloat(discount) : 0),
        substitutes: substitutes ? substitutes.split(',').map(s => s.trim()).filter(s => s) : undefined,
        updatedDate: new Date().toISOString(),
      };
     
      const result = await inventoryService.updateInventoryItem(updatedItem);
      if (result.success) {
        mutate();
        toast.success(result.message || 'Medicine updated successfully');
        
        // Reset form
        setName('');
        setGenericName('');
        setPackingInfo('');
        setSubstitutes('');
        setType('tablet');
        setDosage('');
        setDosageUnit('mg');
        setQuantityValue('');
        setQuantityUnit('qty/strip');
        setDisease('');
        setPrice('');
        setDiscount('');
        setIsAddDialogOpen(false);
        setEditingMedicine(null);
      } else {
        toast.error(result.error || 'Failed to update medicine');
      }
    } catch (error) {
      console.error('Update medicine error:', error);
      toast.error('Failed to update medicine');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveMedicine = async (id: number) => {
    setIsDeleting(id);
    try {
      const result = await inventoryService.deleteInventoryItem(id);
      if (result.success) {
        mutate();
        toast.success(result.message || 'Medicine removed successfully');
      } else {
        toast.error(result.error || 'Failed to remove medicine');
      }
    } catch (error) {
      toast.error('Failed to remove medicine');
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-6 h-6" />
            <CardTitle>Inventory Management</CardTitle>
          </div>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
            <p>Loading inventory...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <BulkUploadInventory
        isOpen={isBulkUploadOpen}
        onOpenChange={setIsBulkUploadOpen}
        onSuccess={handleBulkUploadSuccess}
        existingInventory={inventory}
      />
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-6 h-6" />
              <CardTitle>Inventory Management</CardTitle>
            </div>
            <CardDescription>
              Total medicines: {inventory.length}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setIsBulkUploadOpen(true)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Bulk Upload
            </Button>
            
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) {
                // Reset form when dialog closes
                setName('');
                setGenericName('');
                setPackingInfo('');
                setSubstitutes('');
                setType('tablet');
                setDosage('');
                setDosageUnit('mg');
                setQuantityValue('');
                setQuantityUnit('qty/strip');
                setDisease('');
                setPrice('');
                setDiscount('');
                setEditingMedicine(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Medicine
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}</DialogTitle>
                  <DialogDescription>
                    {editingMedicine ? 'Update the medicine details' : 'Enter the details of the medicine'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Medicine Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Paracetamol"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <Select value={type} onValueChange={(v) => handleTypeChange(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tablet">Tablet</SelectItem>
                        <SelectItem value="capsule">Capsule</SelectItem>
                        <SelectItem value="injection">Injection</SelectItem>
                        <SelectItem value="syrup">Syrup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dosage">Dosage *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="dosage"
                          value={dosage}
                          onChange={(e) => setDosage(e.target.value)}
                          placeholder="500"
                          className="flex-1"
                        />
                        <Select value={dosageUnit} onValueChange={setDosageUnit}>
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(type === 'injection' || type === 'syrup') ? (
                              <SelectItem value="ml">ml</SelectItem>
                            ) : (
                              <>
                                <SelectItem value="mg">mg</SelectItem>
                                <SelectItem value="g">g</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {type === 'injection' || type === 'syrup' ? 'Volume in ml' : 'Weight in mg/g'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity Value *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="quantity"
                          value={quantityValue}
                          onChange={(e) => setQuantityValue(e.target.value)}
                          placeholder="10"
                          className="flex-1"
                        />
                        <Select value={quantityUnit} onValueChange={setQuantityUnit}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(type === 'injection' || type === 'syrup') ? (
                              <SelectItem value="ml">ml</SelectItem>
                            ) : (
                              <SelectItem value="qty/strip">qty/strip</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {type === 'injection' || type === 'syrup' ? 'Total volume' : 'Quantity per strip'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="disease">Disease/Condition *</Label>
                    <Input
                      id="disease"
                      value={disease}
                      onChange={(e) => setDisease(e.target.value)}
                      placeholder="e.g., Fever, Diabetes, Pain"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Cost (₹) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount">Discount (₹) - Optional</Label>
                    <Input
                      id="discount"
                      type="number"
                      step="0.01"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty for no discount
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="generic-name">Generic Name - Optional</Label>
                    <Input
                      id="generic-name"
                      value={genericName}
                      onChange={(e) => setGenericName(e.target.value)}
                      placeholder="e.g., Acetaminophen"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="packing-info">Packing Info - Optional</Label>
                    <Input
                      id="packing-info"
                      value={packingInfo}
                      onChange={(e) => setPackingInfo(e.target.value)}
                      placeholder="e.g., 10 tablets in a strip"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="substitutes">Substitutes - Optional</Label>
                    <Input
                      id="substitutes"
                      value={substitutes}
                      onChange={(e) => setSubstitutes(e.target.value)}
                      placeholder="e.g., Ibuprofen, Aspirin (comma-separated)"
                    />
                  </div>
                </div>
                <Button 
                  onClick={editingMedicine ? handleUpdateMedicine : handleAddMedicine} 
                  className="w-full"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Saving...' : (editingMedicine ? 'Update Medicine' : 'Add Medicine')}
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Discount</DialogTitle>
              <DialogDescription>
                Set discount amount for {selectedMedicine?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">Original Price</Label>
                <Input
                  id="price"
                  type="text"
                  value={selectedMedicine ? `₹${selectedMedicine.mrp.toFixed(2)}` : ''}
                  readOnly
                  className="bg-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount">Discount (₹)</Label>
                <Input
                  id="discount"
                  type="number"
                  step="0.01"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="final-price">Final Price</Label>
                <Input
                  id="final-price"
                  type="text"
                  value={
                    selectedMedicine
                      ? `₹${(
                          selectedMedicine.mrp -
                          (discountPercentage ? parseFloat(discountPercentage) : 0)
                        ).toFixed(2)}`
                      : '₹0.00'
                  }
                  readOnly
                  className="bg-green-50 text-green-700 font-bold text-lg"
                />
              </div>
            </div>
            <Button 
              onClick={handleSetDiscount} 
              className="w-full"
              disabled={isSavingDiscount}
            >
              {isSavingDiscount ? 'Saving...' : 'Save Discount'}
            </Button>
          </DialogContent>
        </Dialog>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {inventory.map((med) => (
            <Card key={med.id} className="border-2">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base mb-1">{med.name}</CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardDescription className="text-xs">{med.disease}</CardDescription>
                      <Badge className={`${getTypeColor(med.type)} text-xs px-1.5 py-0`}>
                        {med.type}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDiscountDialog(med)}
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    {med.discount ? (
                      <div className="flex flex-col items-center">
                        <Percent className="w-4 h-4 text-green-600" />
                        <span className="text-[10px] text-green-600 font-medium">
                          ₹{med.discount.toFixed(0)}
                        </span>
                      </div>
                    ) : (
                      <Percent className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">Dosage</div>
                    <div className="font-medium">{med.dosageValue}{med.dosageUnits}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Quantity</div>
                    <div className="font-medium">{med.quantityValue} {med.quantityUnits}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">MRP</div>
                    <div className="font-medium">₹{med.mrp.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Final Price</div>
                    <div className="font-medium text-green-600">
                      ₹{(med.mrp - (med.discount || 0)).toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditMedicine(med)}
                    className="flex-1"
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveMedicine(med.id)}
                    className="flex-1"
                    disabled={isDeleting === med.id}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    {isDeleting === med.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Disease</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead>Quantity Value</TableHead>
                <TableHead className="text-right">MRP</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right">Final Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((med) => (
                <TableRow key={med.id}>
                  <TableCell className="font-medium">{med.name}</TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(med.type)}>
                      {med.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{med.disease}</TableCell>
                  <TableCell>{med.dosageValue}{med.dosageUnits}</TableCell>
                  <TableCell>{med.quantityValue} {med.quantityUnits}</TableCell>
                  <TableCell className="text-right">₹{med.mrp.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => openDiscountDialog(med)}
                      className="hover:bg-gray-100 px-2 py-1 rounded text-sm flex items-center gap-1 ml-auto"
                    >
                      {med.discount ? (
                        <span className="text-green-600 font-medium">
                          ₹{med.discount.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">₹0</span>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold text-green-600">
                      ₹{(med.mrp - (med.discount || 0)).toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditMedicine(med)}
                      disabled={isDeleting === med.id}
                    >
                      <Pencil className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMedicine(med.id)}
                      disabled={isDeleting === med.id}
                    >
                      <Trash2 className={`w-4 h-4 ${isDeleting === med.id ? 'animate-spin' : 'text-red-600'}`} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
    </>
  );
}