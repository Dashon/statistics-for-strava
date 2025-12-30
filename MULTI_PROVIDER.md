# Multi-Provider Fitness Integration

This document outlines the architecture and setup for the multi-provider fitness data integration system in QT.run.

## Supported Platforms

| Provider | Type | Primary For | Data Collected |
|----------|------|-------------|----------------|
| **Strava** | OAuth 2.0 | Login/Sync | Runs, Rides, Swims, Profile |
| **Garmin** | OAuth 1.0a | Sync | Runs, Dailies, Sleep, Health |
| **Oura Ring** | OAuth 2.0 | Sync | Sleep, Readiness, HRV, Workouts |
| **WHOOP** | OAuth 2.0 | Sync | Strain, Recovery, Sleep, Workouts |
| **Fitbit** | OAuth 2.0 | Sync | Steps, Heart Rate, Sleep, Workouts |
| **Polar** | OAuth 2.0 | Sync | Exercises, Nightly Recharge, Sleep |
| **COROS** | OAuth 2.0 | Sync | Runs, Dailies, Sleep |
| **Apple Health**| Webhook | Sync | All data exported via bridge app |
| **Google Fit** | Webhook | Sync | All data exported via bridge app |

---

## Technical Architecture

### 1. Database Structure
The integration relies on three main components in the schema:

- **`User.api_key`**: A secure key starting with `qt_` used to authenticate webhook ingestion.
- **`provider_connection`**: Stores OAuth tokens, refresh tokens, and synchronization status for each provider connected to a user.
- **`activity`**: Normalized table where `provider` and `external_id` are used to track the source of the data and prevent duplicates.

### 2. OAuth Flow
Unified OAuth handlers are located in `src/app/api/oauth/`:
- **`/connect`**: Initiates the flow by generating the provider-specific authorization URL. Handles OAuth 1.0a state (Garmin) using temporary cookies.
- **`/callback`**: Reusable callback that exchanges codes for tokens, handles user registration (Polar), and saves/updates the `provider_connection` table.

### 3. Provider Libraries
Each provider has a dedicated library in `src/lib/providers/` that exposes:
- Token exchange and refresh logic.
- Data fetching functions (Activities, Sleep, Readiness).
- Scope and URL generation.

---

## Setup Instructions

### Environment Variables
Copy `.env.providers.example` to `.env.local` and fill in the credentials for the providers you wish to support.

```bash
# Example
OURA_CLIENT_ID=...
OURA_CLIENT_SECRET=...
```

### Developer Portals
To get credentials, you must register a "Developer Application" on each platform:

- **Strava**: [developers.strava.com](https://developers.strava.com)
- **Garmin**: [developer.garmin.com](https://developer.garmin.com) (Requires manual approval & signed agreement)
- **Oura**: [cloud.ouraring.com/oauth/applications](https://cloud.ouraring.com/oauth/applications)
- **WHOOP**: [developer.whoop.com](https://developer.whoop.com)
- **Fitbit**: [dev.fitbit.com/apps](https://dev.fitbit.com/apps)
- **Polar**: [admin.polaraccesslink.com](https://admin.polaraccesslink.com)
- **COROS**: [open.coros.com](https://open.coros.com) (Requires manual approval)

---

## Generic Ingestion Webhook (Apple/Google)

Since Apple Health and Google Fit data reside on-device, we use a "Utility App" strategy.

**Endpoint**: `POST /api/webhooks/ingest`
**Auth**: `X-API-Key` header

### Instructions for Users:
1. **iOS**: Download **Health Auto Export**.
2. **Android**: Download **Health Connect Exports**.
3. Configure the app's REST API/Webhook settings:
   - **URL**: `https://your-domain.com/api/webhooks/ingest`
   - **Header**: `X-API-Key: your_qt_key`
4. Set to "Auto-Sync" to send data to QT automatically.

---

## Developer Guide: Adding a New Provider

1. **Add Library**: Create `src/lib/providers/[name].ts` with token and data fetching logic.
2. **Export**: Add to the index in `src/lib/providers/index.ts`.
3. **Connect Handler**: Add the provider to the switch case in `src/app/api/oauth/connect/route.ts`.
4. **Callback Handler**: Add the logic to `src/app/api/oauth/callback/route.ts`.
5. **UI**: Add to the `PROVIDERS` array in `src/app/dashboard/settings/ConnectedSources.tsx`.
6. **Sync Task**: Implement a Trigger.dev task for background synchronization.
