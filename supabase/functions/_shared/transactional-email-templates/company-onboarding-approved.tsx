import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "GroUp Academy"
const SITE_URL = "https://groupacademy.online"

interface Props {
  name?: string
  company?: string
}

const Email = ({ name, company }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're approved! Welcome to {SITE_NAME} for Companies</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You're approved! 🎉</Heading>
        <Text style={text}>{name ? `Hi ${name},` : 'Hi there,'}</Text>
        <Text style={text}>
          Great news — {company || 'your company'} has been approved for {SITE_NAME}. You can now sign up using this email and you'll be automatically added as the company owner.
        </Text>
        <Button style={button} href={SITE_URL + "/auth"}>Sign up & access portal</Button>
        <Text style={text}>
          Once signed in, you'll have access to your dedicated Company Portal — post jobs, browse talent, and deploy AI agents for your team.
        </Text>
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: `Your ${SITE_NAME} company application is approved`,
  displayName: 'Company onboarding approved',
  previewData: { name: 'Alex', company: 'Acme Corp' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }
const container = { padding: '32px 28px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#333333', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#677280', lineHeight: '1.6', margin: '0 0 16px' }
const button = { backgroundColor: '#2A7DDE', color: '#ffffff', fontSize: '14px', borderRadius: '8px', padding: '12px 24px', textDecoration: 'none', fontWeight: '600' as const, display: 'inline-block' as const, margin: '8px 0 16px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
