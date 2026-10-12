# Real Estate CRM

A small CRM where a sales team manages leads and property bookings.

**Live app:** https://real-estate-crm-five-alpha.vercel.app
**API:** https://realestate-crm-dhxz.onrender.com/api/health

**Demo logins**
- Admin: `admin@crm.com` / `admin123`
- Sales: `asha@crm.com` / `sales123`

> The API runs on a free Render plan, so the first request after idle time can take 30–60 seconds.

## Tech stack
MongoDB, Express, React (Vite), Node.js, Tailwind CSS, lucide-react

## Features
- Login with Admin and Sales Employee roles
- Leads: create, edit, search, filter, view, notes, follow-up dates
- Stages: New, Contacted, Site Visit, Interested, Negotiation, Booked, Lost
- Admin assigns leads to sales employees
- Properties: projects, buildings and units with price, type and availability
- Booking flow that connects a lead to a unit, with cancel
- Dashboard: leads by stage, follow-ups due, bookings this month, inventory
- Responsive UI with loading, empty and error states

## Run locally

**Server**
```bash
cd server
cp .env    
npm install
npm run seed    
npm run dev             
```

**Client**
```bash
cd client
cp .env    
npm install
npm run dev              
```

## Database overview
| Collection | Purpose | Relations |
|---|---|---|
| User | Team members and roles | |
| Lead | Customer, stage, notes, follow-up date | assignedTo → User |
| Project | Real estate project | |
| Building | Building in a project | project → Project |
| Unit | Price, type, availability | project, building |
| Booking | Links a lead to a unit | lead, unit, bookedBy → User |

## API overview
All routes except login need the header `Authorization: Bearer <token>`.

| Route | Access |
|---|---|
| `POST /api/auth/login`, `GET /api/auth/me` | Public / any user |
| `/api/users` | Admin |
| `/api/leads` (list, create, view, edit, notes) | Admin: all leads, Sales: own leads |
| `/api/properties/projects`, `/buildings`, `/units` | Read: any user, Create: Admin |
| `/api/bookings` (list, create, cancel) | Admin: all, Sales: own |
| `GET /api/dashboard` | Any user, scoped by role |

## Key decisions
1. **No double booking.** A booking atomically changes a unit from available to booked, so only one request can win and the other gets an error. A unique database index on active bookings is a second safety net.
2. **Permissions are enforced in the API.** Sales employees only see and book their own leads. Only admins manage properties, users and lead assignment.
3. **"Booked" only comes from the booking flow.** This keeps lead stage, unit status and bookings in sync. Cancelling a booking frees the unit and moves the lead back to Negotiation.
4. **Booking stores a price snapshot,** and unit status can't be edited directly, so later price changes don't affect past bookings.
5. **Duplicate leads are blocked** by a unique phone number, and the dashboard highlights today's and overdue follow-ups, which is what a sales team checks first.

## Deployment
Database on MongoDB Atlas, API on Render, client on Vercel.

## Limitations
No reminders by email, no stage-change history, no automated tests yet.