# MeatTrace Frontend - Netlify Deployment Guide

This guide will help you deploy the MeatTrace frontend to Netlify.

## Prerequisites

- A [Netlify account](https://www.netlify.com/) (free tier is sufficient)
- The MeatTrace frontend repository pushed to GitHub, GitLab, or Bitbucket
- Access to your backend API URL

## Quick Start

### 1. Connect Your Repository to Netlify

1. Log in to your [Netlify dashboard](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose your Git provider (GitHub, GitLab, or Bitbucket)
4. Authorize Netlify to access your repositories
5. Select the `meattrace_frontend` repository

### 2. Configure Build Settings

Netlify should automatically detect the build settings from `netlify.toml`, but verify:

- **Build command**: `npm run build`
- **Publish directory**: `build`
- **Node version**: 18

### 3. Set Environment Variables

Before deploying, you **must** configure the environment variable:

1. In your Netlify site dashboard, go to **Site settings** → **Environment variables**
2. Click **"Add a variable"** → **"Add a single variable"**
3. Add the following:
   - **Key**: `REACT_APP_API_BASE_URL`
   - **Value**: Your backend API URL (e.g., `https://dev.shambabora.co.tz/api/v2` or your production URL)
   - **Scopes**: Select all scopes (Production, Deploy Previews, Branch deploys)

### 4. Deploy

1. Click **"Deploy site"**
2. Netlify will build and deploy your application
3. Once complete, you'll receive a URL like `https://your-site-name.netlify.app`

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_BASE_URL` | Backend API base URL | `https://api.meattrace.com/api/v2` |

> **Note**: All environment variables in Create React App must start with `REACT_APP_` to be accessible in your code.

## Custom Domain Setup (Optional)

To use a custom domain:

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter your domain name (e.g., `app.meattrace.com`)
4. Follow the instructions to configure DNS settings with your domain provider
5. Netlify will automatically provision an SSL certificate

## Continuous Deployment

Netlify automatically deploys your site when you push to your repository:

- **Production branch** (usually `main` or `master`): Deploys to your main site URL
- **Other branches**: Creates deploy previews for testing
- **Pull requests**: Automatically creates preview deployments

## Build Status Badge (Optional)

Add a build status badge to your README:

```markdown
[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR-SITE-ID/deploy-status)](https://app.netlify.com/sites/YOUR-SITE-NAME/deploys)
```

Replace `YOUR-SITE-ID` and `YOUR-SITE-NAME` with your actual values from Netlify.

## Troubleshooting

### Build Fails

**Problem**: Build fails with errors

**Solutions**:
- Check the build logs in Netlify dashboard
- Ensure all dependencies are listed in `package.json`
- Verify Node version is set to 18 in environment variables
- Test the build locally: `npm run build`

### Blank Page After Deployment

**Problem**: Site loads but shows a blank page

**Solutions**:
- Check browser console for errors
- Verify `REACT_APP_API_BASE_URL` is set correctly in Netlify
- Ensure the API URL is accessible from the browser (CORS configured)
- Check that the API is using HTTPS (mixed content issues)

### 404 Errors on Page Refresh

**Problem**: Refreshing a page (e.g., `/users`) returns 404

**Solutions**:
- Verify `netlify.toml` is in the repository root
- Check that the redirect rule is configured correctly
- Redeploy the site after adding `netlify.toml`

### API Requests Failing

**Problem**: API requests return errors or fail

**Solutions**:
- Verify `REACT_APP_API_BASE_URL` is set correctly
- Check CORS configuration on your backend
- Ensure the backend API is accessible from the internet
- Check browser console for specific error messages

### Environment Variables Not Working

**Problem**: Environment variables are undefined in the app

**Solutions**:
- Ensure variable names start with `REACT_APP_`
- Redeploy after adding/changing environment variables
- Clear cache and redeploy: **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

## Local Testing

To test the production build locally:

```bash
# Build the production version
npm run build

# Install a static server (if not already installed)
npm install -g serve

# Serve the build folder
serve -s build

# Open http://localhost:3000 in your browser
```

## Performance Optimization

Netlify automatically provides:

- ✅ Global CDN distribution
- ✅ Automatic HTTPS
- ✅ Asset optimization
- ✅ Gzip/Brotli compression
- ✅ HTTP/2 support

## Monitoring and Analytics

Consider enabling:

1. **Netlify Analytics** (paid): Server-side analytics without JavaScript
2. **Deploy notifications**: Get notified on Slack, email, or webhooks
3. **Build hooks**: Trigger builds from external services

## Support

- [Netlify Documentation](https://docs.netlify.com/)
- [Netlify Community Forums](https://answers.netlify.com/)
- [Netlify Status](https://www.netlifystatus.com/)

## Next Steps

After successful deployment:

1. ✅ Test all functionality on the deployed site
2. ✅ Configure custom domain (if needed)
3. ✅ Set up deploy notifications
4. ✅ Monitor build times and optimize if needed
5. ✅ Consider setting up staging environment (separate branch)
