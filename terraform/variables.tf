variable "aws_region" {
  description = "The AWS region to deploy the resources in"
  type        = string
  default     = "us-east-1"  # You can change this to your preferred region
}

variable "lambda_function_name" {
  description = "The name of the Lambda function"
  type        = string
  default     = "SleepCycleCalculatorBackend"
}

variable "s3_bucket_name" {
  description = "The name of the S3 bucket for the frontend"
  type        = string
  default     = "sleepcycle-calculator-bucket"
}

variable "api_gateway_name" {
  description = "The name of the API Gateway"
  type        = string
  default     = "SleepCycleCalculatorAPI"
}

# Define the variable for the API key
variable "api_key" {
  description = "API key for accessing the AviationStack API"
  type        = string
}
variable "custom_domain_name" {
  description = "The custom domain name to use for CloudFront (e.g., yourdomain.com)"
  type        = string
}
