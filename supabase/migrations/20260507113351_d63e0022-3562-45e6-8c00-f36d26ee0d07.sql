-- Activate talent + employer WhatsApp lines using known Unipile account_ids.
UPDATE public.messaging_channels
SET unipile_account_id = 'mYl_4PSKSFSSaPLhRE4E9w',
    phone_e164 = '+8801889825025',
    status = 'connected'
WHERE agent_key = 'talent-outreach';

UPDATE public.messaging_channels
SET unipile_account_id = 'mkPpEOHeSWyyMNrztwcTmg',
    phone_e164 = '+8801708459008',
    status = 'connected'
WHERE agent_key = 'employer-outreach';