# Real Estate CRM (MERN)

Lead management, property inventory and a booking flow for a real estate sales team.

**Stack:** MongoDB + Mongoose · Express · React (Vite) · Node · Tailwind CSS · lucide-react

## Setup

```bash
# 1. API
cd server
cp .env     
npm install
npm run seed            
npm run dev               

# 2. Client (new terminal)
cd client
cp .env.        
npm install
npm run dev                
```

Demo logins: `admin@crm.com / admin123` (Admin) · `asha@crm.com / sales123` (Sales)

## Deployment
- Database: MongoDB Atlas (free tier)
- API: Render / Railway. Env vars: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (the client URL)
- Client: Vercel / Netlify. Env var: `VITE_API_URL` (the API URL + `/api`). Add an SPA rewrite to `index.html`.

Live URL: _add here_

## Database overview
| Collection | Key fields | Relations |
|---|---|---|
| User | name, email, password (hashed), role (admin/sales), active | |
| Lead | name, phone (unique), email, source, budget, stage, followUpDate, notes[] | assignedTo → User, createdBy → User |
| Project | name, location | |
| Building | name, floors | project → Project |
| Unit | unitNumber, type, floor, areaSqft, price, status | project, building |
| Booking | price (snapshot), tokenAmount, status (active/cancelled) | lead, unit, bookedBy → User |

Indexes that enforce rules: unique `Lead.phone`, unique `(building, unitNumber)`, and a **partial unique index on `Booking.unit` where `status = active`**.

## API overview (all routes except login need `Authorization: Bearer <token>`)
| Method | Route | Access |
|---|---|---|
| POST | `/api/auth/login` · GET `/api/auth/me` | public / any |
| GET/POST/PATCH | `/api/users` | admin |
| GET | `/api/leads?search&stage&followUp&assignedTo&page` | admin: all, sales: own |
| POST | `/api/leads` | any |
| GET/PATCH | `/api/leads/:id` | admin / owner |
| POST | `/api/leads/:id/notes` | admin / owner |
| GET | `/api/properties/projects` · `/buildings` · `/units` | any |
| POST | `/api/properties/projects` · `/buildings` · `/units` · PATCH `/units/:id` | admin |
| GET | `/api/bookings` | admin: all, sales: own |
| POST | `/api/bookings` | admin / lead owner |
| PATCH | `/api/bookings/:id/cancel` | admin / booking owner |
| GET | `/api/dashboard` | any (scoped by role) |

## Key decisions
1. **Double booking is prevented at two levels.** Booking first runs an atomic `findOneAndUpdate({status:'available'} → 'booked')`. Only one concurrent request can win; the loser gets a `409`. A partial unique index on active bookings is the database-level safety net, and a failed booking rolls the unit back. The UI refreshes the unit list on a 409. (On Atlas replica sets this could also use transactions.)
2. **Sales employees only see their own leads/bookings; the API enforces it, not just the UI.** Admins see everything and are the only ones who can reassign leads or manage properties and users. Sales-created leads are auto-assigned to them.
3. **"Booked" can only be set through the booking flow.** Manually setting it is rejected, and a booked lead can't change stage until the booking is cancelled. Cancelling frees the unit and moves the lead back to Negotiation. This keeps lead stage, unit status and bookings consistent.
4. **Unit status is never editable directly** and the booking stores a **price snapshot**, so later price edits don't change past bookings.
5. **Duplicate leads are blocked** (unique normalised phone number) and follow-ups drive the dashboard (today / overdue), because that is what a sales team checks first every morning.

## Known limitations / next steps
Follow-up "today" uses server time zone; no email/WhatsApp reminders; no audit log of stage changes; no automated tests yet.
