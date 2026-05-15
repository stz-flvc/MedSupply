import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateProduct, getListVendorProductsQueryKey, getGetVendorStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Upload, FileText, ImageIcon, X } from "lucide-react";

const vendorNav = [
  { label: "My Products", href: "/vendor/products" },
  { label: "Upload Product", href: "/vendor/upload" },
  { label: "Notifications", href: "/vendor/notifications" },
];

const CATEGORIES = [
  "Antibiotics", "Analgesics", "Vitamins & Supplements", "Cardiovascular",
  "Oncology", "Antivirals", "Antifungals", "Hormones", "Vaccines",
  "Dermatology", "Ophthalmology", "Respiratory", "Gastrointestinal",
];

export default function VendorUpload() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const createProduct = useCreateProduct();

  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    imageUrl: "",
    coaUrl: "",
    nafdacNumber: "",
    barcode: "",
    pricePerUnit: "",
    quantityAvailable: "",
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingCOA, setIsUploadingCOA] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "imageUrl" | "coaUrl") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (field === "imageUrl") setIsUploadingImage(true);
    else setIsUploadingCOA(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = "Upload failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setForm((f) => ({ ...f, [field]: data.url }));
      toast({ 
        title: field === "imageUrl" ? "Image uploaded" : "COA uploaded", 
        description: `${field === "imageUrl" ? "Product image" : "COA document"} successfully uploaded.` 
      });
    } catch (err) {
      setError(`Failed to upload ${field === "imageUrl" ? "image" : "document"}. ${(err as Error).message}`);
    } finally {
      if (field === "imageUrl") setIsUploadingImage(false);
      else setIsUploadingCOA(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category) { setError("Please select a category"); return; }
    setError("");
    createProduct.mutate(
      {
        data: {
          name: form.name,
          category: form.category,
          description: form.description,
          imageUrl: form.imageUrl || null,
          coaUrl: form.coaUrl || null,
          nafdacNumber: form.nafdacNumber || null,
          barcode: form.barcode || null,
          pricePerUnit: parseFloat(form.pricePerUnit),
          quantityAvailable: parseInt(form.quantityAvailable, 10),
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListVendorProductsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetVendorStatsQueryKey() });
          toast({ title: "Product submitted", description: "Your product is pending admin verification." });
          navigate("/vendor/products");
        },
        onError: (err: unknown) => setError((err as { data?: { error?: string } })?.data?.error || "Failed to upload product"),
      }
    );
  };

  return (
    <DashboardLayout navItems={vendorNav}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold mb-1">Upload New Product</h1>
        <p className="text-sm text-muted-foreground mb-6">Products require admin verification before appearing on the marketplace.</p>

        <div className="bg-card border border-border rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Product Name *</Label>
                <Input placeholder="Amoxicillin 500mg" value={form.name} onChange={set("name")} required />
              </div>
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Textarea placeholder="Describe the product, dosage, packaging, etc." value={form.description} onChange={set("description")} required rows={3} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Product Image *</Label>
                <div className={`relative group border-2 border-dashed rounded-xl p-4 transition-all duration-200 flex flex-col items-center justify-center gap-2 min-h-[140px] ${form.imageUrl ? 'border-primary/20 bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30'}`}>
                  {form.imageUrl ? (
                    <>
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border bg-white shadow-sm">
                        <img src={form.imageUrl} alt="Preview" className="w-full h-full object-contain p-1" />
                        <button 
                          type="button" 
                          onClick={() => setForm(f => ({ ...f, imageUrl: "" }))}
                          className="absolute top-1 right-1 bg-background/80 hover:bg-background rounded-full p-1 shadow-sm transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[10px] text-primary font-medium flex items-center gap-1 mt-1">
                        <CheckCircle className="w-3 h-3" /> Image uploaded
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                        <ImageIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium">Click to upload image</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">JPEG or PNG (max 5MB)</p>
                      </div>
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png" 
                        onChange={(e) => handleFileUpload(e, "imageUrl")} 
                        disabled={isUploadingImage}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        required={!form.imageUrl}
                      />
                    </>
                  )}
                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-xl z-10">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                      <p className="text-[10px] font-medium animate-pulse">Uploading...</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">COA Document *</Label>
                <div className={`relative group border-2 border-dashed rounded-xl p-4 transition-all duration-200 flex flex-col items-center justify-center gap-2 min-h-[140px] ${form.coaUrl ? 'border-primary/20 bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30'}`}>
                  {form.coaUrl ? (
                    <>
                      <div className="w-12 h-12 rounded-lg bg-white border border-border shadow-sm flex items-center justify-center relative">
                        <FileText className="w-6 h-6 text-primary" />
                        <button 
                          type="button" 
                          onClick={() => setForm(f => ({ ...f, coaUrl: "" }))}
                          className="absolute -top-2 -right-2 bg-background border border-border rounded-full p-1 shadow-sm hover:bg-muted transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-center mt-1">
                        <p className="text-[10px] text-primary font-medium flex items-center justify-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500" /> COA Uploaded
                        </p>
                        <a href={form.coaUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground hover:text-primary underline mt-0.5 block">
                          View document
                        </a>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium">Click to upload COA</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">PDF, JPEG or PNG (max 5MB)</p>
                      </div>
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png,application/pdf" 
                        onChange={(e) => handleFileUpload(e, "coaUrl")} 
                        disabled={isUploadingCOA}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        required={!form.coaUrl}
                      />
                    </>
                  )}
                  {isUploadingCOA && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-xl z-10">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                      <p className="text-[10px] font-medium animate-pulse">Uploading...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>NAFDAC Number *</Label>
                <Input placeholder="NRN-00000000A" value={form.nafdacNumber} onChange={set("nafdacNumber")} required />
              </div>
              <div className="space-y-1.5">
                <Label>Barcode *</Label>
                <Input placeholder="000000000000" value={form.barcode} onChange={set("barcode")} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Price Per Unit (₦) *</Label>
                <Input type="number" min="0" step="0.01" placeholder="5000.00" value={form.pricePerUnit} onChange={set("pricePerUnit")} required />
              </div>
              <div className="space-y-1.5">
                <Label>Quantity Available *</Label>
                <Input type="number" min="1" placeholder="1000" value={form.quantityAvailable} onChange={set("quantityAvailable")} required />
              </div>
            </div>

            {error && <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</div>}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => navigate("/vendor/products")}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={createProduct.isPending || isUploadingImage || isUploadingCOA}>
                {createProduct.isPending ? "Uploading..." : "Submit for Verification"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
