import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Checkbox } from '@/app/components/ui/checkbox';
import { toast } from 'sonner';
import { Upload, X, Save, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useSaveInventory } from '@/hooks';
import type { InventoryItem } from '@/types';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// Common dosage units
const DOSAGE_UNITS = ['mg', 'g', 'ml', 'mcg', 'IU'];

// Common quantity units
const QUANTITY_UNITS = ['qty/strip', 'qty/bottle', 'ml', 'bottle', 'vial'];

// Common diseases for dropdown
const COMMON_DISEASES = [
  'Fever',
  'Pain',
  'Inflammation',
  'Bacterial Infection',
  'Diabetes',
  'Cough',
  'Acidity',
  'Allergy',
  'Cholesterol',
  'Hypertension',
  'Vitamin Deficiency',
  'GERD',
  'Asthma',
  'Severe Infection',
  'Cold',
  'Headache',
  'Nausea',
  'Indigestion',
  'Thyroid',
  'Arthritis',
  'Other',
];

interface BulkUploadInventoryProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  existingInventory: InventoryItem[];
}

interface ParsedInventoryRow {
  id: string; // Unique ID for tracking in UI
  selected: boolean;
  name: string;
  type: 'injection' | 'tablet' | 'capsule' | 'syrup';
  disease: string;
  dosageValue: string;
  dosageUnits: string;
  quantityValue: string;
  quantityUnits: string;
  mrp: string;
  discount: string;
  errors: string[];
}

