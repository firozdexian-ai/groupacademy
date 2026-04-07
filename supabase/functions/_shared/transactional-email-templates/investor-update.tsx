import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "GroUp Academy"

interface InvestorUpdateProps {
  name?: string
  subject?: string
  content?: string
}

const InvestorUpdateEmail = ({ name, content }: InvestorUpdateProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{SITE_NAME} — Investor Update</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{SITE_NAME} — Investor Update</Heading>
        <Text style={text}>
          {name ? `Dear ${name},` : 'Dear Investor,'}
        </Text>
        {content ? (
          <Text style={contentBlock}>{content}</Text>
        ) : (
          <Text style={text}>Please find the latest update from {SITE_NAME} below.</Text>
        )}
        <Text style={footer}>
          Best regards,
          <br />
          The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: InvestorUpdateEmail,
  subject: (data: Record<string, any>) => data.subject || `${SITE_NAME} Investor Update`,
  displayName: 'Investor update',
  previewData: { name: 'John', subject: 'Q1 Growth Update', content: 'We are pleased to share our Q1 results...' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }
const container = { padding: '32px 28px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#333333', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#677280', lineHeight: '1.6', margin: '0 0 16px' }
const contentBlock = { fontSize: '14px', color: '#333333', lineHeight: '1.8', margin: '0 0 20px', whiteSpace: 'pre-wrap' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
