grammar Planta;

// =====================================================================
//  Estrutura de arquivo
// =====================================================================

file
    : useDecl* topDecl* EOF
    ;

useDecl
    : USE qualifiedName (AS name)?
    ;

topDecl
    : meta ( systemDecl
           | layerDecl
           | actorDecl
           | externalDecl
           | contextDecl
           | appDecl
           | requirementDecl
           | decisionDecl
           | deploymentDecl
           | ruleDecl
           | viewDecl
           )
    ;

// ---------------------------------------------------------------------
//  Metadados: documentação e anotações
// ---------------------------------------------------------------------

meta
    : DOC_COMMENT* annotation*
    ;

annotation
    : '#[' annotationItem (',' annotationItem)* ']'
    ;

annotationItem
    : name ('(' literalList? ')')?
    ;

// =====================================================================
//  Declarações de nível superior
// =====================================================================

systemDecl
    : SYSTEM name '{' systemItem* '}'
    ;

systemItem
    : DESCRIPTION STRING
    | OWNER STRING
    | VERSION STRING
    ;

layerDecl
    : LAYER name (MATCH STRING (',' STRING)*)?
    ;

actorDecl
    : ACTOR name STRING?
    ;

externalDecl
    : EXTERNAL name STRING? ('{' (meta opDecl)* '}')?
    ;

requirementDecl
    : REQUIREMENT name anchor STRING?
    ;

decisionDecl
    : DECISION name anchor STRING?
    ;

// =====================================================================
//  Contextos
// =====================================================================

contextDecl
    : CONTEXT name rootClause? '{' contextMember* '}'
    ;

rootClause
    : ROOT STRING
    ;

contextMember
    : meta ( entityDecl
           | valueDecl
           | dtoDecl
           | enumDecl
           | aggregateDecl
           | componentDecl
           | apiDecl
           | channelDecl
           | eventDecl
           | handlerDecl
           | jobDecl
           | processDecl
           )
    ;

// ---------------------------------------------------------------------
//  Modelo de dados
// ---------------------------------------------------------------------

entityDecl
    : ENTITY name anchor? fieldBlock?
    ;

valueDecl
    : VALUE name anchor? fieldBlock?
    ;

dtoDecl
    : DTO name anchor? fieldBlock?
    ;

fieldBlock
    : '{' fieldBlockItem* '}'
    ;

fieldBlockItem
    : meta (fieldDecl | traceClause)
    ;

fieldDecl
    : name ':' typeRef fieldModifier* anchor?
    ;

fieldModifier
    : name ('(' literalList? ')')?
    ;

enumDecl
    : ENUM name anchor? '{' name (',' name)* ','? '}'
    ;

aggregateDecl
    : AGGREGATE name ROOT qualifiedName '{' (CONTAINS qualifiedNameList)* '}'
    ;

typeRef
    : MAP '<' typeRef ',' typeRef '>' '?'?
    | qualifiedName ('[' ']')? '?'?
    ;

// ---------------------------------------------------------------------
//  Componentes e operações
// ---------------------------------------------------------------------

componentDecl
    : componentKind name anchor? layerClause? componentBody?
    ;

componentKind
    : SERVICE | CONTROLLER | REPOSITORY | GATEWAY | MIDDLEWARE
    | GUARD | COMPONENT | PAGE | STORE
    ;

layerClause
    : IN LAYER qualifiedName
    ;

componentBody
    : '{' componentItem* '}'
    ;

componentItem
    : meta ( opDecl
           | USES qualifiedNameList
           | CALLS qualifiedNameList
           | RENDERS qualifiedNameList
           | IMPLEMENTS qualifiedNameList
           | traceClause
           )
    ;

opDecl
    : OP name '(' paramList? ')' ('->' typeRef)? anchor? traceClause*
    ;

paramList
    : param (',' param)*
    ;

param
    : name ':' typeRef
    ;

// ---------------------------------------------------------------------
//  APIs
// ---------------------------------------------------------------------

apiDecl
    : API name protocol (BASE STRING)? '{' (meta endpointDecl)* '}'
    ;

