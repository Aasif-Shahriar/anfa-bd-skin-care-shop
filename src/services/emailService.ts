import { Order } from '../types';

export interface SendInvoiceResponse {
  success: boolean;
  message: string;
  emailSent?: boolean;
  recipient?: string;
  orderNumber?: string;
}

/**
 * Dispatches an official order confirmation & tax invoice email to the customer.
 */
export async function sendOrderInvoiceEmail(
  order: Order,
  customRecipient?: string
): Promise<SendInvoiceResponse> {
  const targetEmail = customRecipient || order.customer.email;
  try {
    const res = await fetch('/api/orders/send-invoice-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: order.id || order.orderNumber,
        recipient: targetEmail,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Server returned ${res.status}`);
    }

    const data: SendInvoiceResponse = await res.json();
    return data;
  } catch (err: any) {
    console.warn(
      `[EMAIL CLIENT] Invoice email notice for Order #${order.orderNumber}:`,
      err?.message || err
    );
    return {
      success: false,
      emailSent: false,
      recipient: targetEmail,
      orderNumber: order.orderNumber,
      message: err?.message || 'Invoice email dispatch unavailable.',
    };
  }
}
