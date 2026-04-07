import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "GroUp Academy"

interface CreditReceiptProps {
  name?: string
  amount?: number
  new_balance?: number
  transaction_type?: string
}

const CreditReceiptEmail = ({ name, amount, new_balance, transaction_type }: CreditReceiptProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Credit transaction receipt — {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Credit Transaction Receipt 🧾</Heading>
        <Text style={text}>
          {name ? `Hi ${name},` : 'Hi there,'}
        </Text>
        <Text style={text}>
          Here's a summary of your recent credit transaction:
        </Text>
        <Container style={receiptBox}>
          <Text style={receiptRow}>
            <strong>Type:</strong> {transaction_type || 'Transaction'}
          </Text>
          <Text style={receiptRow}>
            <strong>Amount:</strong> {(amount || 0) > 0 ? '+' : ''}{amount || 0} credits
          </Text>
          <Hr style={divider} />
          <Text style={receiptRow}>
            <strong>New Balance:</strong> {new_balance || 0} credits
          </Text>
        </Container>
        <Text style={footer}>
          Thank you for using {SITE_NAME}
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CreditReceiptEmail,
  subject: 'Credit transaction receipt 🧾',
  displayName: 'Credit receipt',
  previewData: { name: 'Tanvir', amount: -25, new_balance: 225, transaction_type: 'Career Assessment' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }
const container = { padding: '32px 28px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#333333', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#677280', lineHeight: '1.6', margin: '0 0 16px' }
const receiptBox = { padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', margin: '0 0 20px' }
const receiptRow = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 8px' }
const divider = { borderColor: '#e9ecef', margin: '12px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
