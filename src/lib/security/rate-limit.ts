type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function requestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "unknown";
}

export function rateLimit(key: string, maximum: number, windowMs: number) {
  const now = Date.now();
  if (buckets.size > 500) {
    for (const [bucketKey, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(bucketKey);
  }
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  current.count += 1;
  return { allowed: current.count <= maximum, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
}
