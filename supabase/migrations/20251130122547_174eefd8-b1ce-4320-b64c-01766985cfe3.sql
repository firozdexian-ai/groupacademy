-- Add WhatsApp group link column to content table
ALTER TABLE public.content 
ADD COLUMN whatsapp_group_link text DEFAULT NULL;