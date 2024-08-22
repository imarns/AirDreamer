# Specify the AWS provider and region
provider "aws" {
  region = var.aws_region
}

# S3 Bucket for Frontend Hosting
resource "aws_s3_bucket" "frontend_bucket" {
  bucket = var.s3_bucket_name
}

# S3 Bucket ownership controls
resource "aws_s3_bucket_ownership_controls" "frontend_ownership" {
  bucket = aws_s3_bucket.frontend_bucket.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

# S3 Bucket public access block
resource "aws_s3_bucket_public_access_block" "frontend_public_access" {
  bucket = aws_s3_bucket.frontend_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# S3 Bucket policy for public read access
resource "aws_s3_bucket_policy" "allow_public_read_access" {
  bucket = aws_s3_bucket.frontend_bucket.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend_bucket.arn}/*"
      },
    ]
  })
}

# Separate Website Configuration for the S3 Bucket
resource "aws_s3_bucket_website_configuration" "frontend_website" {
  bucket = aws_s3_bucket.frontend_bucket.bucket

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# Upload Build Files to S3 Bucket
resource "aws_s3_object" "frontend_files" {
  for_each = fileset("${path.module}/build", "**/*")

  bucket       = aws_s3_bucket.frontend_bucket.bucket
  key          = each.value
  source       = "${path.module}/build/${each.value}"
  content_type = lookup(local.mime_types, regex("\\.[^.]+$", each.value), null)
}

locals {
  mime_types = {
    ".html" = "text/html"
    ".css"  = "text/css"
    ".js"   = "application/javascript"
    ".json" = "application/json"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".txt"  = "text/plain"
  }
}

# CloudFront Distribution for the S3 Bucket
resource "aws_cloudfront_distribution" "frontend_distribution" {
  origin {
    domain_name = aws_s3_bucket.frontend_bucket.bucket_regional_domain_name
    origin_id   = "S3-${var.s3_bucket_name}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.s3_bucket_name}"
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn            = aws_acm_certificate.your_certificate.arn
    ssl_support_method             = "sni-only"
    minimum_protocol_version       = "TLSv1.2_2021"
    cloudfront_default_certificate = false
  }

  aliases = [var.custom_domain_name]
}

resource "aws_acm_certificate" "your_certificate" {
  domain_name       = var.custom_domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# Route 53 Hosted Zone (assuming it's already created)
data "aws_route53_zone" "your_zone" {
  name = var.custom_domain_name
}

resource "aws_route53_record" "www" {
  zone_id = data.aws_route53_zone.your_zone.zone_id
  name    = var.custom_domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.frontend_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

# Add DNS validation for the ACM certificate
resource "aws_route53_record" "certificate_validation" {
  for_each = {
    for dvo in aws_acm_certificate.your_certificate.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      value  = dvo.resource_record_value
    }
  }

  zone_id = data.aws_route53_zone.your_zone.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 300
  records = [each.value.value]
}

# Output the CloudFront URL for reference
output "cloudfront_url" {
  value = aws_cloudfront_distribution.frontend_distribution.domain_name
}

# Output the S3 bucket website URL (using the website configuration)
output "s3_website_url" {
  value = "http://${aws_s3_bucket_website_configuration.frontend_website.website_endpoint}"
}
