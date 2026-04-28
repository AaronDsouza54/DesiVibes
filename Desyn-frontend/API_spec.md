# Desyn API Spec (Hackathon)

This spec is the contract between:
- **Expo app** (`Desyn/`) using **Supabase Auth + Supabase Storage**
- **FastAPI backend** (`backend/`) using **Supabase Postgres**

## Base URL

- Backend base: `${EXPO_PUBLIC_API_URL}/api/v1`
- Health: `GET ${EXPO_PUBLIC_API_URL}/health`

---

## Auth (Supabase Auth only)

### Frontend

- Sign up / login via Supabase JS SDK.
- Session persistence via Supabase (SecureStore on Expo).
- Send Supabase JWT to backend:

```
Authorization: Bearer <supabase_access_token>
```

### Backend

- Validate Supabase JWT using JWKS.
- Extract identity from `sub` claim (Supabase user id).
- Auto-create backend `users` + `profiles` rows on first authenticated request.

---

## Storage (Supabase Storage only)

- Frontend uploads images directly to Supabase Storage.
- Frontend gets **public URL**.
- Frontend sends URLs to backend in `media_urls` / `avatar_url`.
- Backend **never** accepts file uploads.

Buckets:
- `post-images`
- `profile-images`

---

## Standard error format

```json
{
  "error": "Human readable message",
  "code": "STRING_CODE",
  "status": 400,
  "details": null
}
```

---

## Pagination (cursor only)

All list endpoints return:

```json
{
  "items": [ ... ],
  "next_cursor": "string|null"
}
```

Request params:
- `limit` (default 20, max 50)
- `cursor` (optional opaque string)

---

## Privacy model (backend enforced only)

Frontend must not enforce privacy rules.

### Post visibility
- `public`: any authenticated user can view
- `followers`: viewer follows author OR viewer is author
- `family`: viewer shares a family group with author OR viewer is author
- `groups`: viewer is a member of the post’s community OR viewer is author

### Paid posts
If `is_paid=true`, backend enforces:
- Author can view
- Otherwise viewer must have an **active subscription** to the author (payments are stubbed)

---

## Core models (API shape)

### Post

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "caption": "string|null",
  "visibility": "public|followers|family|groups",
  "location": "string|null",
  "community_id": "uuid|null",
  "is_paid": false,
  "price_cents": 499,
  "media": [{ "id": "uuid", "url": "https://...", "position": 0 }],
  "author": { "id": "uuid", "username": "string", "display_name": "string|null", "profile": { "avatar_url": "string|null" } },
  "like_count": 0,
  "comment_count": 0,
  "is_liked": false,
  "created_at": "2026-04-27T00:00:00Z"
}
```

---

## Endpoints

### Users / Profiles

#### `GET /me`

- **Auth**: required
- **Notes**: creates backend profile if missing

Response 200:

```json
{
  "id": "uuid",
  "supabase_user_id": "uuid",
  "email": "string|null",
  "profile": { "username": "string", "display_name": "string|null", "bio": "string|null", "avatar_url": "string|null" }
}
```

#### `PATCH /me`

- **Auth**: required

Body:

```json
{ "username": "string?", "display_name": "string?", "bio": "string?", "avatar_url": "string?" }
```

Response 200:

```json
{ "message": "Profile updated" }
```

#### `GET /users/{userId}`

- **Auth**: required

Response 200:

```json
{ "user": { ... }, "is_following": false }
```

#### `POST /users/{userId}/follow`
#### `DELETE /users/{userId}/follow`

---

### Posts

#### `POST /posts`

- **Auth**: required

Body:

```json
{
  "caption": "string|null",
  "visibility": "public|followers|family|groups",
  "location": "string|null",
  "community_id": "uuid|null",
  "is_paid": false,
  "price_cents": 499,
  "media_urls": ["https://..."]
}
```

Response 201: `{ ...Post }`

#### `GET /feed?limit=20&cursor=<cursor?>`

Response 200:

```json
{ "items": [ { ...Post } ], "next_cursor": "string|null" }
```

#### `POST /posts/{postId}/like`
#### `DELETE /posts/{postId}/like`

#### `GET /posts/{postId}/comments?limit=20&cursor=<cursor?>`
#### `POST /posts/{postId}/comments`

---

### Communities

#### `POST /communities`
#### `GET /communities/{communityId}`
#### `POST /communities/{communityId}/join`
#### `DELETE /communities/{communityId}/leave`
#### `GET /communities/{communityId}/feed?limit=20&cursor=<cursor?>`

---

### Events

#### `POST /events`
#### `GET /events/feed?limit=20&cursor=<cursor?>`
#### `POST /events/{eventId}/rsvp`

Body:

```json
{ "status": "going|interested|not_going" }
```

---

### Family system

#### `POST /family-groups`
#### `GET /family-groups`
#### `POST /family-groups/{familyGroupId}/members`
#### `GET /family-groups/{familyGroupId}/albums`
#### `POST /family-groups/{familyGroupId}/albums`

---

### Creator monetization (stubbed payments)

#### `POST /creators/profile`
#### `POST /creators/{userId}/subscribe`
#### `DELETE /creators/{userId}/subscribe`
#### `POST /creators/{userId}/tip`

### Header

Protected endpoints require:
```
Authorization: Bearer <access_token>
```

### Access Control: Auth Endpoints

| Endpoint | Auth Required | Description |
|----------|:---:|---|
| POST `/auth/register` | No | Public registration |
| POST `/auth/login` | No | Public login |
| POST `/auth/refresh` | No | Use refresh token in body |
| POST `/auth/logout` | Yes | Invalidates current token |

---

## Data Models & Entities

### User
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "username",
  "display_name": "Display Name",
  "is_verified": false,
  "created_at": "2024-04-27T00:00:00Z",
  "updated_at": "2024-04-27T00:00:00Z"
}
```

