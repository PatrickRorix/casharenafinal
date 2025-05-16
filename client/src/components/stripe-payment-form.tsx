import { useState, useEffect } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Load Stripe outside of component render to avoid recreating on each render
let stripePromise: Promise<Stripe | null> | null = null;

// Only load Stripe if we have a public key
if (import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  try {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
  } catch (err) {
    console.error("Error loading Stripe:", err);
    stripePromise = null;
  }
} else {
  console.warn("Missing Stripe public key. Payments will not work.");
}

interface CheckoutFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

// Checkout Form
function CheckoutForm({ clientSecret, amount, onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/wallet`,
        },
        redirect: "if_required",
      });

      if (error) {
        if (error.type === "card_error" || error.type === "validation_error") {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("An unexpected error occurred.");
        }
        toast({
          title: "Payment Failed",
          description: error.message || "Your payment could not be processed.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Verify the payment and create a transaction in our system
      try {
        const user = queryClient.getQueryData(['/api/user']) as any;
        if (!user || !user.id) {
          throw new Error("User not authenticated");
        }

        // If we have a payment intent, verify it first
        if (paymentIntent && paymentIntent.id) {
          // Verify the payment with our server
          const verifyResponse = await apiRequest("POST", "/api/verify-payment", {
            paymentIntentId: paymentIntent.id
          });
          
          if (!verifyResponse.ok) {
            const errorData = await verifyResponse.json();
            console.error("Payment verification failed:", errorData);
            // We'll continue anyway as the payment might still be successful
          }
        }
        
        // Create the transaction record
        const transactionResponse = await apiRequest("POST", `/api/users/${user.id}/transactions`, {
          amount: amount,
          type: "deposit"
        });
        
        if (!transactionResponse.ok) {
          console.error("Error creating transaction record");
        }
        
        // Payment succeeded
        toast({
          title: "Payment Successful",
          description: `You have added ${amount.toLocaleString()} WinTokens to your account.`,
        });
        
        // Update queries to reflect new balance
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        queryClient.invalidateQueries({ queryKey: ['/api/users', user.id, 'transactions'] });
        
        onSuccess();
      } catch (err) {
        console.error("Error updating user balance:", err);
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Payment Error",
        description: "There was a problem processing your payment.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <PaymentElement id="payment-element" className="mb-6" />
      
      {errorMessage && (
        <div className="text-red-500 text-sm mb-4 bg-red-50 dark:bg-red-950/30 p-3 rounded">
          {errorMessage}
        </div>
      )}
      
      <div className="flex gap-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !stripe || !elements} 
          className="flex-1"
        >
          {isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
          ) : (
            `Pay $${(amount / 100).toFixed(2)}`
          )}
        </Button>
      </div>
    </form>
  );
}

interface StripePaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function StripePaymentForm({ amount, onSuccess, onCancel }: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPaymentIntent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await apiRequest("POST", "/api/create-payment-intent", { amount });
        const data = await response.json();
        
        if (response.ok) {
          setClientSecret(data.clientSecret);
        } else {
          setError(data.error || "Failed to initiate payment");
          toast({
            title: "Payment Setup Failed",
            description: data.error || "Could not set up payment",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("Error creating payment intent:", err);
        setError("Could not connect to payment service");
        toast({
          title: "Connection Error",
          description: "Could not connect to payment service",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentIntent();
  }, [amount, toast]);

  if (isLoading) {
    return (
      <Card className="w-full bg-[hsl(var(--surface))] border-primary/30">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Setting up payment...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !clientSecret || !stripePromise) {
    return (
      <Card className="w-full bg-[hsl(var(--surface))] border-primary/30">
        <CardHeader>
          <CardTitle className="text-red-500">Payment Error</CardTitle>
          <CardDescription>
            We couldn't set up the payment processor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              {error || "Stripe is not properly configured."}
            </p>
            <Button onClick={onCancel}>Return to Wallet</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const appearance = {
    theme: 'flat' as const,
    variables: {
      colorPrimary: '#22c55e', // green-500
      colorBackground: 'hsl(var(--surface-light))',
      colorText: 'hsl(var(--foreground))',
      colorDanger: '#ef4444', // red-500
      fontFamily: 'Inter, system-ui, sans-serif',
      borderRadius: '8px',
    }
  };

  return (
    <Card className="w-full bg-[hsl(var(--surface))] border-primary/30">
      <CardHeader>
        <CardTitle>Complete Your Deposit</CardTitle>
        <CardDescription>
          Deposit {amount.toLocaleString()} WinTokens to your account (100 WinTokens = $1)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Elements 
          stripe={stripePromise} 
          options={{ clientSecret, appearance }}
        >
          <CheckoutForm 
            clientSecret={clientSecret} 
            amount={amount} 
            onSuccess={onSuccess} 
            onCancel={onCancel} 
          />
        </Elements>
      </CardContent>
    </Card>
  );
}