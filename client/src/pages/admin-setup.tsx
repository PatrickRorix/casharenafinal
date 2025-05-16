import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Redirect } from "wouter";

const setupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  secretKey: z.string().min(1, "Secret key is required"),
});

// This special route is only used once to set up the first admin
// The secretKey is a simple mechanism to prevent unauthorized access
const ADMIN_SETUP_KEY = "casharena_secret_setup";

export default function AdminSetup() {
  const { toast } = useToast();
  const [setupComplete, setSetupComplete] = useState(false);
  
  const form = useForm<z.infer<typeof setupSchema>>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      username: "",
      password: "",
      secretKey: "",
    },
  });
  
  const onSubmit = async (data: z.infer<typeof setupSchema>) => {
    try {
      // Check if the secret key matches
      if (data.secretKey !== ADMIN_SETUP_KEY) {
        toast({
          title: "Invalid Secret Key",
          description: "The secret key you entered is invalid",
          variant: "destructive",
        });
        return;
      }
      
      // First, create a new user
      const createUserResponse = await apiRequest("POST", "/api/users", {
        username: data.username,
        password: data.password,
      });
      
      if (!createUserResponse.ok) {
        const errorData = await createUserResponse.json();
        throw new Error(errorData.message || "Failed to create user");
      }
      
      const newUser = await createUserResponse.json();
      
      // Then, promote the user to admin
      const promoteResponse = await apiRequest("PATCH", `/api/admin/users/${newUser.id}/role`, {
        role: "admin",
      });
      
      if (!promoteResponse.ok) {
        const errorData = await promoteResponse.json();
        throw new Error(errorData.message || "Failed to promote user to admin");
      }
      
      toast({
        title: "Admin Setup Complete",
        description: "Your admin account has been created successfully",
      });
      
      setSetupComplete(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete admin setup",
        variant: "destructive",
      });
    }
  };
  
  if (setupComplete) {
    return <Redirect to="/auth" />;
  }
  
  return (
    <div className="container mx-auto py-12 flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Admin Setup</CardTitle>
          <CardDescription>Set up your admin account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="admin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="secretKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secret Setup Key</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter the secret key" {...field} />
                    </FormControl>
                    <FormDescription>
                      This key is required to create the admin account
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Admin Account
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground text-center">
          This page should only be used once to set up the initial admin account.
        </CardFooter>
      </Card>
    </div>
  );
}