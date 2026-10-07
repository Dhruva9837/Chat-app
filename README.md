# Nexora - High-Fidelity Real-Time Chat Application

<div align="center">

![Nexora Banner](https://img.shields.io/badge/Nexora-Chat%20App-6366f1?style=for-the-badge&logo=react&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Realtime%20%26%20Auth-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)

**Nexora** is a high-fidelity, real-time messaging platform crafted with a scroll-free, glassmorphic aesthetic, event-driven Supabase architecture, and sub-100ms real-time state synchronization.

[Features](#-key-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-setup--installation) • [Architecture](#-database-architecture) • [Security](#-security)

</div>

---

## ✨ Key Features

- 💬 **Real-Time Messaging**: Instant 1-on-1 and Group chats powered by Supabase Realtime channels.
- 🎨 **Glassmorphic UI**: Ultra-clean, scroll-free interface with smooth animations via Framer Motion.
- 🔐 **Authentication**: Secure email authentication and OTP flows via Supabase Auth.
- 🟢 **Live Presence & Status**: Online/offline indicators and real-time typing indicators.
- 👥 **Group Management**: Create group conversations, manage participants, and view member profiles.
- ⚡ **Optimized Performance**: Parallel data fetching and state management using Zustand and Redis caching.
- 📁 **Media & File Sharing**: Built-in support for sharing images and attachments.
- 😃 **Interactive Elements**: Native emoji picker integration and message reaction support.

---

## 🚀 Tech Stack

- **Framework**: Next.js 16 (React 19, App Router)
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Database & Realtime**: Supabase (PostgreSQL, Realtime Engine, Storage, Auth)
- **Caching**: Upstash Redis
- **Icons**: Lucide React
- **Language**: TypeScript

---

## 📁 Project Structure

```text
chat-app/
├── public/                 # Static assets and icons
├── src/
│   ├── app/                # Next.js App Router (page.tsx, layout.tsx, globals.css)
│   ├── components/         # React UI Components
│   │   ├── Auth.tsx        # Authentication & Signup Flow
│   │   ├── ChatLayout.tsx  # Main Application Shell
│   │   ├── ChatWindow.tsx  # Real-time Messaging Interface
│   │   ├── Sidebar.tsx     # Active Chat & Conversation List
│   │   └── ...             # Modals, Profile, Settings, & Media handlers
│   ├── lib/                # Client utilities & Supabase configuration
│   ├── store/              # Zustand global state (authStore.ts, chatStore.ts)
│   └── types/              # TypeScript definitions & Supabase DB types
├── .env.local              # Environment configuration
├── supabase.sql            # PostgreSQL schema, RLS policies, & triggers
└── package.json            # Project dependencies & scripts
```

---

## 🛠️ Setup & Installation

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** / **yarn** / **pnpm**
- A **Supabase** account ([supabase.com](https://supabase.com))

### 2. Clone the Repository
```bash
git clone https://github.com/Dhruva9837/Chat-app.git
cd Chat-app/chat-app
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env.local` file inside the `chat-app` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Upstash Redis (for enhanced caching)
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
```

### 5. Setup the Database
1. Go to your **Supabase Dashboard** -> **SQL Editor**.
2. Open the [supabase.sql](file:///d:/chat%20App/chat-app/supabase.sql) file from this repository.
3. Paste and run the query to create all tables (`profiles`, `chats`, `messages`, `chat_participants`), security policies (RLS), and database triggers.

### 6. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start using **Nexora**.

---

## 🗄️ Database Architecture

Nexora utilizes Supabase PostgreSQL with strict Row Level Security (RLS):

- **Profiles (`profiles`)**: Linked to Supabase Auth (`auth.users`). Manages user display names, avatars, and status.
- **Chats (`chats`)**: Handles both 1-on-1 `private` chats and multi-user `group` conversations.
- **Participants (`chat_participants`)**: Join table connecting users to chats.
- **Messages (`messages`)**: Stores message content, attachments, timestamps, and read receipts. Subscribed via Supabase Realtime broadcast channels.

---

## 🔒 Security

- **Row Level Security (RLS)** is strictly enforced across all database tables.
- Users can only query and mutate chats, messages, and profiles that they are explicitly authorized to access.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
