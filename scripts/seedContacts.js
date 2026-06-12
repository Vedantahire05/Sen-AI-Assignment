require("dotenv").config({ path: "../backend/.env" });
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/senai-crm";

const ContactSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  name: String,
  company: String,
  status: { type: String, enum: ["VIP", "Blocked", "Active", "Churned"], default: "Active" },
  accountValue: { type: Number, default: 0 },
  churnRiskScore: { type: Number, default: 0 },
  openTickets: { type: Number, default: 0 },
  subscriptionTier: { type: String, default: "Standard" },
  overdueInvoices: { type: Number, default: 0 },
  lastContactAt: { type: Date, default: Date.now },
}, { timestamps: true });

const Contact = mongoose.models.Contact || mongoose.model("Contact", ContactSchema);

const CONTACTS = [
  { email: "bob.jones@enterprise.net", name: "Bob Jones", company: "Enterprise Corp", status: "VIP", accountValue: 50000, churnRiskScore: 0.72, openTickets: 4, subscriptionTier: "Enterprise", overdueInvoices: 0 },
  { email: "eleanor.vance@healthsys.com", name: "Eleanor Vance", company: "HealthSys Inc", status: "VIP", accountValue: 84000, churnRiskScore: 0.18, openTickets: 1, subscriptionTier: "Enterprise", overdueInvoices: 0 },
  { email: "procurement@bigcorp.com", name: "BigCorp Procurement", company: "BigCorp International", status: "VIP", accountValue: 240000, churnRiskScore: 0.22, openTickets: 2, subscriptionTier: "Enterprise", overdueInvoices: 0 },
  { email: "karen.w@retail-co.com", name: "Karen Wilson", company: "RetailCo", status: "Active", accountValue: 12000, churnRiskScore: 0.88, openTickets: 3, subscriptionTier: "Professional", overdueInvoices: 1 },
  { email: "nadia.kowalski@devstudio.io", name: "Nadia Kowalski", company: "DevStudio IO", status: "Active", accountValue: 8400, churnRiskScore: 0.61, openTickets: 2, subscriptionTier: "Professional", overdueInvoices: 0 },
  { email: "alice.smith@greenlight-npo.org", name: "Alice Smith", company: "Greenlight NPO", status: "Active", accountValue: 4950, churnRiskScore: 0.12, openTickets: 0, subscriptionTier: "Professional", overdueInvoices: 0 },
  { email: "marcus.del@fintech-startup.co", name: "Marcus Delacroix", company: "FinTech Startup Co", status: "Active", accountValue: 19200, churnRiskScore: 0.35, openTickets: 1, subscriptionTier: "Enterprise", overdueInvoices: 0 },
  { email: "charlie.nguyen@devteam.co", name: "Charlie Nguyen", company: "DevTeam Co", status: "Active", accountValue: 3564, churnRiskScore: 0.2, openTickets: 1, subscriptionTier: "Professional", overdueInvoices: 0 },
  { email: "sarah.chen@productco.com", name: "Sarah Chen", company: "ProductCo", status: "Active", accountValue: 2988, churnRiskScore: 0.08, openTickets: 0, subscriptionTier: "Professional", overdueInvoices: 0 },
  { email: "david.park@webapp.io", name: "David Park", company: "WebApp IO", status: "Active", accountValue: 1548, churnRiskScore: 0.15, openTickets: 1, subscriptionTier: "Starter", overdueInvoices: 0 },
  { email: "liam.foster@oldclient.com", name: "Liam Foster", company: "OldClient Ltd", status: "Churned", accountValue: 0, churnRiskScore: 1.0, openTickets: 0, subscriptionTier: "Starter", overdueInvoices: 2 },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected:", MONGO_URI);
  for (const c of CONTACTS) {
    await Contact.findOneAndUpdate({ email: c.email }, { $set: c }, { upsert: true });
    console.log(`  → ${c.email} (${c.subscriptionTier}, $${c.accountValue.toLocaleString()}, churn: ${Math.round(c.churnRiskScore * 100)}%)`);
  }
  console.log("\n✅ Done");
  await mongoose.disconnect();
}

seed().catch(e => { console.error("❌", e.message); process.exit(1); });