### UserProfile
```json
{
  "user_id": "uuid",
  "bio": "Bio text",
  "avatar_url": "https://example.com/avatar.jpg",
  "website_url": "https://example.com",
  "languages": ["Hindi", "English"],
  "religion": "Hindu",
  "region_origin": "Punjab",
  "location_city": "Toronto",
  "location_country": "CA",
  "is_pseudonymous": false,
  "family_mode_enabled": false,
  "follower_count": 100,
  "following_count": 50,
  "post_count": 25
}
```

### Post
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "caption": "Post caption",
  "visibility": "public|followers|family|custom",
  "location": "Toronto, Canada",
  "is_paid": false,
  "price_cents": null,
  "media": [
    {
      "id": "uuid",
      "url": "https://...",
      "media_type": "image|video",
      "position": 0,
      "width": 1920,
      "height": 1080
    }
  ],
  "author": { ...UserWithProfile },
  "like_count": 10,
  "comment_count": 3,
  "is_liked": false,
  "created_at": "2024-04-27T00:00:00Z"
}
```

### Visibility Levels

| Level | Who Can See | Notes |
|-------|---|---|
| `public` | Everyone | Indexed, searchable |
| `followers` | Followers only | Requires follow relationship |
| `family` | Family members | Members of user's family group |
| `custom` | Specified rules | Via `post_visibility_rules` table |

### Community
```json
{
  "id": "uuid",
  "name": "South Asian Tech",
  "slug": "south-asian-tech",
  "description": "...",
  "avatar_url": "...",
  "cover_url": "...",
  "community_type": "language|religion|region|interest",
  "tags": ["tech", "south-asian"],
  "is_private": false,
  "member_count": 1200,
  "is_member": false,
  "creator_id": "uuid",
  "created_at": "2024-04-27T00:00:00Z"
}
```

### Event
```json
{
  "id": "uuid",
  "title": "Diwali Festival 2024",
  "description": "...",
  "cover_url": "...",
  "category": "festival|wedding|meetup|tech|social",
  "organizer_id": "uuid",
  "community_id": "uuid|null",
  "location_name": "High Park",
  "location_address": "1873 Bloor St W",
  "location_city": "Toronto",
  "is_virtual": false,
  "virtual_url": "https://zoom.us/...",
  "starts_at": "2024-05-15T18:00:00Z",
  "ends_at": "2024-05-15T22:00:00Z",
  "is_free": true,
  "ticket_price_cents": null,
  "attendee_count": 1432,
  "is_attending": false,
  "created_at": "2024-04-27T00:00:00Z"
}
```

### Creator
```json
{
  "user_id": "uuid",
  "tagline": "Premium content creator",
  "subscription_price_cents": 499,
  "is_verified_creator": true,
  "total_earnings_cents": 50000,
  "is_subscribed": false,
  "user": { ...User with profile }
}
```

---

## Endpoints

### Auth Endpoints

#### Register
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "SecurePassword123!",
  "display_name": "Display Name" (optional)
}

Response 201:
{
  "user": { ...User },
  "tokens": {
    "access_token": "eyJ...",
    "refresh_token": "...",
    "expires_in": 900
  }
}

Errors:
- 400: Invalid email, username already exists, weak password
- 409: Email already registered
```

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response 200:
{
  "user": { ...User },
  "tokens": {
    "access_token": "eyJ...",
    "refresh_token": "...",
    "expires_in": 900
  }
}

