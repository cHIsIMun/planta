// Catálogo de tipos de recurso de deployment (seção 6.16): rótulo e ícone para
// os diagramas e, por ferramenta de IaC, os tipos que implementam cada um e
// como as propriedades declaradas na planta se chamam lá.

const ICONS = "https://icons.terrastruct.com/";

/** Propriedade da planta no IaC: atributo do recurso, ou de outro recurso que ele referencia. */
export type PropertyMap = string | { via: string; attribute: string };

/** Ferramentas de IaC, pelo esquema de âncora: `tf:`, `cdk:`, `k8s:`, `compose:`. */
export type IacFlavor = "terraform" | "cloudformation" | "kubernetes" | "compose";

export interface IacImplementation {
  /** Tipos aceitos para a âncora (`aws_lb`, `AWS::ECS::Service`, `Deployment`, `service`). */
  types: string[];
  /** `replicas n` corresponde a este atributo. */
  replicas?: string;
  properties?: Record<string, PropertyMap>;
  /** Atributos que o recurso precisa ter (contém o texto) para ser deste tipo: `engine` contém `postgres`. */
  requires?: Record<string, string>;
}

export interface ResourceType {
  label: string;
  icon?: string;
  /** Forma no D2 quando não há ícone adequado (ou junto com ele). */
  shape?: "person" | "cylinder" | "queue" | "cloud" | "package" | "page";
  iac?: Partial<Record<IacFlavor, IacImplementation>>;
}

const aws = (path: string) => `${ICONS}aws%2F${path.replace(/&/g, "%26").replace(/ /g, "%20").replace(/,/g, "%2C").replace(/\//g, "%2F")}.svg`;

const RDS_TF = { instance: "instance_class", multiAz: "multi_az", storage: "allocated_storage" };
const RDS_CFN = { instance: "DBInstanceClass", multiAz: "MultiAZ", storage: "AllocatedStorage" };

