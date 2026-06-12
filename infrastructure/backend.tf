terraform {
  backend "s3" {
    bucket         = "didyoudoityet-tf-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-2"
    encrypt        = true
    dynamodb_table = "didyoudoityet-tf-locks"
  }
}