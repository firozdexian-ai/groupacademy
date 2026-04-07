import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "GroUp Academy"
const SITE_URL = "https://groupacademy.lovable.app"

interface TalentInviteProps {
  name?: string
  personal_note?: string
}

const TalentInviteEmail = ({ name, personal_note }: TalentInviteProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to join {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You're Invited! 🚀</Heading>
        <Text style={text}>
          {name ? `Hi ${name},` : 'Hi there,'}
        </Text>
        <Text style={text}>
          You've been identified as a top candidate and personally invited to join <strong>{SITE_NAME}</strong> — 
          a platform where ambitious professionals access AI-powered career tools, curated job opportunities, and industry-aligned training.
        </Text>
        {personal_note ? (
          <Text style={noteBox}>
            "{personal_note}"
          </Text>
        ) : null}
        <Text style={text}>
          Join now to get <strong>250 free credits</strong> and explore what's possible for your career.
        </Text>
        <Button style={button} href={SITE_URL + "/auth"}>
          Accept Invitation
        </Button>
        <Text style={footer}>
          The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TalentInviteEmail,
  subject: `You've been invited to ${SITE_NAME}`,
  displayName: 'Talent invite',
  previewData: { name: 'Karim', personal_note: 'We noticed your strong digital marketing background and think you\'d be a great fit.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }
const container = { padding: '32px 28px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#333333', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#677280', lineHeight: '1.6', margin: '0 0 16px' }
const noteBox = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 20px', padding: '16px', backgroundColor: '#f0f7ff', borderRadius: '8px', borderLeft: '4px solid #2A7DDE', fontStyle: 'italic' as const }
const button = { backgroundColor: '#2A7DDE', color: '#ffffff', fontSize: '14px', borderRadius: '8px', padding: '12px 24px', textDecoration: 'none', fontWeight: '600' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