export const RESOURCE_TYPES: Record<string, ResourceType> = {
  "actor.internet": { label: "Usuários", shape: "person" },
  "actor.user": { label: "Usuário", shape: "person" },

  "aws.cloudfront": {
    label: "CloudFront", icon: aws("Networking & Content Delivery/Amazon-CloudFront"),
    iac: { terraform: { types: ["aws_cloudfront_distribution"] }, cloudformation: { types: ["AWS::CloudFront::Distribution"] } },
  },
  "aws.s3": {
    label: "S3", icon: aws("Storage/Amazon-Simple-Storage-Service-S3"),
    iac: { terraform: { types: ["aws_s3_bucket"], properties: { bucket: "bucket" } }, cloudformation: { types: ["AWS::S3::Bucket"], properties: { bucket: "BucketName" } } },
  },
  "aws.vpc": {
    label: "VPC", icon: aws("Networking & Content Delivery/Amazon-VPC"),
    iac: { terraform: { types: ["aws_vpc"], properties: { cidr: "cidr_block" } }, cloudformation: { types: ["AWS::EC2::VPC"], properties: { cidr: "CidrBlock" } } },
  },
  "aws.subnet": {
    label: "Subnet",
    iac: { terraform: { types: ["aws_subnet"], properties: { cidr: "cidr_block" } }, cloudformation: { types: ["AWS::EC2::Subnet"], properties: { cidr: "CidrBlock" } } },
  },
  "aws.alb": {
    label: "ALB", icon: aws("Networking & Content Delivery/Elastic-Load-Balancing"),
    iac: { terraform: { types: ["aws_lb", "aws_alb"] }, cloudformation: { types: ["AWS::ElasticLoadBalancingV2::LoadBalancer"] } },
  },
  "aws.nlb": {
    label: "NLB", icon: aws("Networking & Content Delivery/Elastic-Load-Balancing"),
    iac: { terraform: { types: ["aws_lb"] }, cloudformation: { types: ["AWS::ElasticLoadBalancingV2::LoadBalancer"] } },
  },
  "aws.route53": {
    label: "Route 53", icon: aws("Networking & Content Delivery/Amazon-Route-53"),
    iac: { terraform: { types: ["aws_route53_zone"] }, cloudformation: { types: ["AWS::Route53::HostedZone"] } },
  },
  "aws.apigateway": {
    label: "API Gateway", icon: aws("Networking & Content Delivery/Amazon-API-Gateway"),
    iac: { terraform: { types: ["aws_api_gateway_rest_api", "aws_apigatewayv2_api"] }, cloudformation: { types: ["AWS::ApiGateway::RestApi", "AWS::ApiGatewayV2::Api"] } },
  },

  "aws.ecs.cluster": {
    label: "ECS", icon: aws("Compute/Amazon-Elastic-Container-Service"),
    iac: { terraform: { types: ["aws_ecs_cluster"] }, cloudformation: { types: ["AWS::ECS::Cluster"] } },
  },
  "aws.ecs.service": {
    label: "ECS service", icon: aws("Compute/AWS-Fargate"),
    iac: {
      terraform: {
        types: ["aws_ecs_service"], replicas: "desired_count",
        properties: { cpu: { via: "task_definition", attribute: "cpu" }, memory: { via: "task_definition", attribute: "memory" } },
      },
      cloudformation: {
        types: ["AWS::ECS::Service"], replicas: "DesiredCount",
        properties: { cpu: { via: "TaskDefinition", attribute: "Cpu" }, memory: { via: "TaskDefinition", attribute: "Memory" } },
      },
    },
  },
  "aws.eks.cluster": {
    label: "EKS", icon: aws("Compute/Amazon-Elastic-Kubernetes-Service"),
    iac: { terraform: { types: ["aws_eks_cluster"] }, cloudformation: { types: ["AWS::EKS::Cluster"] } },
  },
  "aws.ec2": {
    label: "EC2", icon: aws("Compute/Amazon-EC2"),
    iac: { terraform: { types: ["aws_instance"], properties: { instance: "instance_type" } }, cloudformation: { types: ["AWS::EC2::Instance"], properties: { instance: "InstanceType" } } },
  },
  "aws.lambda": {
    label: "Lambda", icon: aws("Compute/AWS-Lambda"),
    iac: {
      terraform: { types: ["aws_lambda_function"], properties: { memory: "memory_size", timeout: "timeout", runtime: "runtime" } },
      cloudformation: { types: ["AWS::Lambda::Function"], properties: { memory: "MemorySize", timeout: "Timeout", runtime: "Runtime" } },
    },
  },

  "aws.rds.postgres": {
    label: "RDS Postgres", icon: aws("Database/Amazon-RDS"), shape: "cylinder",
    iac: {
      terraform: { types: ["aws_db_instance", "aws_rds_cluster"], properties: RDS_TF, requires: { engine: "postgres" } },
      cloudformation: { types: ["AWS::RDS::DBInstance", "AWS::RDS::DBCluster"], properties: RDS_CFN, requires: { Engine: "postgres" } },
    },
  },
  "aws.rds.mysql": {
    label: "RDS MySQL", icon: aws("Database/Amazon-RDS"), shape: "cylinder",
    iac: {
      terraform: { types: ["aws_db_instance", "aws_rds_cluster"], properties: RDS_TF, requires: { engine: "mysql" } },
      cloudformation: { types: ["AWS::RDS::DBInstance", "AWS::RDS::DBCluster"], properties: RDS_CFN, requires: { Engine: "mysql" } },
    },
  },
  "aws.aurora": {
    label: "Aurora", icon: aws("Database/Amazon-Aurora"), shape: "cylinder",
    iac: { terraform: { types: ["aws_rds_cluster"] }, cloudformation: { types: ["AWS::RDS::DBCluster"] } },
  },
  "aws.dynamodb": {
    label: "DynamoDB", icon: aws("Database/Amazon-DynamoDB"), shape: "cylinder",
    iac: { terraform: { types: ["aws_dynamodb_table"] }, cloudformation: { types: ["AWS::DynamoDB::Table"] } },
  },
  "aws.elasticache.redis": {
    label: "ElastiCache Redis", icon: aws("Database/Amazon-ElastiCache"),
    iac: {
      terraform: { types: ["aws_elasticache_cluster", "aws_elasticache_replication_group"], properties: { instance: "node_type" } },
      cloudformation: { types: ["AWS::ElastiCache::CacheCluster", "AWS::ElastiCache::ReplicationGroup"], properties: { instance: "CacheNodeType" } },
    },
  },

  "aws.sqs": {
    label: "SQS", icon: aws("Application Integration/Amazon-Simple-Queue-Service-SQS"), shape: "queue",
    iac: { terraform: { types: ["aws_sqs_queue"] }, cloudformation: { types: ["AWS::SQS::Queue"] } },
  },
  "aws.sns": {
    label: "SNS", icon: aws("Application Integration/Amazon-Simple-Notification-Service-SNS"),
    iac: { terraform: { types: ["aws_sns_topic"] }, cloudformation: { types: ["AWS::SNS::Topic"] } },
  },
  "aws.eventbridge": {
    label: "EventBridge", icon: aws("Application Integration/Amazon-EventBridge"),
    iac: { terraform: { types: ["aws_cloudwatch_event_bus"] }, cloudformation: { types: ["AWS::Events::EventBus"] } },
  },
  "aws.kinesis": {
    label: "Kinesis", icon: aws("Analytics/Amazon-Kinesis-Data-Streams"),
    iac: { terraform: { types: ["aws_kinesis_stream"] }, cloudformation: { types: ["AWS::Kinesis::Stream"] } },
  },
  "aws.ses": {
    label: "SES", icon: aws("Customer Engagement/Amazon-Simple-Email-Service-SES"),
    iac: { terraform: { types: ["aws_ses_domain_identity", "aws_sesv2_email_identity"] }, cloudformation: { types: ["AWS::SES::EmailIdentity"] } },
  },
  "aws.secretsmanager": {
    label: "Secrets Manager", icon: aws("Security, Identity, & Compliance/AWS-Secrets-Manager"),
    iac: { terraform: { types: ["aws_secretsmanager_secret"] }, cloudformation: { types: ["AWS::SecretsManager::Secret"] } },
  },
  "aws.cognito": {
    label: "Cognito", icon: aws("Security, Identity, & Compliance/Amazon-Cognito"),
    iac: { terraform: { types: ["aws_cognito_user_pool"] }, cloudformation: { types: ["AWS::Cognito::UserPool"] } },
  },

  "docker.container": {
    label: "Contêiner", shape: "package",
    iac: { compose: { types: ["service"], replicas: "replicas", properties: { image: "image" } } },
  },
  "k8s.deployment": { label: "Deployment", iac: { kubernetes: { types: ["Deployment"], replicas: "replicas", properties: { image: "image" } } } },
  "k8s.statefulset": { label: "StatefulSet", shape: "cylinder", iac: { kubernetes: { types: ["StatefulSet"], replicas: "replicas", properties: { image: "image" } } } },
  "k8s.daemonset": { label: "DaemonSet", iac: { kubernetes: { types: ["DaemonSet"], properties: { image: "image" } } } },
  "k8s.service": { label: "Service", iac: { kubernetes: { types: ["Service"], properties: { type: "type" } } } },
  "k8s.ingress": { label: "Ingress", iac: { kubernetes: { types: ["Ingress"] } } },
  "k8s.cronjob": { label: "CronJob", iac: { kubernetes: { types: ["CronJob"], properties: { schedule: "schedule", image: "image" } } } },
};

/** Tipo do catálogo; `generic.*` é aceito sem descrição própria. */
export function resourceType(name: string): ResourceType | undefined {
  if (RESOURCE_TYPES[name]) return RESOURCE_TYPES[name];
  if (name.startsWith("generic.")) return { label: name.slice("generic.".length) };
  return undefined;
}

/** Tipos de cada IaC que algum tipo do catálogo descreve: os únicos cobrados pela cobertura (PL340). */
export function describedTypes(flavor: IacFlavor): Set<string> {
  return new Set(Object.values(RESOURCE_TYPES).flatMap((t) => t.iac?.[flavor]?.types ?? []));
}

/** Tipo da planta para um tipo de IaC (para `planta suggest`). */
export function plantaTypeFor(flavor: IacFlavor, iacType: string): string | undefined {
  return Object.entries(RESOURCE_TYPES).find(([, t]) => t.iac?.[flavor]?.types.includes(iacType))?.[0];
}
