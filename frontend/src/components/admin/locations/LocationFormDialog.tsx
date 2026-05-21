
import React, { useCallback, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Location, defaultWorkingHours } from "@/services/locationServices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, MapPin, Phone, RotateCcw, Settings } from "lucide-react";

const dayScheduleSchema = z.object({
  day: z.string(),
  open: z.string().optional(),
  close: z.string().optional(),
  closed: z.boolean().optional()
});

const locationSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  address: z.string().min(1, { message: 'Address is required' }),
  city: z.string().min(1, { message: 'City is required' }),
  map_link: z.string().url({ message: 'Must be a valid URL' }),
  phone: z.string().optional(),
  is_open_24_7: z.boolean().default(false),
  working_hours: z.array(dayScheduleSchema).default([])
});

export type LocationFormValues = z.infer<typeof locationSchema>;

interface LocationFormDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  editingLocation: Location | null;
  onSubmit: (values: LocationFormValues) => void;
  isPending: boolean;
}

const createDefaultValues = (): LocationFormValues => ({
  name: "",
  address: "",
  city: "",
  map_link: "",
  phone: "",
  is_open_24_7: false,
  working_hours: defaultWorkingHours.map((day) => ({ ...day }))
});

export const LocationFormDialog: React.FC<LocationFormDialogProps> = ({
  isOpen,
  setIsOpen,
  editingLocation,
  onSubmit,
  isPending
}) => {
  const defaultValues = useMemo(() => createDefaultValues(), []);

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues,
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "working_hours"
  });

  const is24x7 = form.watch("is_open_24_7");
  const workingHours = form.watch("working_hours");
  const dialogTitle = editingLocation ? "Edit Location" : "Add New Location";
  const dialogDescription = editingLocation
    ? "Update branch details, working hours, and map links in one place."
    : "Create a new branch and define its address, hours, and visibility.";
  const hoursSummary = useMemo(() => {
    if (is24x7) return "Open 24 hours daily";
    if (!workingHours || workingHours.length === 0) return "Schedule not configured";

    const openDays = workingHours.filter((day) => !day.closed).length;
    if (openDays === 0) return "Marked closed all week";
    if (openDays === workingHours.length) return "Custom hours across the week";
    return `${openDays} of ${workingHours.length} days open`;
  }, [is24x7, workingHours]);

  const resetWorkingHours = useCallback(() => {
    form.setValue(
      "working_hours",
      defaultWorkingHours.map((day) => ({ ...day })),
      { shouldDirty: true }
    );
  }, [form]);

  useEffect(() => {
    if (editingLocation) {
      form.reset({
        name: editingLocation.name,
        address: editingLocation.address,
        city: editingLocation.city,
        map_link: editingLocation.map_link,
        phone: editingLocation.phone ?? "",
        is_open_24_7: editingLocation.is_open_24_7,
        working_hours:
          editingLocation.working_hours && editingLocation.working_hours.length > 0
            ? editingLocation.working_hours.map((day) => ({ ...day }))
            : defaultWorkingHours.map((day) => ({ ...day }))
      });
    } else {
      form.reset(createDefaultValues());
    }
  }, [editingLocation, form]);

  return (
    <DialogContent className="max-h-[92vh] overflow-hidden rounded-[32px] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-orange-100 p-0 shadow-2xl backdrop-blur-xl">
      <div className="flex max-h-[92vh] flex-col">
        <DialogHeader className="space-y-4 px-8 pt-8 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-1 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 shadow-lg">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-xl font-semibold text-slate-900">
                  {dialogTitle}
                </DialogTitle>
                <p className="text-xs text-slate-600">{dialogDescription}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge
                variant="outline"
                className={`gap-2 rounded-xl border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                  is24x7 ? "text-orange-700" : "text-amber-700"
                }`}
              >
                <Settings className="h-3.5 w-3.5" />
                {is24x7 ? "24/7 Active" : "Custom Hours"}
              </Badge>
              <span className="text-xs font-medium uppercase tracking-wide text-orange-600">
                {hoursSummary}
              </span>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(92vh-180px)]">
          <div className="px-6 pb-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
              >
                <Tabs defaultValue="details" className="space-y-4">
                  <TabsList className="grid w-fit grid-cols-2 rounded-full bg-orange-100/50 p-1 text-[11px] font-semibold text-orange-700">
                    <TabsTrigger
                      value="details"
                      className="rounded-full px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm"
                    >
                      Details
                    </TabsTrigger>
                    <TabsTrigger
                      value="hours"
                      className="rounded-full px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm"
                    >
                      Hours & Availability
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="rounded-2xl border border-orange-100 bg-white/90 p-4 shadow-sm transition hover:border-orange-200 hover:shadow-md">
                            <FormLabel className="text-xs font-semibold text-slate-800">
                              Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Location name"
                                {...field}
                                className="mt-1 h-9 text-sm"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem className="rounded-2xl border border-orange-100 bg-white/90 p-4 shadow-sm transition hover:border-orange-200 hover:shadow-md">
                            <FormLabel className="text-xs font-semibold text-slate-800">
                              City
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="City name"
                                {...field}
                                className="mt-1 h-9 text-sm"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="rounded-2xl border border-orange-100 bg-white/90 p-4 shadow-sm transition hover:border-orange-200 hover:shadow-md">
                          <FormLabel className="text-xs font-semibold text-slate-800">
                            Address
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Full address"
                              {...field}
                              className="mt-1 h-9 text-sm"
                            />
                          </FormControl>
                          <FormDescription className="text-[11px] text-slate-500">
                            Include neighborhood or nearby landmarks for clarity.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="map_link"
                      render={({ field }) => (
                        <FormItem className="rounded-2xl border border-orange-100 bg-white/90 p-4 shadow-sm transition hover:border-orange-200 hover:shadow-md">
                          <FormLabel className="text-xs font-semibold text-slate-800">
                            Google Maps Link
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://maps.google.com/?q=..."
                              {...field}
                              className="mt-1 h-9 text-sm"
                            />
                          </FormControl>
                          <FormDescription className="text-[11px] text-slate-500">
                            Share a direct Maps URL so guests can navigate easily.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="rounded-2xl border border-orange-100 bg-white/90 p-4 shadow-sm transition hover:border-orange-200 hover:shadow-md">
                          <FormLabel className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-orange-500" />
                            Phone Number
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="+20 10 0000 0000"
                              {...field}
                              className="mt-1 h-9 text-sm"
                              dir="ltr"
                            />
                          </FormControl>
                          <FormDescription className="text-[11px] text-slate-500">
                            Shown as WhatsApp and Call buttons on the menu.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="is_open_24_7"
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2 rounded-2xl border border-orange-100 bg-white/95 p-4 shadow-sm transition hover:border-orange-200 hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
                          <div className="space-y-1">
                            <FormLabel className="text-sm font-semibold text-slate-900">
                              Open 24/7
                            </FormLabel>
                            <FormDescription className="text-[11px] text-slate-500">
                              Toggle if this branch operates round-the-clock.
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
                  </TabsContent>

                  <TabsContent value="hours" className="space-y-4">
                    <div className="rounded-2xl border border-orange-100 bg-white/90 p-4 shadow-sm">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100">
                            <Clock className="h-4 w-4 text-orange-600" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <h3 className="text-base font-semibold text-slate-900">
                              Working Hours
                            </h3>
                            <p className="text-xs text-slate-600">
                              Set daily opening and closing times or mark days as closed.
                            </p>
                          </div>
                        </div>
                        {!is24x7 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={resetWorkingHours}
                            className="mt-1 inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600 transition hover:border-orange-300 hover:bg-orange-100 hover:text-orange-700"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reset Hours
                          </Button>
                        )}
                      </div>
                      <Separator className="mt-3 bg-orange-100" />

                      {is24x7 ? (
                        <div className="mt-4 rounded-2xl border border-dashed border-orange-200 bg-orange-50/60 p-4 text-xs text-orange-700">
                          This branch is marked as 24/7, so no daily schedule is
                          required.
                        </div>
                      ) : (
                        <div className="mt-3 space-y-2.5 pr-2">
                          <div className="overflow-x-auto">
                            <div className="min-w-[440px] space-y-2.5">
                              {fields.map((field, index) => {
                                const isClosed = workingHours?.[index]?.closed ?? false;
                                return (
                                  <div
                                    key={field.id}
                                    className="space-y-1.5 rounded-xl border border-orange-100 bg-white/95 p-2.5 shadow-xs transition hover:border-orange-200 hover:shadow-sm"
                                  >
                                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-800">
                                      {field.day}
                                    </div>
                                    <FormField
                                      control={form.control}
                                      name={`working_hours.${index}.closed`}
                                      render={({ field: closedField }) => (
                                        <FormItem className="flex items-center justify-between gap-2 rounded-lg bg-orange-50/70 px-2 py-1">
                                          <FormLabel className="text-[8px] font-semibold uppercase tracking-wide text-orange-600">
                                            Closed
                                          </FormLabel>
                                          <FormControl>
                                            <Switch
                                              checked={closedField.value}
                                              onCheckedChange={(checked) => {
                                                closedField.onChange(checked);
                                                if (checked) {
                                                  form.setValue(
                                                    `working_hours.${index}.open`,
                                                    ""
                                                  );
                                                  form.setValue(
                                                    `working_hours.${index}.close`,
                                                    ""
                                                  );
                                                }
                                              }}
                                            />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                    {!isClosed && (
                                      <div className="flex flex-col gap-1.5 rounded-lg border border-orange-100 bg-white/95 p-2 sm:flex-row sm:items-center sm:justify-between">
                                        <FormField
                                          control={form.control}
                                          name={`working_hours.${index}.open`}
                                          render={({ field: openField }) => (
                                            <FormItem className="flex-1">
                                              <FormControl>
                                                <Input
                                                  type="time"
                                                  {...openField}
                                                  value={openField.value ?? ""}
                                                  className="h-7 rounded-md px-2 text-[11px]"
                                                />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        <span className="text-[8px] font-medium uppercase tracking-wide text-slate-400">
                                          to
                                        </span>
                                        <FormField
                                          control={form.control}
                                          name={`working_hours.${index}.close`}
                                          render={({ field: closeField }) => (
                                            <FormItem className="flex-1">
                                              <FormControl>
                                                <Input
                                                  type="time"
                                                  {...closeField}
                                                  value={closeField.value ?? ""}
                                                  className="h-7 rounded-md px-2 text-[11px]"
                                                />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                <DialogFooter className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="border-slate-200 text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md transition hover:from-orange-600 hover:to-orange-700"
                  >
                    {editingLocation ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </div>
    </DialogContent>
  );
};