protocol
    : HTTP | GRAPHQL | GRPC | WEBSOCKET
    ;

endpointDecl
    : ENDPOINT name? operationSig '=>' qualifiedName endpointBody?
    ;

operationSig
    : HTTP_METHOD STRING
    | (QUERY | MUTATION | SUBSCRIPTION | RPC | MESSAGE) STRING
    ;

endpointBody
    : '{' endpointItem* '}'
    ;

endpointItem
    : BODY typeRef
    | PARAM name ':' typeRef (IN paramLocation)?
    | RETURNS NUMBER typeRef?
    | AUTH name (ROLES '[' name (',' name)* ']')?
    | RATE_LIMIT STRING
    | traceClause
    ;

paramLocation
    : PATH | QUERY | name
    ;

// ---------------------------------------------------------------------
//  Mensageria e agendamento
// ---------------------------------------------------------------------

channelDecl
    : CHANNEL name KIND name anchor?
    ;

eventDecl
    : EVENT name (VIA qualifiedName)? anchor? fieldBlock?
    ;

handlerDecl
    : ON qualifiedName '=>' qualifiedName traceClause*
    ;

jobDecl
    : JOB name CRON STRING '=>' qualifiedName traceClause*
    ;

// ---------------------------------------------------------------------
//  Processos
// ---------------------------------------------------------------------

processDecl
    : PROCESS name processBlock
    ;

processBlock
    : '{' processItem* '}'
    ;

processItem
    : meta processStmt
    ;

processStmt
    : traceClause                                         # procTrace
    | TRIGGER qualifiedName                               # procTrigger
    | ACTOR qualifiedName                                 # procActor
    | VERIFY (CALLS | name)                               # procVerify
    | STEP name ':' stepTarget                            # procStep
    | emitStmt                                            # procEmit
    | IF STRING processBlock (ELSE (ifTail | processBlock))?  # procIf
    | PARALLEL processBlock                               # procParallel
    | FOREACH STRING processBlock                         # procForeach
    | WAIT qualifiedName (TIMEOUT STRING)?                # procWait
    | FAIL NUMBER? STRING?                                # procFail
    | RETURN typeRef?                                     # procReturn
    ;

ifTail
    : IF STRING processBlock (ELSE (ifTail | processBlock))?
    ;

stepTarget
    : emitStmt
    | qualifiedName
    | STRING
    ;

emitStmt
    : EMIT qualifiedName
    ;

// =====================================================================
//  Apps (unidades físicas)
// =====================================================================

appDecl
    : APP name KIND name (FRAMEWORK name)? rootClause? ('{' appItem* '}')?
    ;

appItem
    : meta ( CONTAINS qualifiedNameList
           | routeDecl
           | componentDecl
           )
    ;

routeDecl
    : ROUTE STRING '=>' qualifiedName (GUARD qualifiedName)?
    ;

// =====================================================================
//  Rastreabilidade
// =====================================================================

traceClause
    : (JUSTIFIED_BY | DECIDED_BY) traceRef (',' traceRef)*
    ;

traceRef
    : STRING
    | qualifiedName
    ;

// =====================================================================
//  Deployment
// =====================================================================

deploymentDecl
    : DEPLOYMENT name (PROVIDER name)? (REGION STRING)? (SOURCE name STRING)?
      '{' deployItem* '}'
    ;

deployItem
    : meta ( groupDecl
           | connection
           | nodeDecl
           )
    ;

groupDecl
    : groupKind name (':' resourceType)? anchor? '{' deployItem* '}'
    ;

groupKind
    : NETWORK | ZONE | CLUSTER | GROUP | REGION
    ;

nodeDecl
    : name ':' resourceType nodeClause* anchor? ('{' nodeProp* '}')?
    ;

resourceType
    : qualifiedName
    ;

nodeClause
    : RUNS qualifiedName
    | STORES qualifiedNameList
    | CARRIES qualifiedNameList
    | REPLICAS NUMBER
    ;

nodeProp
    : name '=' literal
    ;

connection
    : qualifiedName ('->' qualifiedName)+ STRING?
    ;

// =====================================================================
//  Regras
// =====================================================================

