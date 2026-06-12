###############################################
# Networking
#
# Read existing AWS networking resources.
# These resources already exist and are NOT
# managed by Terraform.
###############################################

# Default VPC

data "aws_vpc" "default" {
  default = true
}

###############################################
# Default subnet used by the EC2 instance
###############################################

data "aws_subnet" "app" {
  id = "subnet-04e962f56486ce319"
}

###############################################
# Existing Security Groups
###############################################

data "aws_security_group" "todo" {
  id = "sg-0780df2349ec5f75a"
}

data "aws_security_group" "launch_wizard" {
  id = "sg-0276da134caa8f60d"
}