variable "aws_region" {
  description = "Primary AWS deployment region"
  type        = string
  default     = "eu-west-2"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod"
  }
}

variable "project_name" {
  description = "Project name used as a prefix for all resources"
  type        = string
  default     = "storyforge"
}

variable "media_bucket_name" {
  description = "Name of the S3 bucket for generated media (images, audio, video)"
  type        = string
  default     = "storyforge-media"
}

variable "frontend_bucket_name" {
  description = "Name of the S3 bucket for hosting the React app"
  type        = string
  default     = "storyforge-frontend"
}

variable "media_retention_days" {
  description = "Days before auto-deleting temporary job files from the media bucket"
  type        = number
  default     = 7
}

variable "iam_dev_user_name" {
  description = "Name of the existing IAM user used for local development"
  type        = string
  default     = "storyforge-dev"
}
