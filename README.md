# Family Win Tracker

A React-based gamified family management system where kids earn points for completing activities and can redeem prizes. The application supports both local storage (demo mode) and Supabase (authenticated mode) for data persistence.

## 🚀 Development Setup

### Environment Configuration

This project uses different environments for development and production:

- **Local Development**: `npm run dev` → Uses local Supabase (`.env.development`)
- **Production Testing**: `npm run dev:prod` → Uses production Supabase (`.env`)
- **Production Build**: `npm run build` → Optimized build for deployment

### Quick Start

1. **Clone and install dependencies:**
   ```bash
   git clone <YOUR_GIT_URL>
   cd family-win-tracker
   npm install
   ```

2. **Set up local Supabase:**
   ```bash
   # Install Supabase CLI if not already installed
   npm install -g @supabase/cli
   
   # Start local Supabase and restore production data
   ./clone-supabase.sh
   
   # Or manually start Supabase
   npm run supabase:start
   ```

3. **Start development:**
   ```bash
   npm run dev  # Uses local Supabase
   ```

4. **Create your local account:**
   - Navigate to http://localhost:8080
   - Sign up with a new account
   - The app will automatically create your profile and assign roles

### Supabase Management Scripts

```bash
npm run supabase:start   # Start local Supabase
npm run supabase:stop    # Stop local Supabase  
npm run supabase:status  # Check status
```

### Branch Strategy

- **`dev`** - Development branch (use `npm run dev`)
- **`main`** - Production branch  
- **`deploy`** - Deployment branch (auto-deployed to Netlify)

---

# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/eeab875f-26c8-4f93-bd7f-e1f37b380857

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/eeab875f-26c8-4f93-bd7f-e1f37b380857) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/eeab875f-26c8-4f93-bd7f-e1f37b380857) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
