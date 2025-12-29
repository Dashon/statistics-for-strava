# AI Thumbnail & Video Generation Feature

Generate photorealistic AI thumbnails and videos of you running at your actual activity locations using Gemini 3 Pro Image and Veo.

## Overview

This feature uses your Strava activity's GPS coordinates (latitude/longitude), a reference photo of yourself, and Google Street View imagery to generate AI-powered media showing you running/cycling at that specific location. The AI considers:

- Your reference photo (appearance, athletic gear)
- Google Street View of the actual location
- Exact GPS coordinates from your run
- Location context (reverse geocoded address)
- Time of day (sunrise, afternoon, golden hour, etc.)
- Activity type (running, cycling, etc.)
- Environmental details and landmarks from the location

## Setup

### 1. Get API Keys

**Google Gemini API** (Required):
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key with access to:
   - Gemini 3 Pro Image (for image generation)
   - Veo 3.1 (for video generation - optional)
3. Add it to your `.env` file:

```bash
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

**Google Maps API** (Optional but recommended):
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Maps Static API
3. Create an API key
4. Add it to your `.env` file:

```bash
GOOGLE_MAPS_API_KEY=your_maps_api_key_here
```

If you don't provide a Maps API key, the system will use your Gemini API key as a fallback for Street View requests.

### 2. Run Database Migration

Apply the migration to add the required tables and columns:

```bash
# If using a migration tool
npm run migrate

# Or manually run the SQL migration
psql $DATABASE_URL < migrations/0008_ai_thumbnails.sql
```

This creates:
- `user_reference_images` table - stores your reference photos
- `ai_thumbnail_url`, `ai_thumbnail_prompt`, `ai_thumbnail_generated_at` columns in the `activity` table
- `thumbnail_status`, `thumbnail_error` columns in the `generation_status` table

### 3. Upload a Reference Image

1. Navigate to **Settings** in your dashboard
2. Scroll to the **AI Thumbnails** section
3. Click **Upload Reference Image**
4. Choose a clear photo of yourself in athletic gear (running or cycling)
5. The first image uploaded becomes the default

**Tips for best results:**
- Use a well-lit, high-quality photo
- Show yourself in athletic motion if possible
- Wear typical running/cycling gear
- Clear facial features help the AI maintain consistency

## Usage

### Automatic Generation (Coming Soon)

Thumbnails can be automatically generated when new activities are synced from Strava.

### Manual Generation

Generate a thumbnail for a specific activity via API:

```bash
POST /api/generate-thumbnail
Content-Type: application/json

{
  "activityId": "12345678",
  "referenceImageId": "optional_specific_image_id"
}
```

If `referenceImageId` is omitted, the system will:
1. Try to find a default image matching the activity type (running/cycling)
2. Fall back to any default reference image

### Check Generation Status

```bash
GET /api/generate-thumbnail?activityId=12345678
```

Response:
```json
{
  "activityId": "12345678",
  "thumbnailUrl": "https://...",
  "thumbnailPrompt": "Detailed prompt used...",
  "status": "completed",
  "error": null
}
```

Status values:
- `pending` - Not yet started
- `generating` - Currently being generated
- `completed` - Successfully generated
- `failed` - Generation failed (check error field)

## Architecture

### Components

1. **Reference Image Management**
   - Upload: `POST /api/reference-image`
   - List: `GET /api/reference-image`
   - Delete: `DELETE /api/reference-image?imageId=xxx`

2. **Thumbnail Generation**
   - API: `/api/generate-thumbnail`
   - Trigger.dev Task: `generate-ai-thumbnail`
   - Utility: `/src/lib/gemini.ts`

3. **Database Schema**
   - `user_reference_images` - User's reference photos
   - `activity.ai_thumbnail_url` - Generated thumbnail URL
   - `activity.ai_thumbnail_prompt` - Prompt used for generation
   - `generation_status.thumbnail_status` - Track generation progress

### How It Works

1. **User uploads reference image** → Stored in `user_reference_images`
2. **User triggers thumbnail generation** → Background job queued via Trigger.dev
3. **Background worker**:
   - Fetches activity lat/long
   - Reverse geocodes coordinates to get location name
   - Fetches Google Street View image of the location
   - Fetches user's reference image
   - Calls Gemini 3 Pro Image with:
     - Reference photo (for identity)
     - Street View image (for environment)
     - Detailed prompt (for context and instructions)
   - Generates photorealistic image
   - Stores base64 image in `activity.ai_thumbnail_url`
4. **User views thumbnail** → Displayed in activity details

### Gemini Image Generation

The system uses **two-image input** to Gemini 3 Pro Image:

**Image 1**: User's reference photo
- Provides identity, appearance, body type
- Captures facial features and athletic gear

**Image 2**: Google Street View
- Provides actual environment and landmarks
- Shows real location details

**Prompt**: Detailed instructions including:
```
Location: Central Park West, Manhattan, New York
Activity: Morning Run (8.2 km)
Time: early morning sunrise

