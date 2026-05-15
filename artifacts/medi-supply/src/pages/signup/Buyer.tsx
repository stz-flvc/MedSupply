import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useSignupBuyer } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, ArrowLeft, Upload, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BuyerSignup() {
  const [, navigate] = useLocation();
  const signupMutation = useSignupBuyer();
  const { toast } = useToast();
  const [error, setError] = useState("");
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    companyName: "",
    companyAddress: "",
    phone: "",
    email: "",
    password: "",
    businessType: "" as "wholesaler" | "hospital" | "pharmacy" | "",
    cacNumber: "",
    businessLicenseUrl: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setError("File is too large. Maximum size is 20MB.");
      return;
    }

    setIsUploadingLicense(true);
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
        } catch (err) {
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setForm((f) => ({ ...f, businessLicenseUrl: data.url }));
      toast({
        title: "Document uploaded",
        description: `Successfully uploaded.`
      });
    } catch (err) {
      setError(`Failed to upload document. ${(err as Error).message}`);
    } finally {
      setIsUploadingLicense(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessLicenseUrl) { setError("Please upload your Business License"); return; }
    if (!form.businessType) { setError("Please select a business type"); return; }
    setError("");
    signupMutation.mutate(
      {
        data: {
          fullName: form.fullName,
          companyName: form.companyName,
          companyAddress: form.companyAddress,
          phone: form.phone,
          email: form.email,
          password: form.password,
          businessType: form.businessType as "wholesaler" | "hospital" | "pharmacy",
          cacNumber: form.cacNumber,
          businessLicenseUrl: form.businessLicenseUrl || null,
        },
      },
      {
        onSuccess: () => navigate("/pending"),
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
            <h1 className="text-2xl font-bold">Register as Buyer</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your account will be reviewed by our team before activation.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Full Name *</Label>
                  <Input placeholder="John Doe" value={form.fullName} onChange={set("fullName")} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Company Name *</Label>
                  <Input placeholder="Acme Healthcare Ltd" value={form.companyName} onChange={set("companyName")} required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Company Address *</Label>
                <Input placeholder="123 Medical Way, Lagos" value={form.companyAddress} onChange={set("companyAddress")} required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Phone Number *</Label>
                  <Input placeholder="+234 800 000 0000" value={form.phone} onChange={set("phone")} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Business Type *</Label>
                  <Select onValueChange={(v) => setForm((f) => ({ ...f, businessType: v as "wholesaler" | "hospital" | "pharmacy" }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wholesaler">Wholesaler</SelectItem>
                      <SelectItem value="hospital">Hospital</SelectItem>
                      <SelectItem value="pharmacy">Pharmacy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>CAC Registration Number *</Label>
                <Input placeholder="RC-0000000" value={form.cacNumber} onChange={set("cacNumber")} required />
              </div>

              <div className="space-y-1.5">
                <Label>Business License *</Label>
                <div className="relative border-2 border-dashed border-border rounded-lg p-4 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center text-center group">
                  <input
                    type="file"
                    accept=".jpeg,.png,.jpg,.webp,.pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                    disabled={isUploadingLicense}
                  />
                  {form.businessLicenseUrl ? (
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
                        {isUploadingLicense ? "Uploading..." : "Click or drag file to upload"}
                      </div>
                      <div className="text-xs text-muted-foreground">JPEG, PNG, WEBP, or PDF</div>
                    </div>
                  )}
                </div>
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
