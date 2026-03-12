import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Download, GraduationCap } from "lucide-react";

export default function CertificatePage() {
  const [, params] = useRoute("/certificates/:code");

  const { data: cert, isLoading, error } = useQuery<any>({
    queryKey: ["/api/certificates", params?.code],
    queryFn: async () => {
      const res = await fetch(`/api/certificates/${params?.code}`);
      if (!res.ok) throw new Error("Certificate not found");
      return res.json();
    },
    enabled: !!params?.code,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-96 w-full max-w-2xl" />
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Certificate Not Found</h2>
          <p className="text-muted-foreground">This certificate code is invalid or does not exist.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!cert) return;
    fetch("/api/track", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({
        eventType: "certificate_view",
        courseId: cert.course?.id,
        metadata: { certificateCode: cert.certificateCode, courseTitle: cert.course?.title }
      }),
    }).catch(() => {});
  }, [cert?.certificateCode]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-8">
      <div className="w-full max-w-3xl">
        {/* Print button */}
        <div className="flex justify-end mb-4 print:hidden">
          <Button onClick={handlePrint} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Print / Download
          </Button>
        </div>

        {/* Certificate */}
        <div
          id="certificate"
          className="bg-white dark:bg-gray-950 rounded-lg shadow-2xl border-8 border-double border-amber-400 p-12 text-center relative"
        >
          {/* Decorative corners */}
          <div className="absolute top-4 left-4 h-8 w-8 border-l-4 border-t-4 border-amber-400 rounded-tl" />
          <div className="absolute top-4 right-4 h-8 w-8 border-r-4 border-t-4 border-amber-400 rounded-tr" />
          <div className="absolute bottom-4 left-4 h-8 w-8 border-l-4 border-b-4 border-amber-400 rounded-bl" />
          <div className="absolute bottom-4 right-4 h-8 w-8 border-r-4 border-b-4 border-amber-400 rounded-br" />

          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-md bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">CourseMini</span>
              <p className="text-xs text-muted-foreground">by EQC Institute</p>
            </div>
          </div>

          <p className="text-sm uppercase tracking-widest text-muted-foreground mb-2">Certificate of Completion</p>

          <div className="my-6">
            <p className="text-muted-foreground text-sm mb-2">This is to certify that</p>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{cert.user?.name}</h2>
            <p className="text-muted-foreground text-sm">has successfully completed the course</p>
          </div>

          <div className="my-8 py-6 border-y border-amber-200">
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400">{cert.course?.title}</h3>
          </div>

          <div className="flex items-center justify-between mt-8 text-xs text-muted-foreground">
            <div className="text-left">
              <p className="font-semibold text-gray-700 dark:text-gray-300">Certificate Code</p>
              <p className="font-mono mt-1">{cert.certificateCode}</p>
            </div>
            <Award className="h-16 w-16 text-amber-400" />
            <div className="text-right">
              <p className="font-semibold text-gray-700 dark:text-gray-300">Issue Date</p>
              <p className="mt-1">{new Date(cert.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Verify this certificate at: {window.location.origin}/certificates/{cert.certificateCode}
        </p>
      </div>
    </div>
  );
}
