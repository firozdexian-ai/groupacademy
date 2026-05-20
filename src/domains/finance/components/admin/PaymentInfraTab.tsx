import { SimpleAdminRegistry } from "@/components/dashboard/common/SimpleAdminRegistry";

export default function PaymentInfraTab() {
  return (
    <SimpleAdminRegistry
      table="fin_payment_configs"
      title="Payment Infrastructure"
      description="Stripe, Paddle, bKash and manual rails — track which providers are live."
      fields={[
        { key: "label", label: "Label", required: true },
        { key: "provider", label: "Provider (stripe / paddle / bkash / manual)", required: true },
        { key: "status", label: "Status (active / inactive)" },
        { key: "notes", label: "Notes", type: "textarea" },
      ]}
      primaryKey="label"
    />
  );
}
