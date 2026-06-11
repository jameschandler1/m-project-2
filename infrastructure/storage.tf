###############################################
# Storage
#
# Stores all user-uploaded media for TaskApp.
# Existing resource imported into Terraform.
###############################################

resource "aws_s3_bucket" "media" {
  bucket = "didyoudoityet-media"

  tags = {
    Name = "didyoudoityet-media"
  }
}