ruleDecl
    : RULE name (SEVERITY name)? '{' ruleStmt* '}'
    ;

ruleStmt
    : subject modality predicate exception?
    ;

subject
    : EVERY elementKind (WHERE name '=' literal)?
    | elementKind qualifiedName
    ;

modality
    : MUST NOT?
    | MAY
    ;

predicate
    : DEPEND ON subject
    | HAVE property
    | MATCH STRING
    | BE IN LAYER qualifiedName
    ;

property
    : JUSTIFIED_BY | DECIDED_BY | OWNER | anchorWord | name
    ;

anchorWord
    : ANCHOR_KW
    ;

exception
    : EXCEPT VIA elementKind
    ;

elementKind
    : ENTITY | VALUE | DTO | ENUM | AGGREGATE
    | SERVICE | CONTROLLER | REPOSITORY | GATEWAY | MIDDLEWARE | GUARD
    | COMPONENT | PAGE | STORE | OP
    | API | ENDPOINT | CHANNEL | EVENT | HANDLER_KW | JOB | PROCESS
    | CONTEXT | APP | LAYER | REQUIREMENT | DECISION | ACTOR | EXTERNAL
    ;

// =====================================================================
//  Views
// =====================================================================

viewDecl
    : VIEW name KIND viewKind (OF qualifiedName)? (STYLE name)? ('{' viewItem* '}')?
    ;

viewKind
    : name ('.' name)?
    ;

viewItem
    : TITLE STRING
    | INCLUDE viewSelector (',' viewSelector)*
    | EXCLUDE viewSelector (',' viewSelector)*
    | LAYOUT name
    ;

viewSelector
    : '*'
    | EVERY elementKind
    | qualifiedName ('.' '*')?
    ;

// =====================================================================
//  Âncoras, nomes e literais
// =====================================================================

anchor
    : '@' STRING
    ;

qualifiedName
    : name ('.' name)*
    ;

qualifiedNameList
    : qualifiedName (',' qualifiedName)*
    ;

literalList
    : literal (',' literal)*
    ;

literal
    : STRING
    | NUMBER
    | BOOL
    | name
    ;

// Palavras-chave podem ser usadas como nomes onde não há ambiguidade.
name
    : ID
    | SYSTEM | DESCRIPTION | OWNER | VERSION | LAYER | MATCH | ACTOR | EXTERNAL
    | REQUIREMENT | DECISION | CONTEXT | ROOT | ENTITY | VALUE | DTO | ENUM
    | AGGREGATE | CONTAINS | MAP | SERVICE | CONTROLLER | REPOSITORY | GATEWAY
    | MIDDLEWARE | GUARD | COMPONENT | PAGE | STORE | IN | USES | CALLS | RENDERS
    | IMPLEMENTS | OP | API | BASE | HTTP | GRAPHQL | GRPC | WEBSOCKET | ENDPOINT
    | QUERY | MUTATION | SUBSCRIPTION | RPC | MESSAGE | BODY | PARAM | RETURNS
    | AUTH | ROLES | RATE_LIMIT | PATH | CHANNEL | KIND | EVENT | VIA | ON | JOB
    | CRON | PROCESS | TRIGGER | VERIFY | STEP | IF | ELSE | PARALLEL | FOREACH
    | WAIT | TIMEOUT | FAIL | RETURN | EMIT | APP | FRAMEWORK | ROUTE | DEPLOYMENT
    | PROVIDER | REGION | SOURCE | NETWORK | ZONE | CLUSTER | GROUP | RUNS | STORES
    | CARRIES | REPLICAS | RULE | SEVERITY | EVERY | WHERE | MUST | NOT | MAY
    | DEPEND | HAVE | BE | EXCEPT | VIEW | OF | STYLE | TITLE | INCLUDE | EXCLUDE
    | LAYOUT | USE | AS | ANCHOR_KW | HANDLER_KW
    ;

// =====================================================================
//  Léxico
// =====================================================================

