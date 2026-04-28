# Desyn - South Asian Social Media Platform

A production-grade hackathon demo of a South Asian social media platform built with **Expo/React Native** (frontend) and **Go** (backend), featuring creator monetization, cultural communities, family connectivity, and privacy-first design.

## Architecture

```
social-media-app/
├── Desyn/                  # Expo React Native frontend (web-primary)
│   ├── app/               # Expo Router file-based routes
│   ├── lib/api/           # API client layer
│   ├── lib/auth/          # Authentication context
│   └── [components]
│
└── backend/               # Go REST API
    ├── cmd/api/           # Entry point
    ├── internal/
    │   ├── handler/       # HTTP handlers
    │   ├── service/       # Business logic
    │   ├── repository/    # Data access
    │   ├── domain/        # Domain models
    │   └── config/        # Configuration
    └── migrations/        # PostgreSQL schema
```

---

## Prerequisites

### Frontend
- Node.js ≥ 18
- npm or yarn
- Expo CLI: `npm install -g eas-cli`

### Backend
- Go 1.23+
- PostgreSQL 12+
- Docker & Docker Compose (recommended)

---

## Quick Start (Docker)

### 1. Clone & Navigate
```bash
cd social-media-app
```

### 2. Start Backend with Docker
```bash
cd backend
docker compose up -d --build
# API runs on http://localhost:8080
# Database runs on localhost:5432
```

### 3. Start Frontend
```bash
cd ../Desyn
npm install
npm run web
# App opens on http://localhost:19006 (or printed URL)
```

### 4. Test
- **Login:** Create account or use demo credentials
- **Feed:** View posts from sample data
- **Create:** Post text + image URL
- **Profile:** View and edit profile
- **Explore:** Browse communities and events

---

## Backend Setup (Manual)

### 1. Database Setup
```bash
# Create PostgreSQL database
createdb desyn

# Set environment variables
export DATABASE_URL="postgres://user:password@localhost:5432/desyn"
export JWT_SECRET="your-secret-key-at-least-32-chars-long"
export JWT_EXPIRY_MINUTES="15"
export REFRESH_EXPIRY_DAYS="7"
export PORT="8080"
export ALLOWED_ORIGINS="http://localhost:19006,http://localhost:8081"
```

### 2. Run Migrations
```bash
cd backend
go run ./cmd/api
# Migrations run automatically on startup
```

### 3. Build & Run
```bash
# Development
go run ./cmd/api

# Production build
go build -o bin/api ./cmd/api
./bin/api

# With Docker
docker build -t desyn-api .
docker run -e DATABASE_URL="..." -p 8080:8080 desyn-api
```

### 4. Verify
```bash
curl http://localhost:8080/health
# Response: {"status":"ok"}
```

---

## Frontend Setup (Manual)

### 1. Install Dependencies
```bash
cd Desyn
npm install
```

### 2. Set Environment
```bash
# Create .env or export:
export EXPO_PUBLIC_API_URL="http://localhost:8080"
```

### 3. Run on Web
```bash
npm run web
# Opens http://localhost:19006
```

### 4. Run on iOS/Android
```bash
npm run ios
npm run android
```

---

## API Documentation

→ See [Desyn/API_spec.md](Desyn/API_spec.md) for complete endpoint reference

**Key Endpoints:**
- **Auth:** POST `/auth/register`, `/auth/login`, `/auth/refresh`
- **Feed:** GET `/feed`
- **Posts:** POST/GET/DELETE `/posts`, `/posts/{id}/like`, `/posts/{id}/comments`
- **Users:** GET `/me`, PATCH `/me`, GET `/users/{id}`, POST `/users/{id}/follow`
- **Communities:** GET/POST `/communities`, POST `/communities/{id}/join`
- **Events:** GET/POST `/events`, POST `/events/{id}/attend`
- **Creators:** GET `/creators/{id}`, POST `/creators/{id}/subscribe`

---

## Features Overview

### 1. Authentication
- Register with email/username/password
- JWT token-based auth (access + refresh tokens)
- Secure token storage (mobile: SecureStore, web: localStorage)
- Auto-refresh on token expiry

### 2. Feed & Posts
- Privacy-enforced feed (public/followers/family/custom)
- Multi-media posts (image carousel)
- Likes, comments, nested replies
- Paid/gated content support
- Location tags

### 3. User Profiles
- Editable profiles (bio, avatar, website, languages, religion, region)
- Follow/block users
- Public profile stats (posts, followers, following)
- Pseudonymous profiles option

### 4. Communities
- Browse by type (language, religion, region, interest)
- Create and manage communities
- Join/leave communities
- Community feed and member lists

### 5. Events
- Calendar view of events
- RSVP and attendance tracking
- Virtual + physical event support
- Event categories (wedding, festival, meetup, tech, social)

### 6. Creator Monetization
- Creator profiles with subscription setup
- Monthly subscriptions (stubbed payment processing)
- Tipping system (stubbed)
- Paid post gating
- Earnings dashboard (stub)

### 7. Family System
- Family groups with role-based access
- Shared albums
- Family-safe feed mode
- Generational connectivity

### 8. Privacy
- Backend-enforced visibility rules
- Private messaging (stub)
- Block/report functionality
- Data deletion (soft delete)

---

## Database Schema