Generate a photorealistic image placing the person from Image 1
into the environment from Image 2, showing them running dynamically
with professional form. Use sunrise lighting, include motion blur,
and maintain their identity exactly.
```

The result is a photorealistic composite that looks like a professional action shot taken at that exact location.

## Video Generation (Beta)

In addition to static thumbnails, you can generate cinematic videos using Gemini Veo:

```typescript
import { generateRunningVideo } from '@/lib/gemini';

const videoUri = await generateRunningVideo({
  referenceImageUrl: 'user-photo.jpg',
  latitude: 40.7829,
  longitude: -73.9654,
  activityName: 'Morning Run',
  sportType: 'Run',
  userPrompt: 'running through the route with high energy' // optional
});
```

Videos are generated with:
- 720p resolution
- 16:9 aspect ratio
- Cinematic tracking shots
- Slow motion effects
- Professional sports videography style

Note: Video generation is a **long-running operation** (several minutes) and polls for completion.

## Limitations & Future Enhancements

### Current Features ✅

- ✅ **Real image generation** using Gemini 3 Pro Image
- ✅ **Street View integration** for authentic location context
- ✅ **Identity preservation** from reference photos
- ✅ **Dynamic pose generation** (not just copy-paste)
- ✅ **Time-of-day lighting** adjustments
- ✅ **Video generation** using Veo (beta)

### Current Limitations

1. **Images stored as base64** - Works but increases database size. For production at scale, migrate to cloud storage (S3, Supabase Storage, Cloudinary)

2. **Street View availability** - Some locations don't have Street View coverage. System falls back gracefully to using only reference image

3. **Manual generation** - Currently per-activity. No automatic generation on sync yet

4. **Video generation time** - Videos take several minutes to generate (Veo limitation)

### Planned Enhancements

- [ ] Automatic thumbnail generation on activity sync
- [ ] Cloud storage for images (S3/Cloudinary)
- [ ] Multiple reference images per activity type
- [ ] User preference for style (photorealistic vs artistic)
- [ ] Thumbnail gallery view
- [ ] Social sharing with custom thumbnails
- [ ] Batch regeneration of all activity thumbnails
- [ ] Progress tracking for video generation
- [ ] Multiple video styles (action, cinematic, slow-mo)

## API Reference

### Upload Reference Image

```typescript
POST /api/reference-image
Content-Type: multipart/form-data

file: File           // Image file (max 5MB)
imageType: string    // 'running' | 'cycling' | 'general'
isDefault: boolean   // Set as default image
```

### Generate Thumbnail

```typescript
POST /api/generate-thumbnail

{
  activityId: string,           // Required
  referenceImageId?: string     // Optional, uses default if omitted
}
```

### Delete Reference Image

```typescript
DELETE /api/reference-image?imageId={imageId}
```

## Costs

- **Gemini 3 Pro Image**: Check [Google AI pricing](https://ai.google.dev/pricing) for current rates
- **Veo Video Generation**: Premium feature, check pricing
- **Google Maps Street View API**:
  - First 100,000 requests/month: $0.002 per request
  - Free tier available
- **Storage**: Base64 in database (free but space-intensive) or cloud storage (variable)

## Troubleshooting

### "No reference image found"

Upload at least one reference image in Settings → AI Thumbnails

### "Activity does not have location data"

Some Strava activities don't include GPS coordinates. Ensure your activity was recorded with GPS enabled.

### Generation failed

Check the error in the generation status API or database. Common issues:
- Invalid Gemini API key
- Rate limiting (too many requests)
- Invalid image format

### Reverse geocoding fails

The system uses OpenStreetMap's free Nominatim service. If it fails, coordinates are used as fallback.

## Security Considerations

- Reference images are user-specific (filtered by `userId`)
- All API endpoints require authentication
- Image uploads limited to 5MB
- SQL injection prevented via Drizzle ORM parameterized queries

## Performance

- Thumbnail generation runs in background via Trigger.dev
- Concurrency limited to 2 simultaneous generations
- Automatic retries on failure (max 2 attempts)
- No impact on main app performance

## Support

For issues or questions, please open an issue on GitHub.
