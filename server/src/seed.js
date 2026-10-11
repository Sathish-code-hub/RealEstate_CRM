import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import Lead from './models/Lead.js';
import Project from './models/Project.js';
import Building from './models/Building.js';
import Unit from './models/Unit.js';
import Booking from './models/Booking.js';
import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

await mongoose.connect(process.env.MONGO_URI);
await Promise.all([User, Lead, Project, Building, Unit, Booking].map((m) => m.deleteMany({})));

const admin = await User.create({ name: 'Admin User', email: 'admin@crm.com', password: 'admin123', role: 'admin' });
const asha = await User.create({ name: 'Asha Rao', email: 'asha@crm.com', password: 'sales123', role: 'sales' });
const ravi = await User.create({ name: 'Ravi Kumar', email: 'ravi@crm.com', password: 'sales123', role: 'sales' });

const project = await Project.create({ name: 'Green Valley', location: 'OMR, Chennai', description: 'Gated community' });
const tower = await Building.create({ project: project._id, name: 'Tower A', floors: 10 });
const types = ['2BHK', '3BHK'];
for (let floor = 1; floor <= 4; floor++) {
  for (let n = 1; n <= 3; n++) {
    await Unit.create({
      project: project._id,
      building: tower._id,
      unitNumber: `A-${floor}0${n}`,
      type: types[n % 2],
      floor,
      areaSqft: 950 + n * 150,
      price: 6500000 + floor * 150000 + n * 400000,
    });
  }
}

const day = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d;
};
await Lead.create([
  { name: 'Priya Nair', phone: '9876500001', source: 'Website', stage: 'New', assignedTo: asha._id, followUpDate: day(0), createdBy: admin._id },
  { name: 'Karthik S', phone: '9876500002', source: 'Referral', stage: 'Site Visit', budget: 8000000, assignedTo: asha._id, followUpDate: day(-2), createdBy: admin._id },
  { name: 'Meera Joshi', phone: '9876500003', source: 'Walk-in', stage: 'Negotiation', budget: 9500000, assignedTo: ravi._id, followUpDate: day(1), createdBy: admin._id },
  { name: 'Arun Das', phone: '9876500004', source: 'Social Media', stage: 'Contacted', assignedTo: ravi._id, followUpDate: day(0), createdBy: admin._id },
]);

console.log('Seeded. Logins: admin@crm.com / admin123, asha@crm.com / sales123');
await mongoose.disconnect();