**Core Tables:**
- `users` - Authentication & basic profile
- `user_profiles` - Extended profile info
- `posts` - User content
- `post_media` - Images/videos per post
- `post_visibility_rules` - Custom visibility access control
- `comments` - Nested replies
- `likes` - Post likes
- `friendships` - Follow relationships
- `blocked_users` - Blocked relationships
- `communities` - Interest groups
- `community_members` - Membership with roles
- `events` - Scheduled activities
- `event_attendees` - RSVP tracking
- `creators` - Creator profiles
- `subscriptions` - Creator subscriptions (stubbed)
- `tips` - Creator tips (stubbed)
- `family_groups` - Family units
- `family_group_members` - Family membership with roles
- `shared_albums` - Family albums

See [backend/migrations/](backend/migrations/) for full schema.

---

## Development Workflow

### Frontend
```bash
cd Desyn

# Start dev server
npm run web

# Run linter
npm run lint

# Type checking (TSScript)
npx tsc --noEmit

# Build for production
npm run build
```

### Backend
```bash
cd backend

# Run with auto-reload
go run ./cmd/api

# Format code
go fmt ./...

# Run tests
go test ./...

# Build binary
go build -o bin/api ./cmd/api
```

---

## Testing

### Manual Testing Flow
1. **Open:** http://localhost:19006 (web)
2. **Register:** Create new account
3. **Feed:** Should show empty initially
4. **Create Post:** Text + image URL → appears on feed
5. **Profile:** View your profile, edit bio
6. **Explore:** Browse mock communities
7. **Logout:** Then login again to verify token refresh

### API Testing
```bash
# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get feed (with token)
curl -X GET http://localhost:8080/api/v1/feed \
  -H "Authorization: Bearer <token>"

# Create post
curl -X POST http://localhost:8080/api/v1/posts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "caption":"Hello",
    "visibility":"public",
    "media_urls":["https://example.com/image.jpg"]
  }'
```

---

## Deployment

### Frontend (Expo)
```bash
# Preview deployment
eas build --platform web

# Submit to Expo
eas submit --platform web

# Or self-host: npm run build + deploy static files
```

### Backend (Production)
```bash
# Build Docker image
docker build -t desyn-api:latest .

# Push to registry
docker tag desyn-api:latest your-registry/desyn-api:latest
docker push your-registry/desyn-api:latest

# Deploy (e.g., AWS ECS, DigitalOcean, etc.)
```

---

## Environment Variables

### Backend
```env
DATABASE_URL=postgres://user:password@localhost:5432/desyn
JWT_SECRET=your-secret-key-minimum-32-characters-long
JWT_EXPIRY_MINUTES=15
REFRESH_EXPIRY_DAYS=7
PORT=8080
ENV=production
ALLOWED_ORIGINS=https://desyn.app,https://web.desyn.app
```

### Frontend
```env
EXPO_PUBLIC_API_URL=https://api.desyn.app
```

---

## Known Limitations & TODOs

### Payment Processing (Stubbed)
- Creator subscriptions accept requests but don't process real payments
- Tips are logged but not charged
- Integrate Stripe/PayPal for production

### Media Storage
- Media URLs are stored but not uploaded/optimized
- Integration with S3/CDN recommended for production
- Current implementation supports external URLs only

### Notifications
- Push notifications not implemented
- WebSocket for real-time not included
- Add for production

### Moderation
- Content moderation not implemented
- Add AI-based or manual review for production

### Full-Text Search
- Basic string search only
- Add PostgreSQL FTS (full-text search) for scalability

### Rate Limiting
- Basic per-IP rate limiting only
- Add Redis-based for distributed systems

---

## Architecture Decisions

### Why Go Backend?
- Fast, compiled, minimal dependencies
- PostgreSQL integration is solid
- Easy to deploy (single binary)
- Excellent error handling

### Why Expo?
- Single codebase for web + mobile
- Rapid iteration for hackathon
- Excellent dev experience
- Works without Xcode/Android Studio for web demo

### Privacy-First Design
- Backend enforces all visibility rules (frontend not trusted)
- Visibility rules in database for flexibility
- Soft deletes for data retention compliance
- No unnecessary personal data collection

### Clean Architecture
- **Handlers:** HTTP layer (validation, serialization)
- **Services:** Business logic (privacy, rules)
- **Repositories:** Data access (queries, transactions)
- **Domain:** Pure models (no dependencies)

---

## Performance Considerations

### Database Indexes
- Posts indexed by user + creation time
- Comments indexed by post + parent
- Friendships indexed by both directions
- Full-text search indexes recommended

### Caching
- User profiles: Client-side cache (5 min TTL)
- Feed: Pagination (20 items/page)
- Communities: In-memory cache (10 min TTL)

### Pagination
- All list endpoints paginate (limit + offset)
- Default limit: 20, max: 100
- Supports cursor-based in future

---

## Project Status

✅ **Complete:**
- Backend: Full API implementation
- Frontend: All core screens (feed, profile, communities, events, creators)
- Database: Production-grade schema
- Auth: JWT + refresh tokens
- Privacy: Backend-enforced visibility

⚠️ **Stubbed (Integration Needed):**
- Payment processing (Stripe/PayPal)
- Media upload/optimization (S3/CDN)
- Email verification
- Push notifications
- Admin dashboard

---

## Support & Questions

**Documentation:**
- API Spec: [Desyn/API_spec.md](Desyn/API_spec.md)
- Backend Code: [backend/](backend/)
- Frontend Code: [Desyn/](Desyn/)

**Troubleshooting:**
- **Port 8080 in use:** `lsof -i :8080` then `kill -9 <PID>`
- **DB connection error:** Verify `DATABASE_URL` and PostgreSQL running
- **CORS errors:** Check `ALLOWED_ORIGINS` env variable
- **Module not found:** Run `npm install` or `go mod tidy`

---

**Built for hackathon: Desyn South Asian Social Platform**

Celebrating South Asian culture and community through technology. 🎭

