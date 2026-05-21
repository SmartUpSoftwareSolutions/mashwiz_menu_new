import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface RestaurantBasicInfoFormProps {
  form: any;
}

const RestaurantBasicInfoForm: React.FC<RestaurantBasicInfoFormProps> = ({ form }) => {
  return (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Restaurant Name</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter restaurant name" />
            </FormControl>
            <FormDescription>
              This name will be displayed on the website.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="slogan"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Restaurant Slogan</FormLabel>
            <FormControl>
              <Textarea 
                {...field} 
                placeholder="Enter restaurant slogan" 
                className="resize-none"
                value={field.value || ''}
              />
            </FormControl>
            <FormDescription>
              A short slogan or tagline for your restaurant.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

        </>
  );
};

export default RestaurantBasicInfoForm;
