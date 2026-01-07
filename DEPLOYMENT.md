# Vercel Deployment Guide

## Prerequisites
- Node.js 18+ installed
- Vercel account (free tier works)
- Git repository (GitHub, GitLab, or Bitbucket)

## Quick Deploy

### Option 1: Deploy via Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will auto-detect Vite configuration
5. Click "Deploy"

### Option 2: Deploy via Vercel CLI
```bash
# Install Vercel CLI globally
npm i -g vercel

# Navigate to project directory
cd careconnect-flow

# Deploy
vercel

# For production deployment
vercel --prod
```

## Configuration Files

### vercel.json
- **Framework**: Auto-detected as Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **SPA Routing**: All routes redirect to `index.html` for React Router

### Build Settings
- **Node Version**: 18.x (default)
- **Install Command**: `npm install`
- **Build Command**: `npm run build`

## Environment Variables
Currently, no environment variables are required. The app uses IndexedDB for client-side storage.

If you need to add environment variables later:
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add variables (e.g., `VITE_API_URL`, `VITE_APP_NAME`)
3. Redeploy

## Post-Deployment Checklist

### ✅ Verify Deployment
- [ ] App loads without errors
- [ ] Login page is accessible
- [ ] All routes work (no 404 errors)
- [ ] IndexedDB storage works (data persists)
- [ ] Responsive design works on mobile
- [ ] All dashboards load correctly

### ✅ Test Key Features
- [ ] User login/logout
- [ ] Case creation and viewing
- [ ] Document uploads
- [ ] Status changes
- [ ] Payment records
- [ ] Notifications

### ✅ Performance
- [ ] Page load time < 3 seconds
- [ ] No console errors
- [ ] Images/assets load correctly

## Troubleshooting

### Issue: 404 errors on routes
**Solution**: Ensure `vercel.json` has the rewrite rule for SPA routing.

### Issue: Build fails
**Solution**: 
- Check Node.js version (should be 18+)
- Run `npm install` locally to verify dependencies
- Check build logs in Vercel dashboard

### Issue: IndexedDB not working
**Solution**: 
- IndexedDB requires HTTPS in production (Vercel provides this automatically)
- Check browser console for errors
- Ensure browser supports IndexedDB

### Issue: Assets not loading
**Solution**: 
- Check that `public` folder files are included
- Verify asset paths use relative URLs
- Check browser network tab for 404s

## Custom Domain Setup
1. Go to Vercel Dashboard → Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Wait for SSL certificate (automatic)

## Monitoring
- **Analytics**: Enable Vercel Analytics in project settings
- **Logs**: View real-time logs in Vercel Dashboard
- **Deployments**: All deployments are versioned and can be rolled back

## Notes
- **IndexedDB**: Data is stored client-side in the browser. Each user's data is isolated.
- **No Backend**: This is a fully client-side application. No server-side API needed.
- **Seed Data**: Initializes automatically on first load for each user.

## Support
For Vercel-specific issues, check:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)


