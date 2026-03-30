import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Lock, ArrowLeft, CheckCircle2, Loader2, CreditCard } from "lucide-react";
import { Link } from "wouter";

// ─── Stripe checkout form ─────────────────────────────────────────────────────

function CheckoutForm({ course, couponCode, clientSecret, amount }: {
  course: any;
  couponCode?: string;
  clientSecret: string;
  amount: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const cardEl = elements.getElement(CardElement);
    if (!cardEl) return;

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardEl },
    });

    if (stripeError) {
      setError(stripeError.message || "Payment failed");
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      try {
        await apiRequest("POST", "/api/payments/complete", {
          paymentIntentId: paymentIntent.id,
          courseId: course.id,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
        setSucceeded(true);
        setTimeout(() => navigate(`/learn/${course.slug}`), 2000);
      } catch (e: any) {
        toast({ title: "Enrollment error", description: e.message, variant: "destructive" });
      }
    }

    setProcessing(false);
  }

  if (succeeded) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Payment Successful!</h2>
        <p className="text-muted-foreground">Redirecting you to your course…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border rounded-lg p-4 bg-muted/30">
        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
          <CreditCard className="h-3.5 w-3.5" /> Card Details
        </p>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "var(--foreground)",
                "::placeholder": { color: "var(--muted-foreground)" },
              },
            },
          }}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={!stripe || processing}>
        {processing ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…</>
        ) : (
          <><Lock className="mr-2 h-4 w-4" /> Pay ${(amount / 100).toFixed(2)} AUD</>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
        <Lock className="h-3 w-3" /> Secured by Stripe. Your card details are never stored on our servers.
      </p>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PaymentPage() {
  const [, params] = useRoute("/payment/:slug");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const urlParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const couponCode = urlParams.get("coupon") || undefined;

  const { data: course, isLoading: courseLoading } = useQuery<any>({
    queryKey: ["/api/courses", params?.slug],
    enabled: !!params?.slug,
  });

  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState(0);
  const [intentError, setIntentError] = useState<string | null>(null);

  // Load Stripe publishable key
  useEffect(() => {
    fetch("/api/payments/stripe-key", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.publishableKey) {
          setStripePromise(loadStripe(data.publishableKey));
        }
      })
      .catch(() => {});
  }, []);

  // Create payment intent once course is loaded
  useEffect(() => {
    if (!course || !user) return;
    if (course.isFree) { navigate(`/courses/${course.slug}`); return; }

    apiRequest("POST", "/api/payments/create-intent", { courseId: course.id, couponCode })
      .then((r) => r.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          setAmount(data.amount);
        } else {
          setIntentError(data.message || "Unable to initialise payment");
        }
      })
      .catch((e) => setIntentError(e.message));
  }, [course?.id, user?.id]);

  if (!user) { navigate("/auth"); return null; }

  if (courseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Course Not Found</h2>
          <Button onClick={() => navigate("/courses")}>Browse Courses</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="mx-auto max-w-lg px-4">
        <Link href={`/courses/${course.slug}`}>
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to course
          </Button>
        </Link>

        <h1 className="text-2xl font-bold mb-6">Complete Your Purchase</h1>

        {/* Order Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              {course.thumbnail && (
                <img src={course.thumbnail} alt={course.title} className="h-16 w-24 object-cover rounded-md shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm leading-snug">{course.title}</p>
                {course.instructor && (
                  <p className="text-xs text-muted-foreground mt-0.5">by {course.instructor.name}</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-sm font-medium">Total</span>
              <span className="text-lg font-bold">
                {amount > 0 ? `$${(amount / 100).toFixed(2)} AUD` : "Loading…"}
              </span>
            </div>
            {couponCode && (
              <Badge variant="secondary" className="text-xs">Coupon applied: {couponCode}</Badge>
            )}
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4" /> Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {intentError ? (
              <Alert variant="destructive">
                <AlertDescription>{intentError}</AlertDescription>
              </Alert>
            ) : !clientSecret || !stripePromise ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm
                  course={course}
                  couponCode={couponCode}
                  clientSecret={clientSecret}
                  amount={amount}
                />
              </Elements>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
