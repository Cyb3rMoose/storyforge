output "media_bucket_name" {
  description = "S3 bucket for generated media files"
  value       = aws_s3_bucket.media.bucket
}

output "media_bucket_arn" {
  description = "ARN of the media S3 bucket"
  value       = aws_s3_bucket.media.arn
}

output "frontend_bucket_name" {
  description = "S3 bucket for the React frontend"
  value       = aws_s3_bucket.frontend.bucket
}

output "cloudfront_domain" {
  description = "CloudFront URL for the frontend app"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (needed to invalidate cache after deploy)"
  value       = aws_cloudfront_distribution.frontend.id
}

output "media_bucket_policy_arn" {
  description = "ARN of the IAM policy for media bucket access"
  value       = aws_iam_policy.media_bucket_access.arn
}
