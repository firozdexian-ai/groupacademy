import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "GroUp Academy"
const APP_URL = "https://groupacademy.online/company"

interface Props {
  name?: string
  company?: string
  credits?: number
}

const Email = ({ name, company, credits = 250 }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your {company || 'company'} workspace is ready — {credits} free credits inside</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to {SITE_NAME} 🎉</Heading>
        <Text style={text}>{name ? `Hi ${name},` : 'Hi there,'}</Text>
        <Text style={text}>
          Your <strong>{company || 'company'}</strong> workspace is live. You'll find two AI agents
          ready to help you post jobs, search talent, and run growth campaigns — no setup required.
        </Text>
        {credits > 0 && (
          <Section style={creditBox}>
            <Text style={creditAmount}>{credits} free credits</Text>
            <Text style={creditCaption}>To get you started — use them on any AI agent.</Text>
          </Section>
        )}
        <Button href={APP_URL} style={button}>Open your workspace</Button>
        <Text style={footer}>— The {SITE_NAME} team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: `Your ${SITE_NAME} workspace is ready`,
  displayName: 'Company welcome',
  previewData: { name: 'Alex', company: 'Acme Corp', credits: 250 },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0f172a', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 16px' }
const creditBox = { background: '#EAF3FF', border: '1px solid #2A7DDE33', borderRadius: '8px', padding: '16px', textAlign: 'center' as const, margin: '20px 0' }
const creditAmount = { fontSize: '24px', fontWeight: 'bold' as const, color: '#2A7DDE', margin: '0 0 4px' }
const creditCaption = { fontSize: '12px', color: '#64748b', margin: 0 }
const button = { background: '#2A7DDE', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' as const, display: 'inline-block', margin: '16px 0' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '32px 0 0' }
