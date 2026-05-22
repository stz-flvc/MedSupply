import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useSignupVendor, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Package, ArrowLeft, X, Upload, FileText, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PRODUCT_CATEGORIES = [
  "Antibiotics", "Analgesics", "Vitamins & Supplements", "Cardiovascular",
  "Oncology", "Antivirals", "Antifungals", "Hormones", "Vaccines",
  "Dermatology", "Ophthalmology", "Respiratory", "Gastrointestinal",
];

export default function VendorSignup() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const signupMutation = useSignupVendor();
  const { toast } = useToast();
  const [error, setError] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isUploadingImporter, setIsUploadingImporter] = useState(false);
  const [isUploadingCAC, setIsUploadingCAC] = useState(false);

  const [form, setForm] = useState({
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    password: "",
    nafdacLicense: "",
    importerLicenseUrl: "",
    cacDocumentUrl: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "importerLicenseUrl" | "cacDocumentUrl") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setError("File is too large. Maximum size is 20MB.");
      return;
    }

    if (field === "importerLicenseUrl") setIsUploadingImporter(true);
    else setIsUploadingCAC(true);
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
        title: "Document uploaded", 
        description: `Successfully uploaded.` 
      });
    } catch (err) {
      setError(`Failed to upload document. ${(err as Error).message}`);
    } finally {
      if (field === "importerLicenseUrl") setIsUploadingImporter(false);
      else setIsUploadingCAC(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.importerLicenseUrl) { setError("Please upload your Importer/Distributor License"); return; }
    if (!form.cacDocumentUrl) { setError("Please upload your CAC Document"); return; }
    if (selectedCategories.length === 0) { setError("Please select at least one product category"); return; }
    setError("");
    signupMutation.mutate(
      {
        data: {
          companyName: form.companyName,
          contactPerson: form.contactPerson,
          phone: form.phone,
          email: form.email,
          password: form.password,
          nafdacLicense: form.nafdacLicense,
          importerLicenseUrl: form.importerLicenseUrl || null,
          cacDocumentUrl: form.cacDocumentUrl || null,
          productCategories: selectedCategories,
        },
      },
      {
        onSuccess: (data) => {
          qc.setQueryData(getGetMeQueryKey(), data.user);
          navigate("/pending");
        },
        onError: (err: unknown) => setError((err as { data?: { error?: string } })?.data?.error || "Registration failed"),
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-screen-xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
            <Package className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-base">MedSupply</span>
        </div>

        <div className="max-w-xl mx-auto">
          <div className="mb-6">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
            <h1 className="text-2xl font-bold">Register as Vendor</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your documents will be reviewed for NAFDAC compliance before approval.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Company Name *</Label>
                  <Input placeholder="PharmaCo Ltd" value={form.companyName} onChange={set("companyName")} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact Person *</Label>
                  <Input placeholder="Jane Smith" value={form.contactPerson} onChange={set("contactPerson")} required />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Phone Number *</Label>
                  <Input placeholder="+234 800 000 0000" value={form.phone} onChange={set("phone")} required />
                </div>
                <div className="space-y-1.5">
                  <Label>NAFDAC License Number *</Label>
                  <Input placeholder="NRN-00000000A" value={form.nafdacLicense} onChange={set("nafdacLicense")} required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Importer/Distributor License *</Label>
                <div className="relative border-2 border-dashed border-border rounded-lg p-4 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center text-center group">
                  <input
                    type="file"
                    accept=".jpeg,.png,.jpg,.webp,.pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => handleFileUpload(e, "importerLicenseUrl")}
                    disabled={isUploadingImporter}
                  />
                  {form.importerLicenseUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                      <span className="text-sm font-medium">Document uploaded</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Upload className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-sm font-medium">
                        {isUploadingImporter ? "Uploading..." : "Click or drag file to upload"}
                      </div>
                      <div className="text-xs text-muted-foreground">JPEG, PNG, WEBP, or PDF</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>CAC Document *</Label>
                <div className="relative border-2 border-dashed border-border rounded-lg p-4 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center text-center group">
                  <input
                    type="file"
                    accept=".jpeg,.jpg,.webp,.pdf,.doc,.docx"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => handleFileUpload(e, "cacDocumentUrl")}
                    disabled={isUploadingCAC}
                  />
                  {form.cacDocumentUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                      <span className="text-sm font-medium">Document uploaded</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-sm font-medium">
                        {isUploadingCAC ? "Uploading..." : "Click or drag file to upload"}
                      </div>
                      <div className="text-xs text-muted-foreground">PDF, DOC, DOCX, JPEG, WEBP</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Product Categories *</Label>
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedCategories.includes(cat)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {selectedCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedCategories.map((cat) => (
                      <Badge key={cat} variant="secondary" className="gap-1 text-xs">
                        {cat}
                        <button type="button" onClick={() => toggleCategory(cat)}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label>Email Address *</Label>
                  <Input type="email" placeholder="you@company.com" value={form.email} onChange={set("email")} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Password *</Label>
                  <Input type="password" placeholder="Min. 6 characters" value={form.password} onChange={set("password")} required minLength={6} />
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</div>
              )}

              <Button type="submit" className="w-full" disabled={signupMutation.isPending}>
                {signupMutation.isPending ? "Submitting..." : "Submit Registration"}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
