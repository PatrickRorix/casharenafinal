import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BackToDashboard } from "@/components/back-to-dashboard";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn, queryClient, apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { 
  User, 
  Settings, 
  Trophy, 
  Medal, 
  Clock, 
  Gamepad2, 
  Shield, 
  Bell, 
  Edit, 
  Save, 
  Loader2,
  CircleAlert
} from "lucide-react";
import { Stats } from "@shared/schema";

// Profile update schema
const profileSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  bio: z.string().max(160, { message: "Bio cannot exceed 160 characters" }).optional(),
  avatarUrl: z.string().url({ message: "Please enter a valid URL" }).optional()
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// Settings schema
const settingsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
  activitySummary: z.boolean().default(true),
  showOnLeaderboard: z.boolean().default(true)
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  // Get the tab from URL query parameter
  const params = new URLSearchParams(window.location.search);
  const tabParam = params.get('tab');
  const [activeTab, setActiveTab] = useState(() => {
    // Use the tab from URL or default to "profile"
    return tabParam === "settings" || tabParam === "activity" ? tabParam : "profile";
  });
  
  // Get user stats
  const { 
    data: userStats, 
    isLoading: isStatsLoading 
  } = useQuery<Stats, Error>({
    queryKey: ['/api/users', user?.id, 'stats'],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || "",
      email: "",
      bio: "",
      avatarUrl: ""
    }
  });

  // Settings form
  const settingsForm = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      emailNotifications: true,
      marketingEmails: false,
      activitySummary: true,
      showOnLeaderboard: true
    }
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PATCH", `/api/users/${user!.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Settings update mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsFormValues) => {
      const res = await apiRequest("PATCH", `/api/users/${user!.id}/settings`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your settings have been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle profile form submission
  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  // Handle settings form submission
  const onSettingsSubmit = (data: SettingsFormValues) => {
    updateSettingsMutation.mutate(data);
  };

  // Generate user initials for avatar fallback
  const getUserInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  // Calculate win rate as percentage
  const calculateWinRate = (winRate: number) => {
    return Math.round(winRate * 100);
  };

  if (!user) {
    return (
      <div className="container mx-auto py-12 px-4">
        <BackToDashboard />
        <div className="text-center">
          <CircleAlert className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h1 className="text-3xl font-bold mb-4">Not Authenticated</h1>
          <p className="text-muted-foreground mb-6">
            Please log in to view your profile.
          </p>
          <Button asChild>
            <a href="/auth">Go to Login</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <BackToDashboard />
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        {/* User Profile Header */}
        <div className="md:w-1/3">
          <Card className="bg-[hsl(var(--surface))] border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5 text-primary" /> Profile
              </CardTitle>
              <CardDescription>Your public profile information</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-4">
              <Avatar className="h-24 w-24 mb-4 border-2 border-primary">
                <AvatarImage src={profileForm.getValues("avatarUrl")} alt={user.username} />
                <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                  {getUserInitials(user.username)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold mb-1">{user.username}</h2>
              <p className="text-muted-foreground text-sm mb-4">
                {profileForm.getValues("bio") || "No bio provided yet"}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <div className="bg-[hsl(var(--surface-light))] px-3 py-1 rounded-full border border-primary/20 text-sm">
                  <span className="text-primary font-medium">{userStats?.matchesPlayed || 0}</span> Matches
                </div>
                <div className="bg-[hsl(var(--surface-light))] px-3 py-1 rounded-full border border-primary/20 text-sm">
                  <span className="text-primary font-medium">{calculateWinRate(userStats?.winRate || 0)}%</span> Win Rate
                </div>
                <div className="bg-[hsl(var(--surface-light))] px-3 py-1 rounded-full border border-primary/20 text-sm">
                  <span className="text-primary font-medium">{user.tokens.toLocaleString()}</span> Tokens
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Stats Overview */}
        <div className="md:w-2/3 account-stats">
          <Card className="bg-[hsl(var(--surface))] border-primary/30 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Trophy className="mr-2 h-5 w-5 text-primary" /> Stats
              </CardTitle>
              <CardDescription>Your gaming performance statistics</CardDescription>
            </CardHeader>
            <CardContent>
              {isStatsLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-12 w-2/3" />
                      <Skeleton className="h-12 w-1/4" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[hsl(var(--surface-light))] rounded-lg p-4 border border-primary/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Total Matches</span>
                      <Gamepad2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-2xl font-semibold">
                      {userStats?.matchesPlayed || 0}
                    </div>
                  </div>
                  <div className="bg-[hsl(var(--surface-light))] rounded-lg p-4 border border-primary/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Win Rate</span>
                      <Trophy className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div className="text-2xl font-semibold">
                      {calculateWinRate(userStats?.winRate || 0)}%
                    </div>
                  </div>
                  <div className="bg-[hsl(var(--surface-light))] rounded-lg p-4 border border-primary/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Total Earnings</span>
                      <Medal className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-semibold">
                      {userStats?.totalEarnings?.toLocaleString() || 0} <span className="text-sm font-normal text-muted-foreground">WinTokens</span>
                    </div>
                  </div>
                  <div className="bg-[hsl(var(--surface-light))] rounded-lg p-4 border border-primary/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Avg Position</span>
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-2xl font-semibold">
                      {userStats?.avgPosition?.toFixed(1) || 0}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs for Profile Settings */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-6 profile-tabs">
          <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
          <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
          <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
        </TabsList>

        {/* Profile Information Tab */}
        <TabsContent value="profile" className="profile-info-section">
          <Card className="bg-[hsl(var(--surface))] border-primary/30">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? (
                    <><Save className="mr-2 h-4 w-4" /> Save</>
                  ) : (
                    <><Edit className="mr-2 h-4 w-4" /> Edit</>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <FormField
                    control={profileForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input 
                            disabled={!isEditing} 
                            placeholder="Your username" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            disabled={!isEditing} 
                            placeholder="your.email@example.com" 
                            type="email"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea 
                            disabled={!isEditing} 
                            placeholder="A short bio about yourself..." 
                            {...field} 
                            className="resize-none"
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum 160 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="avatarUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avatar URL</FormLabel>
                        <FormControl>
                          <Input 
                            disabled={!isEditing} 
                            placeholder="https://example.com/your-avatar.png" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Enter a valid URL for your profile picture
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {isEditing && (
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
                      ) : (
                        <>Update Profile</>
                      )}
                    </Button>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Settings Tab */}
        <TabsContent value="settings" className="settings-section">
          <Card className="bg-[hsl(var(--surface))] border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5 text-primary" /> Account Settings
              </CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...settingsForm}>
                <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Notifications</h3>
                    
                    <FormField
                      control={settingsForm.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-primary/20 p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Email Notifications</FormLabel>
                            <FormDescription>
                              Receive emails about your account activity
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={settingsForm.control}
                      name="marketingEmails"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-primary/20 p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Marketing Emails</FormLabel>
                            <FormDescription>
                              Receive emails about new features and promotions
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={settingsForm.control}
                      name="activitySummary"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-primary/20 p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Activity Summary</FormLabel>
                            <FormDescription>
                              Receive weekly summaries of your gaming activity
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Privacy</h3>
                    
                    <FormField
                      control={settingsForm.control}
                      name="showOnLeaderboard"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-primary/20 p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Show on Leaderboard</FormLabel>
                            <FormDescription>
                              Allow your profile to appear on public leaderboards
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={updateSettingsMutation.isPending}
                  >
                    {updateSettingsMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                    ) : (
                      <>Save Settings</>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Feed Tab */}
        <TabsContent value="activity" className="activity-section">
          <Card className="bg-[hsl(var(--surface))] border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5 text-primary" /> Recent Activity
              </CardTitle>
              <CardDescription>Your recent platform activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="space-y-6">
                  {/* Activity Feed Items */}
                  <div className="flex gap-4 items-start">
                    <div className="bg-primary/20 rounded-full p-2 mt-0.5">
                      <Trophy className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">
                        You placed 2nd in Fortnite Battle Royale
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        You earned 250 WinTokens for your performance.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center">
                        <Clock className="h-3 w-3 mr-1" /> 2 hours ago
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 items-start">
                    <div className="bg-green-500/20 rounded-full p-2 mt-0.5">
                      <Medal className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">
                        You won Call of Duty: Warzone match
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        You earned 500 WinTokens for your victory.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center">
                        <Clock className="h-3 w-3 mr-1" /> 1 day ago
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 items-start">
                    <div className="bg-blue-500/20 rounded-full p-2 mt-0.5">
                      <Gamepad2 className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">
                        You joined Rocket League Tournament
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Entry fee: 100 WinTokens. Prize pool: 2,000 WinTokens.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center">
                        <Clock className="h-3 w-3 mr-1" /> 3 days ago
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <Button variant="outline">Load More Activity</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}