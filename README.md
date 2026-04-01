# Yapster - High-Fidelity Chat Application

**Yapster** is a real-time, high-fidelity chat application built with modern web technologies, focusing on a "scroll-free, premium glassmorphic" design and seamless user interactions.

## 🚀 Tech Stack

- **Framework**: Next.js 16 (React 19, App Router)
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Backend & Database**: Supabase (PostgreSQL, Realtime, Auth)
- **Icons**: Lucide React

## 📁 Project Structure

```text
chat-app/
├── public/                 # Static assets
├── src/
│   ├── app/                # Next.js App Router (page.tsx, layout.tsx, globals.css)
│   ├── components/         # React UI Components
│   │   ├── Auth.tsx        # Authentication Flow (Email/Mobile OTP with Glassmorphism)
│   │   ├── ChatLayout.tsx  # Main Application Shell handling multi-view routing
│   │   ├── ChatWindow.tsx  # Real-time Messaging Interface (Supabase Channels)
│   │   ├── Sidebar.tsx     # Active Chat List
│   │   └── ...             # Navigation & Contextual sidebars
│   ├── lib/                # Configuration implementations (supabase.ts)
│   ├── store/              # Zustand global state (authStore.ts, chatStore.ts)
│   └── types/              # TypeScript definitions (database.ts)
├── .env.local              # Environment variables
├── supabase.sql            # Database schema and RLS policies
└── package.json            # Project dependencies
```

## 🛠️ Setup & Installation

### 1. Prerequisites
Make sure you have Node.js installed (v18+ recommended).

### 2. Install Dependencies
```bash
# Ensure you are in the correct directory
cd "chat-app"
npm install
```

### 3. Environment Configuration
Create or modify the `.env.local` file in the `chat-app` directory with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Running the Development Server
**Important:** Make sure your terminal is navigated to the `chat-app` folder (not the outer folder) before running the command.
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 🗄️ Database Architecture (Supabase)

This app utilizes Supabase for secure data storage and real-time syncing. The SQL schema is located in `supabase.sql`. 
- **Profiles (`profiles`)**: Linked to Supabase Auth (`auth.users`). Stores user names, status (online/offline/typing), and avatars. 
  - *Trigger:* Automatically creates a profile when a new user signs up.
- **Chats (`chats`)**: Container for chat sessions, handling both `private` and `group` chats.
- **Participants (`chat_participants`)**: Join table connecting users to chats.
- **Messages (`messages`)**: Stores actual message payloads attached to a specific `chat_id`. 
  - *Realtime:* Subscribed to Postgres changes to instantly push messages to clients.

## 🔒 Security
Row Level Security (RLS) is strictly enabled across all tables to ensure users can only view and send messages in chats they actively participate in.
