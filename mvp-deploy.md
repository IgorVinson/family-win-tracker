# Netlify Deployment Plan for Family Win Tracker

## Current Project Analysis
 **Project Type**: React 18 + TypeScript + Vite SPA with PWA support  
 **Build Setup**: Standard Vite build pipeline (`npm run build` ’ `dist/`)  
 **Dependencies**: All production-ready (Supabase, React Query, shadcn/ui)  
 **PWA Ready**: Manifest.json and theme configuration already in place  

## Security Issue Identified 
=¨ **Critical**: Supabase credentials are hardcoded in `/src/integrations/supabase/client.ts:5-7`
- URL: `https://yumggrvvocysymblrbpa.supabase.co` 
- Publishable key exposed in source code

## Deployment Steps

### 1. **Security Fix** - Move Supabase config to environment variables
- Create `.env` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Update `client.ts` to use `import.meta.env.VITE_*` variables
- Add `.env` to `.gitignore`

### 2. **SPA Routing Setup** - Add Netlify redirects configuration
- Create `public/_redirects` file with: `/* /index.html 200`
- This enables client-side routing for React Router

### 3. **Build Configuration** - Optimize Vite config for production
- Remove development-only plugins (`componentTagger`, `basicSsl`)
- Add `@netlify/vite-plugin` for enhanced Netlify integration
- Update build settings for production optimization

### 4. **Netlify Deployment**
- Connect Git repository to Netlify
- Configure build settings: Build command: `npm run build`, Publish directory: `dist`
- Set environment variables in Netlify dashboard
- Deploy and test

### 5. **Post-Deployment Verification**
- Test authentication flow with Supabase
- Verify PWA functionality 
- Test SPA routing on different URLs
- Check responsive design and performance

## Files to Create/Modify
- **Create**: `.env`, `public/_redirects`, update `.gitignore`
- **Modify**: `src/integrations/supabase/client.ts`, `vite.config.ts`, `package.json`

## Environment Variables for Netlify
```
VITE_SUPABASE_URL=https://yumggrvvocysymblrbpa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1bWdncnZ2b2N5c3ltYmxyYnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMzA0NTEsImV4cCI6MjA3MDcwNjQ1MX0.I4FZON2B0F26bJGFSO0wb_PD3nnvRprD7xwMoso9GIU
```

This plan ensures secure deployment with proper environment variable management and optimal Netlify configuration for your SPA.