export function BulkUploadInventory({ isOpen, onOpenChange, onSuccess, existingInventory }: BulkUploadInventoryProps) {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [parsedData, setParsedData] = useState<ParsedInventoryRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { saveInventory } = useSaveInventory();

  const resetDialog = () => {
    setStep('upload');
    setParsedData([]);
    setIsProcessing(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'csv') {
        await parseCSV(file);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        await parseXLSX(file);
      } else {
        toast.error('Unsupported file format. Please upload CSV or XLSX file.');
        return;
      }

      setStep('preview');
    } catch (error) {
      console.error('File parsing error:', error);
      toast.error('Failed to parse file. Please check the format.');
    } finally {
      setIsProcessing(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const parseCSV = (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = processRawData(results.data as any[]);
          setParsedData(rows);
          resolve();
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  };

  const parseXLSX = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          
          const rows = processRawData(jsonData as any[]);
          setParsedData(rows);
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  };

  const processRawData = (rawData: any[]): ParsedInventoryRow[] => {
    return rawData.map((row, index) => {
      const errors: string[] = [];
      
      // Normalize column names (handle different casings and spaces)
      const normalizedRow: any = {};
      Object.keys(row).forEach((key) => {
        const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '');
        normalizedRow[normalizedKey] = row[key];
      });

      // Extract and validate fields
      const name = String(normalizedRow.name || normalizedRow.medicinename || '').trim();
      const type = String(normalizedRow.type || '').trim().toLowerCase();
      const disease = String(normalizedRow.disease || normalizedRow.condition || '').trim();
      const dosageValue = String(normalizedRow.dosage || normalizedRow.dosagevalue || '').trim();
      const dosageUnits = String(normalizedRow.dosageunits || normalizedRow.dosageunit || 'mg').trim();
      const quantityValue = String(normalizedRow.quantity || normalizedRow.quantityvalue || '').trim();
      const quantityUnits = String(normalizedRow.quantityunits || normalizedRow.quantityunit || 'qty/strip').trim();
      const mrp = String(normalizedRow.mrp || normalizedRow.price || normalizedRow.cost || '').trim();
      const discount = String(normalizedRow.discount || '0').trim();

      // Validate required fields
      if (!name) errors.push('Name is required');
      if (!type || !['injection', 'tablet', 'capsule', 'syrup'].includes(type)) {
        errors.push('Type must be: injection, tablet, capsule, or syrup');
      }
      if (!disease) errors.push('Disease is required');
      if (!dosageValue || isNaN(parseFloat(dosageValue))) errors.push('Valid dosage is required');
      if (!quantityValue || isNaN(parseInt(quantityValue))) errors.push('Valid quantity is required');
      if (!mrp || isNaN(parseFloat(mrp))) errors.push('Valid MRP is required');

      return {
        id: `row-${index}`,
        selected: errors.length === 0, // Auto-select valid rows
        name,
        type: (type as any) || 'tablet',
        disease,
        dosageValue,
        dosageUnits,
        quantityValue,
        quantityUnits,
        mrp,
        discount: discount || '0',
        errors,
      };
    });
  };

  const handleToggleAll = (checked: boolean) => {
    setParsedData(prev => prev.map(row => ({ ...row, selected: checked && row.errors.length === 0 })));
  };

  const handleToggleRow = (id: string, checked: boolean) => {
    setParsedData(prev => prev.map(row => row.id === id ? { ...row, selected: checked } : row));
  };

  const handleUpdateRow = (id: string, field: keyof ParsedInventoryRow, value: any) => {
    setParsedData(prev => prev.map(row => {
      if (row.id === id) {
        const updated = { ...row, [field]: value };
        // Re-validate on update
        updated.errors = validateRow(updated);
        return updated;
      }
      return row;
    }));
  };

  const validateRow = (row: ParsedInventoryRow): string[] => {
    const errors: string[] = [];
    
    if (!row.name.trim()) errors.push('Name is required');
    if (!['injection', 'tablet', 'capsule', 'syrup'].includes(row.type)) {
      errors.push('Invalid type');
    }
    if (!row.disease.trim()) errors.push('Disease is required');
    if (!row.dosageValue || isNaN(parseFloat(row.dosageValue))) errors.push('Valid dosage is required');
    if (!row.quantityValue || isNaN(parseInt(row.quantityValue))) errors.push('Valid quantity is required');
    if (!row.mrp || isNaN(parseFloat(row.mrp))) errors.push('Valid MRP is required');
    if (row.discount && isNaN(parseFloat(row.discount))) errors.push('Discount must be a number');

    return errors;
  };

  const handleSave = async () => {
    const selectedRows = parsedData.filter(row => row.selected && row.errors.length === 0);

    if (selectedRows.length === 0) {
      toast.error('Please select at least one valid row to import');
      return;
    }

    setIsProcessing(true);

    try {
      // Convert parsed data to InventoryItem format
      const newItems: InventoryItem[] = selectedRows.map(row => ({
        id: 0, // Backend will assign ID
        name: row.name,
        type: row.type,
        disease: row.disease,
        dosageValue: parseFloat(row.dosageValue),
        dosageUnits: row.dosageUnits,
        quantityValue: parseInt(row.quantityValue),
        quantityUnits: row.quantityUnits,
        mrp: parseFloat(row.mrp),
        discount: parseFloat(row.discount) || 0,
        finalPrice: parseFloat(row.mrp) - (parseFloat(row.discount) || 0),
        status: 1,
        createdBy: null,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        updatedBy: null,
      }));

      // Call save API with only the newly imported items
      await saveInventory(newItems);
      
      toast.success(`Successfully imported ${selectedRows.length} medicine(s)`);
      onSuccess();
      resetDialog();
      onOpenChange(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save inventory. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      ['Name', 'Type', 'Disease', 'Dosage', 'Dosage Units', 'Quantity', 'Quantity Units', 'MRP', 'Discount'],
      ['Paracetamol', 'tablet', 'Fever', '500', 'mg', '10', 'qty/strip', '5.50', '0.50'],
      ['Aspirin', 'tablet', 'Pain', '75', 'mg', '15', 'qty/strip', '8.00', '0'],
      ['Insulin', 'injection', 'Diabetes', '10', 'ml', '10', 'ml', '450.00', '20'],
      ['Cough Syrup', 'syrup', 'Cough', '100', 'ml', '100', 'ml', '85.00', '5'],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
    XLSX.writeFile(workbook, 'inventory_template.xlsx');
    
    toast.success('Template downloaded successfully');
  };

  const selectedCount = parsedData.filter(row => row.selected).length;
  const validCount = parsedData.filter(row => row.errors.length === 0).length;
  const errorCount = parsedData.filter(row => row.errors.length > 0).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) resetDialog();
      onOpenChange(open);
    }}>
      <DialogContent 
        className={step === 'preview' 
          ? '!max-w-[100vw] sm:!max-w-[100vw] w-screen h-screen overflow-hidden flex flex-col p-0 rounded-none m-0' 
          : 'w-[90vw] !max-w-[1800px] sm:!max-w-[1800px] h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-0'}
      >
        <div className="p-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Bulk Upload Inventory
            </DialogTitle>
            <DialogDescription>
              {step === 'upload' 
                ? 'Upload a CSV or XLSX file with medicine details'
                : `Review and select items to import (${selectedCount} selected, ${errorCount} errors)`
              }
            </DialogDescription>
          </DialogHeader>
        </div>

        {step === 'upload' && (
          <div className="space-y-6 py-4 px-6">
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  File Format Requirements
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                  <li><strong>Supported formats:</strong> CSV, XLSX (.xlsx, .xls)</li>
                  <li><strong>Required columns:</strong> Name, Type, Disease, Dosage, Quantity, MRP</li>
                  <li><strong>Type values:</strong> tablet, capsule, injection, syrup</li>
                  <li><strong>Optional columns:</strong> Dosage Units, Quantity Units, Discount</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label>Download Template</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadTemplate}
                  className="w-full"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Download XLSX Template
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file-upload">Upload File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                />
                <p className="text-xs text-muted-foreground">
                  Accepts .csv, .xlsx, or .xls files
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Summary Stats */}
            <div className="flex gap-4 text-sm px-6 pt-4 pb-2 flex-shrink-0">
              <div className="bg-blue-50 px-3 py-2 rounded">
                <span className="font-semibold">{parsedData.length}</span> Total Rows
              </div>
              <div className="bg-green-50 px-3 py-2 rounded">
                <span className="font-semibold">{validCount}</span> Valid
              </div>
              <div className="bg-red-50 px-3 py-2 rounded">
                <span className="font-semibold">{errorCount}</span> Errors
              </div>
              <div className="bg-purple-50 px-3 py-2 rounded">
                <span className="font-semibold">{selectedCount}</span> Selected
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 min-h-0 overflow-auto px-6">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="w-[60px] border-r bg-white sticky left-0 z-20">
                        <Checkbox
                          checked={parsedData.length > 0 && parsedData.filter(r => r.errors.length === 0).every(r => r.selected)}
                          onCheckedChange={handleToggleAll}
                        />
                      </TableHead>
                      <TableHead className="min-w-[200px]">Name</TableHead>
                      <TableHead className="min-w-[140px]">Type</TableHead>
                      <TableHead className="min-w-[200px]">Disease</TableHead>
                      <TableHead className="min-w-[120px]">Dosage</TableHead>
                      <TableHead className="min-w-[100px]">Units</TableHead>
                      <TableHead className="min-w-[120px]">Quantity</TableHead>
                      <TableHead className="min-w-[120px]">Units</TableHead>
                      <TableHead className="min-w-[120px]">MRP (₹)</TableHead>
                      <TableHead className="min-w-[120px]">Discount (₹)</TableHead>
                      <TableHead className="min-w-[120px] border-l bg-white sticky right-0 z-20">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row) => (
                      <TableRow key={row.id} className={row.errors.length > 0 ? 'bg-red-50' : ''}>
                        <TableCell className={`border-r sticky left-0 z-10 ${row.errors.length > 0 ? 'bg-red-50' : 'bg-white'}`}>
                          <Checkbox
                            checked={row.selected}
                            onCheckedChange={(checked) => handleToggleRow(row.id, checked as boolean)}
                            disabled={row.errors.length > 0}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.name}
                            onChange={(e) => handleUpdateRow(row.id, 'name', e.target.value)}
                            className={`h-8 text-sm ${row.errors.some(e => e.includes('Name')) ? 'border-red-500' : ''}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.type}
                            onValueChange={(value) => handleUpdateRow(row.id, 'type', value)}
                          >
                            <SelectTrigger className={`h-8 text-sm ${row.errors.some(e => e.includes('Type')) ? 'border-red-500' : ''}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tablet">Tablet</SelectItem>
                              <SelectItem value="capsule">Capsule</SelectItem>
                              <SelectItem value="injection">Injection</SelectItem>
                              <SelectItem value="syrup">Syrup</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.disease}
                            onValueChange={(value) => handleUpdateRow(row.id, 'disease', value)}
                          >
                            <SelectTrigger className={`h-8 text-sm ${row.errors.some(e => e.includes('Disease')) ? 'border-red-500' : ''}`}>
                              <SelectValue placeholder="Select disease" />
                            </SelectTrigger>
                            <SelectContent>
                              {COMMON_DISEASES.map((disease) => (
                                <SelectItem key={disease} value={disease}>
                                  {disease}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.dosageValue}
                            onChange={(e) => handleUpdateRow(row.id, 'dosageValue', e.target.value)}
                            className={`h-8 text-sm ${row.errors.some(e => e.includes('dosage')) ? 'border-red-500' : ''}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.dosageUnits}
                            onValueChange={(value) => handleUpdateRow(row.id, 'dosageUnits', value)}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DOSAGE_UNITS.map((unit) => (
                                <SelectItem key={unit} value={unit}>
                                  {unit}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.quantityValue}
                            onChange={(e) => handleUpdateRow(row.id, 'quantityValue', e.target.value)}
                            className={`h-8 text-sm ${row.errors.some(e => e.includes('quantity')) ? 'border-red-500' : ''}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.quantityUnits}
                            onValueChange={(value) => handleUpdateRow(row.id, 'quantityUnits', value)}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {QUANTITY_UNITS.map((unit) => (
                                <SelectItem key={unit} value={unit}>
                                  {unit}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.mrp}
                            onChange={(e) => handleUpdateRow(row.id, 'mrp', e.target.value)}
                            className={`h-8 text-sm ${row.errors.some(e => e.includes('MRP')) ? 'border-red-500' : ''}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.discount}
                            onChange={(e) => handleUpdateRow(row.id, 'discount', e.target.value)}
                            className="h-8 text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          {row.errors.length > 0 ? (
                            <div className="flex items-center gap-1 text-red-600" title={row.errors.join(', ')}>
                              <AlertCircle className="w-4 h-4" />
                              <span className="text-xs">Error</span>
                            </div>
                          ) : (
                            <span className="text-xs text-green-600 font-medium">Valid</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center p-4 border-t flex-shrink-0 bg-white">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('upload')}
                disabled={isProcessing}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Different File
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetDialog();
                    onOpenChange(false);
                  }}
                  disabled={isProcessing}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isProcessing || selectedCount === 0}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isProcessing ? 'Saving...' : `Save ${selectedCount} Items`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
