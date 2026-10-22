terraform {
  required_providers {
    aws = { source = "hashicorp/aws" }
  }
}

provider "aws" {
  region = "sa-east-1"
}

module "vpc" {
  source = "../../modules/vpc"
  cidr   = "10.0.0.0/16"
}

resource "aws_s3_bucket" "web" {
  bucket = "loja-web"
}

resource "aws_cloudfront_distribution" "web" {
  enabled = true

  origin {
    domain_name = aws_s3_bucket.web.bucket_regional_domain_name
    origin_id   = "web"
  }
}

resource "aws_lb" "api" {
  name               = "loja-api"
  load_balancer_type = "application"
  subnets            = [module.vpc.vpc_id]
}

resource "aws_ecs_cluster" "main" {
  name = "loja"
}

resource "aws_iam_role" "tarefas" {
  name = "loja-tarefas"
}

resource "aws_ecs_task_definition" "api" {
  family             = "api"
  cpu                = 1024
  memory             = 2048
  execution_role_arn = aws_iam_role.tarefas.arn
}

resource "aws_ecs_task_definition" "worker" {
  family = "worker"
  cpu    = 512
  memory = 1024
}

resource "aws_ecs_service" "api" {
  name            = "api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 3
}

resource "aws_ecs_service" "worker" {
  name            = "worker"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.worker.arn
  desired_count   = 2
}

resource "aws_db_instance" "main" {
  engine         = "postgres"
  instance_class = "db.r6g.large"
  multi_az       = true
}

resource "aws_sqs_queue" "eventos" {
  name = "loja-eventos"
}