Errors:
- 401: Invalid credentials
- 404: User not found
```

#### Refresh Token
```
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "..."
}

Response 200:
{
  "access_token": "eyJ...",
  "refresh_token": "...",
  "expires_in": 900
}

Errors:
- 401: Invalid or expired refresh token
```

#### Logout
```
POST /auth/logout
Authorization: Bearer <access_token>

Response 200:
{
  "message": "Logged out successfully"
}
```

---

### User Endpoints

#### Get Current User
```
GET /me
Authorization: Bearer <access_token>

Response 200:
{
  "id": "uuid",
  "email": "...",
  "username": "...",
  "profile": { ...UserProfile }
}

Access Control: Authenticated users only
```

#### Update Current User
```
PATCH /me
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "bio": "Updated bio",
  "avatar_url": "https://...",
  "website_url": "https://...",
  "languages": ["Hindi", "English"],
  "religion": "Hindu",
  "region_origin": "Punjab",
  "location_city": "Toronto",
  "family_mode_enabled": false
}

Response 200:
{
  "message": "Profile updated"
}

Errors:
- 400: Invalid input
```

#### Get User Profile
```
GET /users/{userID}
Authorization: Bearer <access_token>

Response 200:
{
  "user": { ...UserWithProfile },
  "is_following": false
}

Access Control: Anyone can view (respects privacy settings)
```

#### Search Users
```
GET /users/search?q=<query>&limit=20&offset=0
Authorization: Bearer <access_token>

Response 200:
{
  "users": [ { ...UserWithProfile } ],
  "limit": 20,
  "offset": 0
}

Access Control: Authenticated users
```

#### Follow User
```
POST /users/{userID}/follow
Authorization: Bearer <access_token>

Response 200:
{
  "message": "Now following user"
}

Errors:
- 400: Cannot follow self
- 404: User not found
```

#### Unfollow User
```
DELETE /users/{userID}/follow
Authorization: Bearer <access_token>

Response 200:
{
  "message": "Unfollowed user"
}
```

#### Block User
```
POST /users/{userID}/block
Authorization: Bearer <access_token>

Response 200:
{
  "message": "User blocked"
}

Access Control: Can only block other users
```

#### Get User Posts
```
GET /users/{userID}/posts?limit=20&offset=0
Authorization: Bearer <access_token>

Response 200:
{
  "posts": [ { ...Post } ],
  "limit": 20,
  "offset": 0
}

Access Control: Privacy-filtered (respects post visibility)
```

---

### Feed Endpoint

#### Get Feed
```
GET /feed?limit=20&offset=0
Authorization: Bearer <access_token>

Response 200:
{
  "posts": [ { ...Post } ],
  "limit": 20,
  "offset": 0
}

Algorithm:
1. Posts from followed users (visibility: followers)
2. Posts from family group members (visibility: family)
3. Public posts with engagement boosts
4. Exclude: blocked users, muted users, deleted posts
5. Order: newest first (with algorithm modifications)

Access Control: Authenticated users
```

---

### Post Endpoints

#### Create Post
```
POST /posts
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "caption": "Post text (optional)",
  "visibility": "public|followers|family|custom",
  "location": "Toronto, Canada (optional)",
  "is_paid": false,
  "price_cents": null,
  "media_urls": ["https://...", "https://..."],
  "allowed_user_ids": ["uuid"] (if visibility: custom),
  "allowed_community_ids": ["uuid"] (if visibility: custom)
}

Response 201:
{ ...Post }

Errors:
- 400: Invalid visibility, missing caption/media
- 413: File too large
```

#### Get Post
```
GET /posts/{postID}
Authorization: Bearer <access_token>

Response 200:
{ ...Post }

Access Control: Respects post visibility rules
Errors:
- 403: Cannot view this post
- 404: Post not found
```

#### Delete Post
```
DELETE /posts/{postID}
Authorization: Bearer <access_token>

Response 200:
{
  "message": "Post deleted"
}

Access Control: Post owner only
```

#### Like Post
```
POST /posts/{postID}/like
Authorization: Bearer <access_token>

Response 200:
{
  "message": "Post liked"
}

Access Control: Can like posts you can view
```

#### Unlike Post
```
DELETE /posts/{postID}/like
Authorization: Bearer <access_token>

