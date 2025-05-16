import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import StripePaymentForm from "@/components/stripe-payment-form";
import ErrorBoundary from "@/components/error-boundary";
import { BackToDashboard } from "@/components/back-to-dashboard";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  ArrowRightCircle,
  ArrowLeftCircle,
  Calendar, 
  DollarSign, 
  Wallet, 
  Clock, 
  CircleAlert,
  Plus,
  Minus,
  Loader2
} from "lucide-react";
import { FaBitcoin, FaEthereum, FaDollarSign } from "react-icons/fa";
import { SiTether } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { Transaction as SchemaTransaction } from "@shared/schema";
import { z } from "zod";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Frontend interface for transaction with properly typed timestamp
interface Transaction extends Omit<SchemaTransaction, 'timestamp'> {
  timestamp: string;
}
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Schema for transaction forms
const transactionSchema = z.object({
  amount: z
    .number({ required_error: "Amount is required" })
    .min(100, { message: "Amount must be at least 100 WinTokens" })
    .max(100000, { message: "Amount cannot exceed 100,000 WinTokens" })
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

export default function WalletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("balance");
  const [showStripePayment, setShowStripePayment] = useState(false);
  const [depositAmount, setDepositAmount] = useState(1000);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  
  // Get transactions for current user
  const { 
    data: transactions, 
    isLoading: isTransactionsLoading,
    error: transactionsError
  } = useQuery<Transaction[], Error>({
    queryKey: ['/api/users', user?.id, 'transactions'],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  // Deposit form
  const depositForm = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: 1000
    }
  });

  // Withdraw form
  const withdrawForm = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: 1000
    }
  });

  // Mutation for creating transactions
  const transactionMutation = useMutation({
    mutationFn: async ({ amount, type }: { amount: number, type: string }) => {
      const res = await apiRequest("POST", `/api/users/${user!.id}/transactions`, {
        amount: type === "deposit" ? amount : -amount,
        type
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      toast({
        title: "Transaction Successful",
        description: "Your balance has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Transaction Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle deposit submission
  const onDepositSubmit = (data: TransactionFormValues) => {
    // Set the amount for the Stripe payment
    setDepositAmount(data.amount);
    // Show the Stripe payment form
    setShowStripePayment(true);
  };

  // Handle withdrawal submission
  const onWithdrawSubmit = (data: TransactionFormValues) => {
    // Check if user has enough tokens
    if (user && data.amount > user.tokens) {
      toast({
        title: "Withdrawal Failed",
        description: "You don't have enough tokens for this withdrawal.",
        variant: "destructive",
      });
      return;
    }

    // Set the withdraw amount for success message
    setWithdrawAmount(data.amount);

    transactionMutation.mutate({
      amount: data.amount,
      type: "withdraw"
    }, {
      onSuccess: () => {
        setWithdrawSuccess(true);
      }
    });
    
    withdrawForm.reset();
  };

  // Function to format transaction date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Function to get transaction icon
  const getTransactionIcon = (type: string | undefined | null) => {
    if (!type) {
      return <Wallet className="h-4 w-4 text-muted-foreground" />;
    }
    
    switch (type) {
      case "deposit":
        return <ArrowDownCircle className="h-4 w-4 text-green-500" />;
      case "withdraw":
        return <ArrowUpCircle className="h-4 w-4 text-red-500" />;
      case "match_entry":
        return <ArrowRightCircle className="h-4 w-4 text-amber-500" />;
      case "win":
        return <DollarSign className="h-4 w-4 text-primary" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="text-center">
          <CircleAlert className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h1 className="text-3xl font-bold mb-4">Not Authenticated</h1>
          <p className="text-muted-foreground mb-6">
            Please log in to view your wallet and transaction history.
          </p>
          <Button asChild>
            <a href="/auth">Go to Login</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 wallet-section">
      <BackToDashboard />
      <h1 className="text-3xl font-bold flex items-center mb-8">
        <Wallet className="mr-2 h-8 w-8 text-primary" /> My Wallet
      </h1>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Balance and Actions */}
        <div className="md:col-span-1">
          <Card className="bg-[hsl(var(--surface))] border-primary/30">
            <CardHeader>
              <CardTitle>Balance</CardTitle>
              <CardDescription>Your current WinTokens balance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary mb-6">
                {(user.tokens || 0).toLocaleString()} <span className="text-sm font-normal text-muted-foreground">WinTokens</span>
              </div>

              <div className="flex flex-col space-y-2">
                <Button 
                  className="w-full" 
                  onClick={() => setActiveTab("deposit")}
                >
                  <Plus className="mr-2 h-4 w-4" /> Deposit Tokens
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setActiveTab("withdraw")}
                  disabled={(user.tokens || 0) <= 0}
                >
                  <Minus className="mr-2 h-4 w-4" /> Withdraw Tokens
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions and Forms */}
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full mb-6">
              <TabsTrigger value="balance" className="flex-1">Balance</TabsTrigger>
              <TabsTrigger value="deposit" className="flex-1">Deposit</TabsTrigger>
              <TabsTrigger value="crypto" className="flex-1">Crypto</TabsTrigger>
              <TabsTrigger value="withdraw" className="flex-1">Withdraw</TabsTrigger>
              <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
            </TabsList>

            {/* Balance Overview */}
            <TabsContent value="balance">
              <Card className="bg-[hsl(var(--surface))] border-primary/30">
                <CardHeader>
                  <CardTitle>Balance Overview</CardTitle>
                  <CardDescription>Summary of your account activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-[hsl(var(--surface-light))] rounded-lg p-4 border border-primary/20">
                      <div className="text-sm text-muted-foreground mb-1">Total Deposits</div>
                      <div className="text-2xl font-semibold text-green-500">
                        {(transactions?.filter(t => t.type === "deposit")
                          .reduce((sum, t) => sum + t.amount, 0) || 0).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">WinTokens</span>
                      </div>
                    </div>
                    <div className="bg-[hsl(var(--surface-light))] rounded-lg p-4 border border-primary/20">
                      <div className="text-sm text-muted-foreground mb-1">Total Withdrawals</div>
                      <div className="text-2xl font-semibold text-red-500">
                        {(transactions?.filter(t => t.type === "withdraw")
                          .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">WinTokens</span>
                      </div>
                    </div>
                    <div className="bg-[hsl(var(--surface-light))] rounded-lg p-4 border border-primary/20">
                      <div className="text-sm text-muted-foreground mb-1">Match Entries</div>
                      <div className="text-2xl font-semibold text-amber-500">
                        {(transactions?.filter(t => t.type === "match_entry")
                          .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">WinTokens</span>
                      </div>
                    </div>
                    <div className="bg-[hsl(var(--surface-light))] rounded-lg p-4 border border-primary/20">
                      <div className="text-sm text-muted-foreground mb-1">Winnings</div>
                      <div className="text-2xl font-semibold text-primary">
                        {(transactions?.filter(t => t.type === "win")
                          .reduce((sum, t) => sum + t.amount, 0) || 0).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">WinTokens</span>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
                  {isTransactionsLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-4 w-1/5" />
                        </div>
                      ))}
                    </div>
                  ) : transactions && transactions.length > 0 ? (
                    <div className="space-y-4">
                      {transactions.slice(0, 5).map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between py-1 border-b border-primary/10">
                          <div className="flex items-center">
                            {getTransactionIcon(transaction.type)}
                            <div className="ml-2">
                              <div className="font-medium">
                                {transaction.type ? `${transaction.type.charAt(0).toUpperCase()}${transaction.type.slice(1).replace('_', ' ')}` : 'Transaction'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(transaction.timestamp)}
                              </div>
                            </div>
                          </div>
                          <div className={`font-semibold ${(transaction.amount || 0) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {(transaction.amount || 0) > 0 ? '+' : ''}{(transaction.amount || 0).toLocaleString()}
                          </div>
                        </div>
                      ))}
                      <Button variant="ghost" className="w-full text-primary" onClick={() => setActiveTab("history")}>
                        View All Transactions
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      <p>No transactions found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Deposit Form */}
            <TabsContent value="deposit" className="deposit-section">
              {paymentSuccess ? (
                <Card className="bg-[hsl(var(--surface))] border-primary/30">
                  <CardHeader>
                    <CardTitle className="flex items-center text-green-500">
                      <ArrowDownCircle className="mr-2 h-5 w-5" /> 
                      Payment Successful
                    </CardTitle>
                    <CardDescription>
                      Your deposit has been processed
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center py-6">
                    <div className="bg-green-500/20 rounded-full p-6 mb-6">
                      <DollarSign className="h-16 w-16 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">
                      +{depositAmount.toLocaleString()} WinTokens
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Your tokens have been added to your balance
                    </p>
                    <div className="flex gap-3 w-full">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          setPaymentSuccess(false);
                          setShowStripePayment(false);
                          depositForm.reset();
                        }}
                      >
                        Make Another Deposit
                      </Button>
                      <Button 
                        className="flex-1"
                        onClick={() => {
                          setPaymentSuccess(false);
                          setShowStripePayment(false);
                          setActiveTab("balance");
                        }}
                      >
                        View Balance
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : showStripePayment ? (
                <div className="mb-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowStripePayment(false)} 
                    className="mb-6"
                  >
                    ← Back to Amount Selection
                  </Button>
                  {/* Wrap in error boundary */}
                  <ErrorBoundary
                    fallback={
                      <Card className="bg-[hsl(var(--surface))] border-primary/30">
                        <CardHeader>
                          <CardTitle className="text-red-500">Payment Error</CardTitle>
                          <CardDescription>
                            There was a problem with the payment system
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-4">
                            <p className="text-muted-foreground mb-4">
                              The payment system could not be loaded. Please try again later.
                            </p>
                            <Button onClick={() => setShowStripePayment(false)}>Return to Wallet</Button>
                          </div>
                        </CardContent>
                      </Card>
                    }
                  >
                    <StripePaymentForm 
                      amount={depositAmount}
                      onSuccess={() => {
                        setPaymentSuccess(true);
                      }}
                      onCancel={() => setShowStripePayment(false)}
                    />
                  </ErrorBoundary>
                </div>
              ) : (
                <Card className="bg-[hsl(var(--surface))] border-primary/30">
                  <CardHeader>
                    <CardTitle>Deposit WinTokens</CardTitle>
                    <CardDescription>Add tokens to your account (100 WinTokens = $1)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...depositForm}>
                      <form onSubmit={depositForm.handleSubmit(onDepositSubmit)} className="space-y-6">
                        <FormField
                          control={depositForm.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amount</FormLabel>
                              <FormControl>
                                <div className="flex items-center">
                                  <Input 
                                    type="number"
                                    placeholder="1000" 
                                    {...field}
                                    onChange={e => field.onChange(parseInt(e.target.value))}
                                    className="text-lg"
                                  />
                                  <span className="ml-2 text-muted-foreground">WinTokens</span>
                                </div>
                              </FormControl>
                              <FormDescription>
                                Enter the amount of WinTokens you wish to deposit.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-2">
                          <h3 className="text-sm font-medium">Quick Amounts</h3>
                          <div className="flex flex-wrap gap-2">
                            {[1000, 2500, 5000, 10000].map(amount => (
                              <Button 
                                key={amount} 
                                type="button"
                                variant="outline" 
                                onClick={() => depositForm.setValue("amount", amount)}
                                className="flex-1"
                              >
                                {amount.toLocaleString()}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full"
                        >
                          Continue to Payment
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Crypto Deposit Form */}
            <TabsContent value="crypto">
              <Card className="bg-[hsl(var(--surface))] border-primary/30">
                <CardHeader>
                  <CardTitle>Deposit with Cryptocurrency</CardTitle>
                  <CardDescription>Add tokens using cryptocurrency (100 WinTokens = $1)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="bg-[hsl(var(--surface-light))] p-4 rounded-lg border border-primary/20">
                      <p className="text-sm text-muted-foreground mb-2">
                        Select a cryptocurrency to deposit funds and receive WinTokens:
                      </p>
                      <div className="my-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div 
                            className="bg-[hsl(var(--card))] p-4 rounded-lg border border-primary/30 hover:border-primary cursor-pointer transition-all"
                            onClick={() => toast({
                              title: "Coming Soon",
                              description: "Bitcoin deposits will be available shortly.",
                            })}
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-[#F7931A]/20">
                                <FaBitcoin className="h-5 w-5 text-[#F7931A]" />
                              </div>
                              <div>
                                <p className="font-semibold">Bitcoin (BTC)</p>
                                <p className="text-xs text-muted-foreground">Low transaction fees</p>
                              </div>
                            </div>
                          </div>
                          
                          <div 
                            className="bg-[hsl(var(--card))] p-4 rounded-lg border border-primary/30 hover:border-primary cursor-pointer transition-all"
                            onClick={() => toast({
                              title: "Coming Soon",
                              description: "Ethereum deposits will be available shortly.",
                            })}
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-[#627EEA]/20">
                                <FaEthereum className="h-5 w-5 text-[#627EEA]" />
                              </div>
                              <div>
                                <p className="font-semibold">Ethereum (ETH)</p>
                                <p className="text-xs text-muted-foreground">Fast confirmations</p>
                              </div>
                            </div>
                          </div>
                          
                          <div 
                            className="bg-[hsl(var(--card))] p-4 rounded-lg border border-primary/30 hover:border-primary cursor-pointer transition-all"
                            onClick={() => toast({
                              title: "Coming Soon",
                              description: "USDC deposits will be available shortly.",
                            })}
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-[#2775CA]/20">
                                <FaDollarSign className="h-5 w-5 text-[#2775CA]" />
                              </div>
                              <div>
                                <p className="font-semibold">USD Coin (USDC)</p>
                                <p className="text-xs text-muted-foreground">Stable value</p>
                              </div>
                            </div>
                          </div>
                          
                          <div 
                            className="bg-[hsl(var(--card))] p-4 rounded-lg border border-primary/30 hover:border-primary cursor-pointer transition-all"
                            onClick={() => toast({
                              title: "Coming Soon",
                              description: "Tether deposits will be available shortly.",
                            })}
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-[#26A17B]/20">
                                <SiTether className="h-5 w-5 text-[#26A17B]" />
                              </div>
                              <div>
                                <p className="font-semibold">Tether (USDT)</p>
                                <p className="text-xs text-muted-foreground">Widely accepted</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-4">
                        Cryptocurrency deposits are processed instantly once confirmed on the blockchain. 
                        Exchange rates are locked at the time of transaction.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Crypto Deposit Benefits</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li className="flex items-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></div>
                          Lower transaction fees compared to credit cards
                        </li>
                        <li className="flex items-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></div>
                          Enhanced privacy and security
                        </li>
                        <li className="flex items-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></div>
                          Fast processing times
                        </li>
                        <li className="flex items-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></div>
                          No chargebacks or payment disputes
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Withdraw Form */}
            <TabsContent value="withdraw" className="withdraw-section">
              {withdrawSuccess ? (
                <Card className="bg-[hsl(var(--surface))] border-primary/30">
                  <CardHeader>
                    <CardTitle className="flex items-center text-red-500">
                      <ArrowUpCircle className="mr-2 h-5 w-5" /> 
                      Withdrawal Successful
                    </CardTitle>
                    <CardDescription>
                      Your withdrawal has been processed
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center py-6">
                    <div className="bg-red-500/20 rounded-full p-6 mb-6">
                      <Minus className="h-16 w-16 text-red-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-red-500">
                      -{withdrawAmount.toLocaleString()} WinTokens
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Your tokens have been withdrawn from your balance
                    </p>
                    <div className="flex gap-3 w-full">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          setWithdrawSuccess(false);
                          withdrawForm.reset();
                        }}
                      >
                        Make Another Withdrawal
                      </Button>
                      <Button 
                        className="flex-1"
                        onClick={() => {
                          setWithdrawSuccess(false);
                          setActiveTab("balance");
                        }}
                      >
                        View Balance
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-[hsl(var(--surface))] border-primary/30">
                  <CardHeader>
                    <CardTitle>Withdraw WinTokens</CardTitle>
                    <CardDescription>Withdraw tokens from your account (100 WinTokens = $1)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...withdrawForm}>
                      <form onSubmit={withdrawForm.handleSubmit(onWithdrawSubmit)} className="space-y-6">
                        <FormField
                          control={withdrawForm.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amount</FormLabel>
                              <FormControl>
                                <div className="flex items-center">
                                  <Input 
                                    type="number"
                                    placeholder="1000" 
                                    {...field}
                                    onChange={e => field.onChange(parseInt(e.target.value))}
                                    className="text-lg"
                                    max={user.tokens}
                                  />
                                  <span className="ml-2 text-muted-foreground">WinTokens</span>
                                </div>
                              </FormControl>
                              <FormDescription>
                                You can withdraw up to {(user.tokens || 0).toLocaleString()} WinTokens.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-2">
                          <h3 className="text-sm font-medium">Quick Amounts</h3>
                          <div className="flex flex-wrap gap-2">
                            {[1000, 2500, 5000, 10000].map(amount => (
                              <Button 
                                key={amount} 
                                type="button"
                                variant="outline" 
                                onClick={() => withdrawForm.setValue("amount", amount)}
                                className="flex-1"
                                disabled={amount > (user.tokens || 0)}
                              >
                                {amount.toLocaleString()}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={transactionMutation.isPending || (user.tokens || 0) <= 0}
                        >
                          {transactionMutation.isPending ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                          ) : (
                            <>Withdraw WinTokens</>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Transaction History */}
            <TabsContent value="history" className="transaction-history">
              <Card className="bg-[hsl(var(--surface))] border-primary/30">
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>All your account transactions (100 WinTokens = $1)</CardDescription>
                </CardHeader>
                <CardContent>
                  {isTransactionsLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex justify-between">
                          <Skeleton className="h-10 w-2/3" />
                          <Skeleton className="h-10 w-1/4" />
                        </div>
                      ))}
                    </div>
                  ) : transactions && transactions.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="flex items-center">
                              {getTransactionIcon(transaction.type)}
                              <span className="ml-2 capitalize">
                                {transaction.type ? transaction.type.replace('_', ' ') : 'Transaction'}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(transaction.timestamp)}
                            </TableCell>
                            <TableCell className={`text-right font-medium ${(transaction.amount || 0) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {(transaction.amount || 0) > 0 ? '+' : ''}{(transaction.amount || 0).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Clock className="mx-auto h-12 w-12 mb-3 opacity-50" />
                      <p>No transactions found</p>
                      <p className="text-sm">When you make transactions, they will appear here.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}