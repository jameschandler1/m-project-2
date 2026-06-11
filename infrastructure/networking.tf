###############################################
# Networking
#
# Read existing AWS networking resources.
# We intentionally use the default VPC instead
# of creating a custom VPC for this project.
###############################################


# data reads existing AWS networking resources
# resource defines the actual creates new resources
data "aws_vpc" "default" {
  default = true
}

###############################################
# Default subnet used by the EC2 instance
###############################################

data "aws_subnet" "app" {
  id = "subnet-04e962f56486ce319"
}