// Palavras-chave (devem vir antes de ID)
SYSTEM       : 'system';
DESCRIPTION  : 'description';
OWNER        : 'owner';
VERSION      : 'version';
LAYER        : 'layer';
MATCH        : 'match';
ACTOR        : 'actor';
EXTERNAL     : 'external';
REQUIREMENT  : 'requirement';
DECISION     : 'decision';
CONTEXT      : 'context';
ROOT         : 'root';
ENTITY       : 'entity';
VALUE        : 'value';
DTO          : 'dto';
ENUM         : 'enum';
AGGREGATE    : 'aggregate';
CONTAINS     : 'contains';
MAP          : 'Map';
SERVICE      : 'service';
CONTROLLER   : 'controller';
REPOSITORY   : 'repository';
GATEWAY      : 'gateway';
MIDDLEWARE   : 'middleware';
GUARD        : 'guard';
COMPONENT    : 'component';
PAGE         : 'page';
STORE        : 'store';
IN           : 'in';
USES         : 'uses';
CALLS        : 'calls';
RENDERS      : 'renders';
IMPLEMENTS   : 'implements';
OP           : 'op';
API          : 'api';
BASE         : 'base';
HTTP         : 'http';
GRAPHQL      : 'graphql';
GRPC         : 'grpc';
WEBSOCKET    : 'websocket';
ENDPOINT     : 'endpoint';
QUERY        : 'query';
MUTATION     : 'mutation';
SUBSCRIPTION : 'subscription';
RPC          : 'rpc';
MESSAGE      : 'message';
BODY         : 'body';
PARAM        : 'param';
RETURNS      : 'returns';
AUTH         : 'auth';
ROLES        : 'roles';
RATE_LIMIT   : 'rateLimit';
PATH         : 'path';
CHANNEL      : 'channel';
KIND         : 'kind';
EVENT        : 'event';
VIA          : 'via';
ON           : 'on';
JOB          : 'job';
CRON         : 'cron';
PROCESS      : 'process';
TRIGGER      : 'trigger';
VERIFY       : 'verify';
STEP         : 'step';
IF           : 'if';
ELSE         : 'else';
PARALLEL     : 'parallel';
FOREACH      : 'foreach';
WAIT         : 'wait';
TIMEOUT      : 'timeout';
FAIL         : 'fail';
RETURN       : 'return';
EMIT         : 'emit';
APP          : 'app';
FRAMEWORK    : 'framework';
ROUTE        : 'route';
JUSTIFIED_BY : 'justifiedBy';
DECIDED_BY   : 'decidedBy';
DEPLOYMENT   : 'deployment';
PROVIDER     : 'provider';
REGION       : 'region';
SOURCE       : 'source';
NETWORK      : 'network';
ZONE         : 'zone';
CLUSTER      : 'cluster';
GROUP        : 'group';
RUNS         : 'runs';
STORES       : 'stores';
CARRIES      : 'carries';
REPLICAS     : 'replicas';
RULE         : 'rule';
SEVERITY     : 'severity';
EVERY        : 'every';
WHERE        : 'where';
MUST         : 'must';
NOT          : 'not';
MAY          : 'may';
DEPEND       : 'depend';
HAVE         : 'have';
BE           : 'be';
EXCEPT       : 'except';
VIEW         : 'view';
OF           : 'of';
STYLE        : 'style';
TITLE        : 'title';
INCLUDE      : 'include';
EXCLUDE      : 'exclude';
LAYOUT       : 'layout';
USE          : 'use';
AS           : 'as';
ANCHOR_KW    : 'anchor';
HANDLER_KW   : 'handler';

HTTP_METHOD  : 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
BOOL         : 'true' | 'false';

ID           : [a-zA-Z_] [a-zA-Z0-9_]*;
NUMBER       : [0-9]+ ('.' [0-9]+)?;
STRING       : '"' ( ~["\\\r\n] | '\\' . )* '"';

// Comentário de documentação: preservado (vai para o parser)
DOC_COMMENT  : '///' ~[\r\n]*;
LINE_COMMENT : '//' ~[\r\n]* -> channel(HIDDEN);
BLOCK_COMMENT: '/*' .*? '*/' -> channel(HIDDEN);
WS           : [ \t\r\n]+ -> skip;
