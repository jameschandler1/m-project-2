
###############################################
# Outputs
###############################################


output "default_vpc_id" {
  description = "Default VPC ID"
  value       = data.aws_vpc.default.id
}

###############################################
# Application subnet
###############################################

output "app_subnet_id" {
  description = "Application subnet ID"
  value       = data.aws_subnet.app.id
}