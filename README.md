# Cre8 Video Worker

Simple video processing worker for Cre8 Studio.

## Environment Variables Required

Set these in your Koyeb deployment:

- `WORKER_SECRET`: The same secret you set in Base44

## Deployment to Koyeb

1. Create a new Koyeb service
2. Connect your GitHub repository containing these files
3. Set the environment variables
4. Deploy

The service will be available at: `https://your-app-name.koyeb.app`

Use this URL as your `VIDEO_WORKER_URL` in Base44.