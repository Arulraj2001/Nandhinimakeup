import QRCode from "qrcode";

export interface UpiPayParams {
  upiId: string;
  payeeName: string;
  amount: number;
  orderNumber: string;
}

/**
 * Builds standard UPI click-to-pay deep link
 */
export function buildUpiPayUrl(params: UpiPayParams): string {
  const { upiId, payeeName, amount, orderNumber } = params;
  if (!amount || Number(amount) <= 0) {
    return "";
  }
  const formattedAmount = Number(amount).toFixed(2);
  const search = new URLSearchParams({
    pa: upiId.trim(),
    pn: payeeName.trim(),
    am: formattedAmount,
    cu: "INR",
    tn: orderNumber.trim(),
  });

  return `upi://pay?${search.toString()}`;
}

/**
 * Generates an SVG string representation of a QR code on the server
 */
export async function generateUpiQrSvg(upiUrl: string): Promise<string> {
  return QRCode.toString(upiUrl, {
    type: "svg",
    margin: 1,
    width: 240,
    color: {
      dark: "#1A1A1A",
      light: "#FFFFFF",
    },
  });
}
