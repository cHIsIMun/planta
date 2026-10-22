variable "cidr" {
  type = string
}

resource "aws_vpc" "this" {
  cidr_block = var.cidr
}

resource "aws_subnet" "publica" {
  vpc_id     = aws_vpc.this.id
  cidr_block = cidrsubnet(var.cidr, 8, 0)
}

resource "aws_subnet" "privada" {
  vpc_id     = aws_vpc.this.id
  cidr_block = cidrsubnet(var.cidr, 8, 1)
}

output "vpc_id" {
  value = aws_vpc.this.id
}
