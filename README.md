# 🪙 FinMate — Premium Student Personal Finance Tracker

**FinMate** is a high-fidelity, feature-rich, and premium personal finance tracking application designed for college students to monitor allowances, manage monthly budgets, and analyze spending habits. Built entirely with **$0 cost** utilizing modern open-source web technologies and free-tier infrastructure.

FinMate is fully installable as a **Progressive Web App (PWA)**, supporting responsive layouts, offline caching, and native-feeling mobile app behavior.

---

## ✨ Features

### 1. 🔐 Glassmorphic Authentication & Security
* Secure user registration, login, and password recovery via **Supabase Auth**.
* Enforced **Row-Level Security (RLS)** in PostgreSQL to guarantee that only you can view or modify your financial logs.

### 2. 💸 Smart Transaction Logger & CRUD
* Log incomes (allowances, stipends, scholarships) and expenses.
* Type-ahead search, category filtration, payment method selection, and sorting.
* **5-Second "Undo" Action:** Delete operations are held locally for 5 seconds inside a toast dialog, allowing you to instantly cancel an accidental delete.

### 3. 📊 Interactive Analytics Engine
* **Expense Distribution:** A responsive Pie Chart breaking down your expenses by categories.
* **Spending Velocity:** An Area Chart plotting your cumulative daily spending over the last 15 days to visualize trends.
* **Income vs. Expense:** A monthly comparison Bar Chart tracking your savings margins.
* Integrated theme-aware tooltips that scale cleanly between light and dark modes.

### 4. 📈 Budgeting & Allowance Tracker
* Establish a monthly global stipend ceiling.
* Set custom category budget caps (e.g., Food, Transit, Entertainment).
* Real-time progress bars indicating percent usage with over-budget alerts (triggering warning states above 75% and critical alerts above 90%).

### 5. ⚡ UPI / SMS Copy-Paste Parser
* Fast-logging helper for Indian UPI users.
* Simply copy the SMS/UPI debit text notification from your phone, paste it into the Dashboard parser, and watch it automatically extract the amount, merchant, and transaction type to log it in under 1 second.

### 6. 📅 Custom Reports & CSV Exports
* Group financial activities in weekly, monthly, or yearly ranges.
* Review savings rates and summaries.
* **Export to CSV:** Download spreadsheet-compatible logs client-side at the click of a button.

### 7. 🌗 Dynamic Light / Dark Mode
* Fully responsive layout using **Tailwind CSS v4** and HSL colors.
* Persisted settings that sync with your browser's local storage and dynamically adjust glassmorphic properties.

---

## 🛠️ Tech Stack

* **Frontend Framework:** React 19 + TypeScript + Vite 8
* **Styling:** Tailwind CSS v4 (PostCSS pipeline) + Lucide Icons
* **Database & Auth:** Supabase (PostgreSQL with RLS & composite triggers)
* **Visualization:** Recharts
* **PWA Engine:** `vite-plugin-pwa` + Workbox caching

---

## 🚀 Getting Started

Follow these steps to configure your local clone of FinMate:

### 1. Setup Your Database (Supabase)
1. Register a free account on [Supabase](https://supabase.com).
2. Create a new project.
3. Open the **SQL Editor** in the Supabase Dashboard.
4. Copy the SQL statements from [`supabase/schema.sql`](file:///D:/FinMate/supabase/schema.sql) and execute them. This will initialize:
   * The `profiles` table (synced automatically upon auth signups via trigger).
   * The `transactions` table with full category types.
   * The `budgets` table with composite unique keys.
   * All Row-Level Security policies.

### 2. Configure Environment Variables
1. Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anonymous-key
   ```

### 3. Install Dependencies & Run
Open your terminal in the project directory and run:

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Check for TypeScript errors
npm run build
```

---

## 📱 Progressive Web App (PWA)
To install the application as a native app on your home screen:
1. Open the hosted or local app in Chrome (Android/Desktop) or Safari (iOS).
2. Click the browser menu / share button and select **"Add to Home Screen"** or click the installation icon in the URL bar.
3. The app is precached and runs offline, providing a fallback display if you lose connection.
