import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RazorpayOptions {
  amount: number;
  planName: string;
  userId?: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const useRazorpay = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadRazorpayScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const initiatePayment = useCallback(async (options: RazorpayOptions) => {
    setIsLoading(true);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      // Create order
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        'razorpay-create-order',
        {
          body: {
            amount: options.amount,
            plan_name: options.planName,
            user_id: options.userId,
          },
        }
      );

      if (orderError || !orderData) {
        throw new Error(orderError?.message || 'Failed to create order');
      }

      // Open Razorpay checkout
      const razorpayOptions = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.order_id,
        name: 'Lead Management CRM',
        description: `${options.planName} Plan Subscription`,
        handler: async (response: any) => {
          try {
            // Verify payment
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
              'razorpay-verify-payment',
              {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  user_id: options.userId,
                  plan_name: options.planName,
                },
              }
            );

            if (verifyError || !verifyData?.verified) {
              throw new Error('Payment verification failed');
            }

            toast({
              title: 'Payment Successful',
              description: `You have successfully subscribed to the ${options.planName} plan.`,
            });

            options.onSuccess?.(response.razorpay_payment_id);
          } catch (error: any) {
            toast({
              title: 'Payment Verification Failed',
              description: error.message,
              variant: 'destructive',
            });
            options.onError?.(error.message);
          }
        },
        prefill: {
          email: '',
          contact: '',
        },
        theme: {
          color: '#6366f1',
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(razorpayOptions);
      razorpay.open();

    } catch (error: any) {
      console.error('Razorpay error:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
      options.onError?.(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [loadRazorpayScript, toast]);

  return { initiatePayment, isLoading };
};