Response 200:
{
  "message": "Post unliked"
}
```

#### Get Comments
```
GET /posts/{postID}/comments?limit=20&offset=0
Authorization: Bearer <access_token>

Response 200:
{
  "comments": [
    {
      "id": "uuid",
      "body": "...",
      "author": { ...User },
      "created_at": "...",
      "parent_id": null (or uuid for replies)
    }
  ]
}

Access Control: Only if can view post
```

#### Add Comment
```
POST /posts/{postID}/comments
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "body": "Comment text",
  "parent_id": "uuid" (optional, for replies)
}

Response 201:
{
  "id": "uuid",
  "body": "...",
  "author": { ...User },
  "created_at": "..."
}

Errors:
- 400: Empty comment
- 404: Post or parent comment not found
```

---

### Community Endpoints

#### List Communities
```
GET /communities?type=language|religion|region|interest&limit=20&offset=0
Authorization: Bearer <access_token>

Response 200:
{
  "communities": [ { ...Community } ],
  "limit": 20,
  "offset": 0
}

Access Control: Public, authenticated
```

#### Create Community
```
POST /communities
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Community Name",
  "description": "...",
  "avatar_url": "https://...",
  "cover_url": "https://...",
  "community_type": "language|religion|region|interest",
  "tags": ["tag1", "tag2"],
  "is_private": false
}

Response 201:
{ ...Community }

Access Control: Authenticated users
```

#### Get Community
```
GET /communities/{communityID}
Authorization: Bearer <access_token>

Response 200:
{ ...Community with is_member flag }

Access Control: Public (unless private and not member)
```

#### Search Communities
```
GET /communities/search?q=<query>&limit=20&offset=0
Authorization: Bearer <access_token>

Response 200:
{
  "communities": [ { ...Community } ]
}
```

#### Join Community
```
POST /communities/{communityID}/join
Authorization: Bearer <access_token>

Response 200:
{
  "message": "Joined community"
}

Access Control: Cannot join private without invite
```

#### Leave Community
```
DELETE /communities/{communityID}/leave
Authorization: Bearer <access_token>

Response 200:
{
  "message": "Left community"
}
```

---

### Event Endpoints

#### List Events
```
GET /events?limit=20&offset=0
Authorization: Bearer <access_token>

Response 200:
{
  "events": [ { ...Event } ],
  "limit": 20,
  "offset": 0
}

Access Control: Public, authenticated
```

#### Get Event
```
GET /events/{eventID}
Authorization: Bearer <access_token>

Response 200:
{ ...Event with is_attending flag }
```

#### Create Event
```
POST /events
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Event Title",
  "description": "...",
  "cover_url": "https://...",
  "category": "festival|wedding|meetup|tech|social",
  "community_id": "uuid (optional)",
  "location_name": "Venue Name",
  "location_address": "Address",
  "location_city": "City",
  "is_virtual": false,
  "virtual_url": "https://zoom.us/..." (if virtual),
  "starts_at": "2024-05-15T18:00:00Z",
  "ends_at": "2024-05-15T22:00:00Z",
  "is_free": true,
  "ticket_price_cents": null
}

Response 201:
{ ...Event }

Access Control: Authenticated users
```

#### Attend Event
```
POST /events/{eventID}/attend
Authorization: Bearer <access_token>

Response 200:
{
  "message": "Marked as attending"
}
```

#### Unattend Event
```
DELETE /events/{eventID}/attend
Authorization: Bearer <access_token>

Response 200:
{
  "message": "Removed from attendees"
}
```

---

### Creator Endpoints

#### Get Creator Profile
```
GET /creators/{creatorID}
Authorization: Bearer <access_token>

Response 200:
{
  "creator": { ...Creator },
  "is_subscribed": false
}

Access Control: Public
```

#### Setup Creator Profile
```
POST /creators/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "tagline": "Premium photographer specializing in Indian weddings",
  "subscription_price_cents": 499
}

Response 200:
{ ...Creator }

Access Control: Only own profile
```

#### Subscribe to Creator
```
POST /creators/{creatorID}/subscribe
Authorization: Bearer <access_token>

Response 200:
{
  "subscription": {
    "id": "uuid",
    "status": "active",
    "price_cents": 499,
    "current_period_end": "2024-05-27T00:00:00Z"
  }
}

Access Control: Authenticated users (payment processing stubbed)
```

#### Unsubscribe from Creator
```
DELETE /creators/{creatorID}/subscribe
Authorization: Bearer <access_token>

