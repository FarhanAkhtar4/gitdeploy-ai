import { NextResponse } from 'next/server';

// Hosting advisor data — verified free tier information
const HOSTING_PLATFORMS = {
  frontend: [
    {
      name: 'Vercel',
      description: 'Optimized for Next.js/React. Auto-deploys from GitHub.',
      freeTier: 'Unlimited personal projects, 100GB bandwidth/month, custom domains, SSL',
      autoDeploy: true,
      pricingUrl: 'https://vercel.com/pricing',
      pros: ['Zero-config Next.js support', 'Edge functions', 'Preview deployments'],
      cons: ['Build timeout 10min on free tier', 'Serverless execution only'],
    },
    {
      name: 'Netlify',
      description: 'Great for static sites and Jamstack. Auto-deploys from GitHub.',
      freeTier: '100GB bandwidth/month, 300 build minutes/month, custom domains',
      autoDeploy: true,
      pricingUrl: 'https://netlify.com/pricing',
      pros: ['Form handling', 'Split testing', 'Edge functions'],
      cons: ['Build minutes limited', 'No SSR support natively'],
    },
    {
      name: 'Cloudflare Pages',
      description: 'Fast global CDN with unlimited bandwidth on free tier.',
      freeTier: 'Unlimited bandwidth, 500 builds/month, 1M requests/month Workers',
      autoDeploy: true,
      pricingUrl: 'https://pages.cloudflare.com',
      pros: ['Unlimited bandwidth', 'Global CDN', 'Workers integration'],
      cons: ['Limited to static/JAMstack', 'Build time 20min max'],
    },
  ],
  backend: [
    {
      name: 'Railway',
      description: 'Supports Node, Python, Go, Ruby, Docker. Auto-deploys from GitHub.',
      freeTier: '$5 credit/month, unlimited projects within credit',
      autoDeploy: true,
      pricingUrl: 'https://railway.app/pricing',
      pros: ['Docker support', 'Easy env vars', 'Database add-ons'],
      cons: ['$5 credit can run out', 'No always-on free tier'],
    },
    {
      name: 'Render',
      description: 'Web services, cron jobs, background workers on free tier.',
      freeTier: '750 hours/month, 512MB RAM',
      autoDeploy: true,
      pricingUrl: 'https://render.com/pricing',
      pros: ['Cron jobs', 'Background workers', 'Docker support'],
      cons: ['⚠️ Spins down after 15min inactivity', 'Limited RAM on free tier'],
    },
    {
      name: 'Fly.io',
      description: 'Best for Dockerized apps. Global edge deployment.',
      freeTier: '3 shared-cpu VMs, 256MB RAM each, 3GB persistent storage',
      autoDeploy: false,
      pricingUrl: 'https://fly.io/docs/about/pricing',
      pros: ['Docker-native', 'Global edge', 'Persistent storage'],
      cons: ['Requires CLI setup', 'Credit card required for signup'],
    },
  ],
  database: [
    {
      name: 'Supabase',
      description: 'PostgreSQL with built-in auth, realtime, and storage.',
      freeTier: '500MB storage, 2GB bandwidth, 50,000 monthly active users',
      autoDeploy: false,
      pricingUrl: 'https://supabase.com/pricing',
      pros: ['Built-in auth', 'Realtime subscriptions', 'Storage', 'Edge functions'],
      cons: ['Project paused after 1 week inactivity', 'Limited row count on free tier'],
    },
    {
      name: 'Neon',
      description: 'Serverless PostgreSQL with auto-suspend on idle.',
      freeTier: '0.5GB storage, 1 project, 100 compute hours/month',
      autoDeploy: false,
      pricingUrl: 'https://neon.tech/pricing',
      pros: ['Serverless scaling', 'Branching', 'Auto-suspend'],
      cons: ['1 project on free tier', 'Cold starts on resume'],
    },
    {
      name: 'MongoDB Atlas',
      description: 'MongoDB with shared cluster on free tier.',
      freeTier: '512MB M0 cluster, shared cluster, 3 regions',
      autoDeploy: false,
      pricingUrl: 'https://mongodb.com/pricing',
      pros: ['NoSQL flexibility', 'Aggregation pipeline', 'Atlas Search'],
      cons: ['512MB limit', 'No dedicated resources on free tier'],
    },
  ],
  redis: [
    {
      name: 'Upstash',
      description: 'Serverless Redis with per-request pricing.',
      freeTier: '10,000 requests/day, 256MB storage',
      autoDeploy: false,
      pricingUrl: 'https://upstash.com/pricing',
      pros: ['Serverless', 'REST API', 'Kafka support'],
      cons: ['Request limit', 'Eviction policies on free tier'],
    },
  ],
  storage: [
    {
      name: 'Cloudflare R2',
      description: 'S3-compatible object storage with no egress fees.',
      freeTier: '10GB storage, 1M Class A ops/month, no egress fees',
      autoDeploy: false,
      pricingUrl: 'https://cloudflare.com/r2/pricing',
      pros: ['No egress fees', 'S3 compatible', 'Global CDN'],
      cons: ['Class B ops limited', 'Requires Cloudflare account'],
    },
  ],
};

// GET /api/hosting — Get hosting recommendations
export async function GET() {
  return NextResponse.json({
    platforms: HOSTING_PLATFORMS,
    disclaimer: '⚠️ Free tier limits listed are based on knowledge at time of training and may have changed. Always verify current limits at the official pricing URL provided before making deployment decisions.',
  });
}
