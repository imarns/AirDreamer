# IAM Role for Lambda Function
resource "aws_iam_role" "lambda_exec_role" {
  name = "SleepCycleLambdaExecRole"  # Name of the IAM role

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Attach a Policy to the Role for Basic Lambda Execution Permissions
resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda Function
resource "aws_lambda_function" "backend_lambda" {
  function_name    = var.lambda_function_name  # Name of the Lambda function
  filename         = "lambda.zip"  # Path to your Lambda function code zip file
  handler          = "index.handler"  # The handler method in your code (e.g., index.js file with handler function)
  runtime          = "nodejs18.x"  # Runtime for Node.js
  role             = aws_iam_role.lambda_exec_role.arn
  source_code_hash = filebase64sha256("lambda.zip")  # Ensures the function is updated if the code changes

  # Add the environment variables block here
  environment {
    variables = {
      API_KEY = var.api_key  # Reference the API key variable from variables.tf
      CUSTOM_DOMAIN = var.custom_domain_name
    }
  }
}

# API Gateway to Expose the Lambda Function
resource "aws_api_gateway_rest_api" "sleepcycle_api" {
  name        = var.api_gateway_name  # Name of the API Gateway
  description = "API Gateway for Sleep Cycle Calculator Lambda function"
}

# Resource and Method for API Gateway
resource "aws_api_gateway_resource" "lambda_resource" {
  rest_api_id = aws_api_gateway_rest_api.sleepcycle_api.id
  parent_id   = aws_api_gateway_rest_api.sleepcycle_api.root_resource_id
  path_part   = "sleepcycle"  # Path part of the URL (e.g., /sleepcycle)
}

resource "aws_api_gateway_method" "lambda_method" {
  rest_api_id   = aws_api_gateway_rest_api.sleepcycle_api.id
  resource_id   = aws_api_gateway_resource.lambda_resource.id
  http_method   = "ANY"
  authorization = "NONE"
}

# Integration of API Gateway with Lambda
resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id = aws_api_gateway_rest_api.sleepcycle_api.id
  resource_id = aws_api_gateway_resource.lambda_resource.id
  http_method = aws_api_gateway_method.lambda_method.http_method
  type        = "AWS_PROXY"
  integration_http_method = "POST"
  uri         = aws_lambda_function.backend_lambda.invoke_arn
}

# Grant API Gateway Permission to Invoke Lambda
resource "aws_lambda_permission" "api_gateway_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.backend_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.sleepcycle_api.execution_arn}/*/*"
}

# Output the API Gateway URL
output "api_url" {
  value = "${aws_api_gateway_rest_api.sleepcycle_api.execution_arn}/sleepcycle"
}
