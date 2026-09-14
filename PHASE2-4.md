# TaliKhata Voice — Phase 2–4

## Phase 2: Voice Intelligence
- Bengali/Banglish normalization
- Structured voice intent v2
- Multi-item SALE/PURCHASE parsing
- Confidence threshold
- Ambiguous entity protection
- Voice-driven supplier purchase and customer sale flows
- Voice audit retained
- Native TTS remains client-side

## Phase 3: Intelligence & Analytics
- `/api/analytics?days=30` daily time series
- Sales, COGS, expenses, gross/net profit
- Collections and supplier payments
- Smart Shop Assistant at `/dashboard/assistant`
- Bengali answers from tenant-scoped live MongoDB data
- Analytics dashboard

## Phase 4: Mobile
- Capacitor 7 native shell
- Camera support for product photos
- Network status and offline banner
- Persistent offline command queue using Preferences
- Automatic queue flush when network returns
- Native back button and status bar setup
- Native dependencies kept out of server code

## Important offline safety rule
Offline commands are queued only as explicit client payloads. Financial execution still happens on the authenticated server and is never written directly to MongoDB from the device.
