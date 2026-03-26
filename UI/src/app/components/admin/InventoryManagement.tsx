import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { Package, Plus, Trash2, Upload, Pencil, Loader2 } from 'lucide-react';
import { useInventory, formatInventoryPrice, getInventoryNumericValue } from '@/app/hooks/useInventory';
import { MedicineInventory } from '@/app/types/inventory';

export function InventoryManagement() {
  const { inventory, isLoading: isInitialLoading, isRefreshing, addMedicine, removeMedicine, updateMedicine } = useInventory();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineInventory | null>(null);
  const [editingMedicine, setEditingMedicine] = useState<MedicineInventory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<'tablet' | 'capsule' | 'injection' | 'syrup'>('tablet');
  const [dosageValue, setDosageValue] = useState('');
  const [dosageUnits, setDosageUnits] = useState('mg');
  const [quantityValue, setQuantityValue] = useState('');
  const [quantityUnits, setQuantityUnits] = useState('strip');
  const [disease, setDisease] = useState('');
  const [mrp, setMrp] = useState('');

  // Update units based on type
  const handleTypeChange = (newType: 'tablet' | 'capsule' | 'injection' | 'syrup') => {
    setType(newType);
    if (newType === 'injection' || newType === 'syrup') {
      setDosageUnits('ml');
      setQuantityUnits('ml');
    } else {
      setDosageUnits('mg');
      setQuantityUnits('strip');
    }
  };

  const handleAddMedicine = async () => {
    if (name && dosageValue && quantityValue && disease && mrp) {
      setIsSubmitting(true);
      try {
        const mrpValue = parseFloat(mrp);
        await addMedicine({
          name,
          type: type as 'tablet' | 'capsule' | 'injection' | 'syrup',
          disease,
          dosageValue: { source: dosageValue, parsedValue: parseFloat(dosageValue) },
          dosageUnits,
          quantityValue: parseInt(quantityValue),
          quantityUnits,
          mrp: { source: mrp, parsedValue: mrpValue },
          discount: { source: '0', parsedValue: 0 },
          finalPrice: { source: mrpValue.toFixed(2), parsedValue: mrpValue },
        });
        
        // Reset form
        setName('');
        setType('tablet');
        setDosageValue('');
        setDosageUnits('mg');
        setQuantityValue('');
        setQuantityUnits('strip');
        setDisease('');
        setMrp('');
        setIsAddDialogOpen(false);
      } catch {
        // Error is shown via toast from hook
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      setIsSubmitting(true);
      try {
        for (let i = 1; i < lines.length; i++) {
          const [nm, tp, dosVal, dosUnit, qv, qu, , mrpVal] = lines[i].split(',').map(s => s.trim());
          if (nm && tp && dosVal && qv && mrpVal) {
            const mrpNum = parseFloat(mrpVal);
            await addMedicine({
              name: nm,
              type: (tp.toLowerCase() === 'injection' || tp.toLowerCase() === 'syrup' ? tp.toLowerCase() : 'tablet') as any,
              dosageValue: { source: dosVal, parsedValue: parseFloat(dosVal) },
              dosageUnits: dosUnit || 'mg',
              quantityValue: parseInt(qv),
              quantityUnits: qu || 'strip',
              disease: 'General',
              mrp: { source: mrpVal, parsedValue: mrpNum },
              discount: { source: '0', parsedValue: 0 },
              finalPrice: { source: mrpNum.toFixed(2), parsedValue: mrpNum },
            });
          }
        }
        setIsBulkUploadOpen(false);
      } finally {
        setIsSubmitting(false);
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const template = 'Name,Type,Dosage Value,Dosage Unit,Quantity Value,Quantity Unit,MRP\nParacetamol,tablet,500,mg,10,strip,50\nIbuprofen,tablet,400,mg,10,strip,80\nInsulin,injection,10,ml,10,ml,800';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medicine_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tablet':    return 'bg-blue-100 text-blue-700 border-blue-200 font-normal';
      case 'capsule':   return 'bg-green-100 text-green-700 border-green-200 font-normal';
      case 'injection': return 'bg-purple-100 text-purple-700 border-purple-200 font-normal';
      case 'syrup':     return 'bg-orange-100 text-orange-700 border-orange-200 font-normal';
      default:          return 'bg-gray-100 text-gray-500 border-gray-200 font-normal';
    }
  };

  const handleEditMedicine = (medicine: MedicineInventory) => {
    setEditingMedicine(medicine);
    setName(medicine.name);
    setType(medicine.type as 'tablet' | 'capsule' | 'injection' | 'syrup');
    setDosageValue(String(getInventoryNumericValue(medicine.dosageValue)));
    setDosageUnits(medicine.dosageUnits);
    setQuantityValue(String(medicine.quantityValue));
    setQuantityUnits(medicine.quantityUnits);
    setDisease(medicine.disease);
    setMrp(String(getInventoryNumericValue(medicine.mrp)));
    setIsAddDialogOpen(true);
  };

  const handleUpdateMedicine = async () => {
    if (editingMedicine && name && dosageValue && quantityValue && disease && mrp) {
      setIsSubmitting(true);
      try {
        const mrpValue = parseFloat(mrp);
        await updateMedicine(editingMedicine.id, {
          ...editingMedicine,
          name,
          type: type as 'tablet' | 'capsule' | 'injection' | 'syrup',
          disease,
          dosageValue: { source: dosageValue, parsedValue: parseFloat(dosageValue) },
          dosageUnits,
          quantityValue: parseInt(quantityValue),
          quantityUnits,
          mrp: { source: mrp, parsedValue: mrpValue },
          discount: { source: '0', parsedValue: 0 },
          finalPrice: { source: mrpValue.toFixed(2), parsedValue: mrpValue },
        });
        
        // Reset form
        setName('');
        setType('tablet');
        setDosageValue('');
        setDosageUnits('mg');
        setQuantityValue('');
        setQuantityUnits('strip');
        setDisease('');
        setMrp('');
        setIsAddDialogOpen(false);
        setEditingMedicine(null);
      } catch {
        // Error is shown via toast from hook
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Card className="border-gray-100 shadow-lg rounded-2xl">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-6 h-6 text-purple-600" />
              <CardTitle className="text-gray-800 font-normal">Inventory Management</CardTitle>
            </div>
            <CardDescription className="text-gray-500 font-light">
              {isInitialLoading ? 'Loading medicines...' : `Total medicines: ${inventory.length}`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {isInitialLoading && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-md">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-600">Loading...</span>
              </div>
            )}
            <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Upload
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Upload Medicines</DialogTitle>
                  <DialogDescription>
                    Upload a CSV file with medicine details
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>CSV File Format</Label>
                    <p className="text-sm text-muted-foreground">
                      Name, Type, Dosage, Quantity Value, Disease, Price
                    </p>
                    <Button variant="outline" onClick={downloadTemplate} className="w-full">
                      Download Template
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="csv-upload">Upload CSV</Label>
                    <Input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleBulkUpload}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
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
                setStockQuantity('50');
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
                      <Label htmlFor="dosage-value">Dosage Value *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="dosage-value"
                          value={dosageValue}
                          onChange={(e) => setDosageValue(e.target.value)}
                          placeholder="500"
                          className="flex-1"
                        />
                        <Select value={dosageUnits} onValueChange={setDosageUnits}>
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {type === 'syrup' ? (
                              <SelectItem value="ml">ml</SelectItem>
                            ) : type === 'injection' ? (
                              <>
                                <SelectItem value="mg">mg</SelectItem>
                                <SelectItem value="ml">ml</SelectItem>
                                <SelectItem value="mcg">mcg</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="mg">mg</SelectItem>
                                <SelectItem value="g">g</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
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
                        <Select value={quantityUnits} onValueChange={setQuantityUnits}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="strip">strip</SelectItem>
                            <SelectItem value="ml">ml</SelectItem>
                            <SelectItem value="qty">qty</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
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
                    <Label htmlFor="mrp">Price (₹) *</Label>
                    <Input
                      id="mrp"
                      type="number"
                      step="0.01"
                      value={mrp}
                      onChange={(e) => setMrp(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <Button onClick={editingMedicine ? handleUpdateMedicine : handleAddMedicine} className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />{editingMedicine ? 'Updating...' : 'Adding...'}</>) : (editingMedicine ? 'Update Medicine' : 'Add Medicine')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Loading State */}
        {isInitialLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Loading inventory data...</p>
            </div>
          </div>
        )}

        {/* Mobile Card View */}
        {!isInitialLoading && (
          <div className="md:hidden space-y-4">
            {inventory.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="py-8 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No medicines in inventory</p>
                </CardContent>
              </Card>
            ) : (
              inventory.map((med) => (
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
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs">Dosage</div>
                        <div className="font-medium">{getInventoryNumericValue(med.dosageValue)}{med.dosageUnits}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Quantity</div>
                        <div className="font-medium">{med.quantityValue} {med.quantityUnits}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Price</div>
                        <div className="font-medium text-green-600">{formatInventoryPrice(med.mrp)}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditMedicine(med)}
                        className="flex-1"
                        disabled={isRefreshing}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => { await removeMedicine(med.id); }}
                        className="flex-1"
                        disabled={isRefreshing}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Desktop Table View */}
        {!isInitialLoading && (
          <div className="hidden md:block overflow-x-auto">
            {inventory.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="py-20 text-center">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No medicines in inventory</p>
                  <p className="text-gray-400 text-sm mt-2">Start by adding a new medicine</p>
                </CardContent>
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Disease</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
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
                      <TableCell>{getInventoryNumericValue(med.dosageValue)}{med.dosageUnits}</TableCell>
                      <TableCell>{med.quantityValue} {med.quantityUnits}</TableCell>
                      <TableCell className="text-right">{formatInventoryPrice(med.mrp)}</TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditMedicine(med)}
                          disabled={isRefreshing}
                        >
                          <Pencil className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => { await removeMedicine(med.id); }}
                          disabled={isRefreshing}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}