'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm, UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { CalendarIcon, IndianRupee } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { Textarea } from "../ui/textarea";

const bookingFormSchema = z.object({
    eventType: z.string().min(2, { message: "Event type is required." }),
    eventDate: z.date({ required_error: "Event date is required." }),
    serviceDates: z.array(z.date()).min(1, { message: "At least one service date is required." }),
    address: z.string().min(10, { message: "Please enter a valid address." }),
    notes: z.string().optional(),
    travelCharges: z.coerce.number().min(0).optional(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
    form: UseFormReturn<BookingFormValues>;
}


export const BookingForm = ({ form }: BookingFormProps) => {

    return (
        <Card className="shadow-lg rounded-lg">
            <CardHeader>
                <CardTitle>Booking Details</CardTitle>
                <CardDescription>Please provide the details for your event.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="eventType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Event Type (e.g., Wedding, Sangeet)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Wedding" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="eventDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Main Event Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
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
                        </div>

                        <FormField
                            control={form.control}
                            name="serviceDates"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Service Delivery Dates</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value?.length && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value?.length > 0 ? (
                                                        field.value.map(d => format(d, "PPP")).join(', ')
                                                    ) : (
                                                        <span>Select service dates</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="multiple"
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


                         <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Service Address</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Enter the full address for the service" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="travelCharges"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Travel Charges (Optional)</FormLabel>
                                     <div className="relative">
                                        <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <FormControl>
                                            <Input type="number" placeholder="Enter amount if discussed with artist" {...field} className="pl-8"/>
                                        </FormControl>
                                    </div>
                                    <FormDescription>
                                        This amount is to be paid directly to the artist. It will not be included in the online payment.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Additional Notes</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Any special requests or instructions for the artists..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};