Response 200:
{
  "message": "Unsubscribed"
}

Access Control: Authenticated users
```

#### Send Tip
```
POST /creators/{creatorID}/tip
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "amount_cents": 500,
  "message": "Great content!",
  "post_id": "uuid (optional)"
}

Response 200:
{
  "tip": {
    "id": "uuid",
    "amount_cents": 500,
    "created_at": "..."
  }
}

Access Control: Authenticated users (payment processing stubbed)
```

---

## Pagination

All list endpoints support:
- `limit`: Items per page (1-100, default 20)
- `offset`: Starting position (default 0)

Response format:
```json
{
  "items": [ ... ],
  "limit": 20,
  "offset": 0,
  "total": 1000 (if provided),
  "has_more": true
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "status": 400
}
```

### Common Error Codes

| Code | HTTP | Description |
|------|------|---|
| `INVALID_INPUT` | 400 | Validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `UNAUTHORIZED` | 401 | Authentication failed |
| `FORBIDDEN` | 403 | Access denied |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Access Control Rules (By Endpoint)

### Authentication Required
```
✓ POST /auth/logout
✓ GET /me
✓ PATCH /me
✓ GET /users/{userID}
✓ GET /users/search
✓ POST /users/{userID}/follow
✓ DELETE /users/{userID}/follow
✓ POST /users/{userID}/block
✓ GET /users/{userID}/posts
✓ GET /feed
✓ POST /posts
✓ GET /posts/{postID}
✓ DELETE /posts/{postID}
✓ POST /posts/{postID}/like
✓ DELETE /posts/{postID}/like
✓ GET /posts/{postID}/comments
✓ POST /posts/{postID}/comments
✓ GET /communities
✓ POST /communities
✓ GET /communities/{communityID}
✓ GET /communities/search
✓ POST /communities/{communityID}/join
✓ DELETE /communities/{communityID}/leave
✓ GET /events
✓ GET /events/{eventID}
✓ POST /events
✓ POST /events/{eventID}/attend
✓ DELETE /events/{eventID}/attend
✓ GET /creators/{creatorID}
✓ POST /creators/profile
✓ POST /creators/{creatorID}/subscribe
✓ DELETE /creators/{creatorID}/subscribe
✓ POST /creators/{creatorID}/tip
```

### Public (No Auth Required)
```
✓ POST /auth/register
✓ POST /auth/login
✓ POST /auth/refresh
✓ GET /health
```

### Resource-Level Access Control

#### Posts
- **View**: Depends on visibility:
  - `public`: Everyone
  - `followers`: Followers + self
  - `family`: Family members + self
  - `custom`: Via post_visibility_rules
- **Modify/Delete**: Owner only

#### Profiles
- **View**: Everyone (respects is_pseudonymous flag)
- **Modify**: Self only

#### Communities
- **View**: Public communities (or members if private)
- **Modify**: Creator/admins only

#### Events
- **View**: Everyone
- **Modify**: Organizer/admins only

---

## Rate Limiting

Implemented per IP/user:
- 100 requests/minute for unauthenticated
- 500 requests/minute for authenticated
- 10 requests/minute for auth endpoints

Header: `RateLimit-Remaining`, `RateLimit-Reset`

---

## Media Handling

**Supported Types:**
- Images: JPEG, PNG, WebP (max 10MB)
- Videos: MP4, WebM (max 100MB)

**URL Format:**
```
POST /posts
{
  "media_urls": ["https://cdn.example.com/..."]
}
```

Images are optimized into multiple resolutions server-side.

---

## Payment Processing (Stubbed)

All payment endpoints return success but don't process real payments:

**Stubbed Endpoints:**
- `POST /creators/{id}/subscribe` → Mock Stripe token validation
- `POST /creators/{id}/tip` → Mock transaction ID
- `POST /posts/{id}` (paid) → Mock gating logic

In production, integrate Stripe/payment provider.

---

## Timestamps

All timestamps are ISO 8601 UTC:
```
2024-04-27T15:30:45Z
```

---

## CORS Configuration

**Allowed Origins:** (from `ALLOWED_ORIGINS` env)
- `http://localhost:8081`
- `http://localhost:19006`
- `https://desyn.app`

**Allowed Methods:** GET, POST, PUT, PATCH, DELETE, OPTIONS

**Allowed Headers:** Accept, Authorization, Content-Type

**Credentials:** true

---

## Health Check

```
GET /health

Response 200:
{
  "status": "ok"
}
```

