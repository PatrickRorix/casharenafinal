import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { apiRequest } from "@/lib/queryClient";
import { Game } from "@shared/schema";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Validation schema for tournament creation
const tournamentFormSchema = z.object({
  name: z.string().min(3, { message: "Tournament name must be at least 3 characters" }),
  gameId: z.number({ required_error: "Game selection is required" }),
  description: z.string().optional().nullable(),
  startDate: z.date({
    required_error: "Please select a start date",
  }),
  endDate: z.date().optional().nullable(),
  maxParticipants: z.number().int().min(2, "At least 2 participants required").max(128, "Maximum 128 participants allowed"),
  currentParticipants: z.number().int().default(0),
  status: z.string().default("upcoming"),
  entryFee: z.number().int().min(0, "Entry fee must be 0 or greater"),
  prizePool: z.number().int().min(0, "Prize pool must be 0 or greater"),
  format: z.enum(["bracket", "round_robin", "swiss"]),
  registrationDeadline: z.date().optional().nullable(),
  rules: z.string().optional().nullable(),
});

type TournamentFormValues = z.infer<typeof tournamentFormSchema>;

interface CreateTournamentModalProps {
  games: Game[];
  children?: React.ReactNode;
}

export function CreateTournamentModal({ games, children }: CreateTournamentModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: {
      name: "",
      gameId: undefined, // Will be set when user selects a game
      description: "",
      startDate: undefined,
      endDate: undefined,
      maxParticipants: 16,
      currentParticipants: 0,
      status: "upcoming",
      entryFee: 0,
      prizePool: 1000,
      format: "bracket",
      registrationDeadline: undefined,
      rules: "",
    },
  });
  
  const isSubmitting = form.formState.isSubmitting;
  
  const onSubmit: SubmitHandler<TournamentFormValues> = async (data) => {
    try {
      // Convert form data to match API expectations
      // Convert form data to match the insertTournamentSchema expected by the server
      // For dates, we need to use ISO string format as dates are transmitted as strings over JSON
      const payload = {
        name: data.name,
        gameId: typeof data.gameId === 'string' ? parseInt(data.gameId, 10) : data.gameId,
        description: data.description || null,
        startDate: data.startDate instanceof Date ? data.startDate.toISOString() : data.startDate,
        endDate: data.endDate instanceof Date ? data.endDate.toISOString() : null,
        maxParticipants: typeof data.maxParticipants === 'string' ? parseInt(data.maxParticipants, 10) : data.maxParticipants,
        currentParticipants: 0,
        status: "upcoming",
        entryFee: typeof data.entryFee === 'string' ? parseInt(data.entryFee, 10) : data.entryFee,
        prizePool: typeof data.prizePool === 'string' ? parseInt(data.prizePool, 10) : data.prizePool,
        format: data.format,
        registrationDeadline: data.registrationDeadline instanceof Date 
          ? data.registrationDeadline.toISOString()
          : (data.startDate instanceof Date ? data.startDate.toISOString() : null),
        rules: data.rules || null,
      };
      
      console.log("Submitting tournament payload:", payload);
      const response = await apiRequest("POST", "/api/tournaments", payload);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Tournament creation error:", errorData);
        
        if (errorData.errors) {
          // Handle validation errors and display them in a structured way
          let errorMessage = "Validation failed:";
          errorData.errors.forEach((err: any) => {
            console.log("Field error:", err);
            errorMessage += `\n- ${err.path.join('.')}: ${err.message}`;
            
            // Set errors on specific form fields if possible
            if (err.path && err.path.length > 0) {
              const fieldName = err.path[err.path.length - 1];
              if (form.getValues(fieldName as any) !== undefined) {
                form.setError(fieldName as any, { 
                  type: 'server', 
                  message: err.message 
                });
              }
            }
          });
          
          throw new Error(errorMessage);
        }
        
        throw new Error(errorData.message || "Failed to create tournament");
      }
      
      toast({
        title: "Tournament Created",
        description: "Your tournament has been successfully created",
      });
      
      // Refresh the tournaments list
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      
      // Close the modal and reset form
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to create tournament:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create tournament",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || <Button>Create Tournament</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Tournament</DialogTitle>
          <DialogDescription>
            Fill out the details below to create a new tournament.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tournament Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter tournament name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="gameId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      // Convert string to number before setting the form value
                      const gameId = parseInt(value, 10);
                      field.onChange(gameId);
                    }} 
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a game" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {games.map(game => (
                        <SelectItem key={game.id} value={game.id.toString()}>
                          {game.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter tournament description" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="maxParticipants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Participants</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="2" 
                        max="128" 
                        value={field.value}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 2 : parseInt(e.target.value, 10);
                          field.onChange(value);
                        }}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="entryFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry Fee (tokens)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        value={field.value}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                          field.onChange(value);
                        }}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="prizePool"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prize Pool (tokens)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        value={field.value}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                          field.onChange(value);
                        }}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tournament Format</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bracket">Single Elimination</SelectItem>
                      <SelectItem value="round_robin">Round Robin</SelectItem>
                      <SelectItem value="swiss">Swiss System</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the format that will be used for this tournament
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="rules"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rules (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter tournament rules" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Tournament"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}