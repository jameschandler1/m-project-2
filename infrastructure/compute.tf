###############################################
# Compute
#
# Main EC2 instance hosting the TaskApp.
#
# Services:
# - Ubuntu LTS
# - Node/Express backend
# - PM2 process manager
#
# Future improvements:
# - Nginx
# - Static frontend build
###############################################

resource "aws_instance" "app" {
  ami           = "ami-07062e2a343acc423"
  instance_type = "t3.micro"

  subnet_id = data.aws_subnet.app.id

  key_name = "todo"

  iam_instance_profile = "didyoudoityetEC2S3Role"

  vpc_security_group_ids = [
    data.aws_security_group.launch_wizard.id
  ]

  tags = {
    Name    = "didyoudoityet"
    Purpose = "Application Server"
  }
}