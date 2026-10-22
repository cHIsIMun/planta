
import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";

import { PlantaListener } from "./PlantaListener.js";
import { PlantaVisitor } from "./PlantaVisitor.js";

// for running tests with parameters, TODO: discuss strategy for typed parameters in CI
// eslint-disable-next-line no-unused-vars
type int = number;


export class PlantaParser extends antlr.Parser {
    public static readonly T__0 = 1;
    public static readonly T__1 = 2;
    public static readonly T__2 = 3;
    public static readonly T__3 = 4;
    public static readonly T__4 = 5;
    public static readonly T__5 = 6;
    public static readonly T__6 = 7;
    public static readonly T__7 = 8;
    public static readonly T__8 = 9;
    public static readonly T__9 = 10;
    public static readonly T__10 = 11;
    public static readonly T__11 = 12;
    public static readonly T__12 = 13;
    public static readonly T__13 = 14;
    public static readonly T__14 = 15;
    public static readonly T__15 = 16;
    public static readonly T__16 = 17;
    public static readonly T__17 = 18;
    public static readonly SYSTEM = 19;
    public static readonly DESCRIPTION = 20;
    public static readonly OWNER = 21;
    public static readonly VERSION = 22;
    public static readonly LAYER = 23;
    public static readonly MATCH = 24;
    public static readonly ACTOR = 25;
    public static readonly EXTERNAL = 26;
    public static readonly REQUIREMENT = 27;
    public static readonly DECISION = 28;
    public static readonly CONTEXT = 29;
    public static readonly ROOT = 30;
    public static readonly ENTITY = 31;
    public static readonly VALUE = 32;
    public static readonly DTO = 33;
    public static readonly ENUM = 34;
    public static readonly AGGREGATE = 35;
    public static readonly CONTAINS = 36;
    public static readonly MAP = 37;
    public static readonly SERVICE = 38;
    public static readonly CONTROLLER = 39;
    public static readonly REPOSITORY = 40;
    public static readonly GATEWAY = 41;
    public static readonly MIDDLEWARE = 42;
    public static readonly GUARD = 43;
    public static readonly COMPONENT = 44;
    public static readonly PAGE = 45;
    public static readonly STORE = 46;
    public static readonly IN = 47;
    public static readonly USES = 48;
    public static readonly CALLS = 49;
    public static readonly RENDERS = 50;
    public static readonly IMPLEMENTS = 51;
    public static readonly OP = 52;
    public static readonly API = 53;
    public static readonly BASE = 54;
    public static readonly HTTP = 55;
    public static readonly GRAPHQL = 56;
    public static readonly GRPC = 57;
    public static readonly WEBSOCKET = 58;
    public static readonly ENDPOINT = 59;
    public static readonly QUERY = 60;
    public static readonly MUTATION = 61;
    public static readonly SUBSCRIPTION = 62;
    public static readonly RPC = 63;
    public static readonly MESSAGE = 64;
    public static readonly BODY = 65;
    public static readonly PARAM = 66;
    public static readonly RETURNS = 67;
    public static readonly AUTH = 68;
    public static readonly ROLES = 69;
    public static readonly RATE_LIMIT = 70;
    public static readonly PATH = 71;
    public static readonly CHANNEL = 72;
    public static readonly KIND = 73;
    public static readonly EVENT = 74;
    public static readonly VIA = 75;
    public static readonly ON = 76;
    public static readonly JOB = 77;
    public static readonly CRON = 78;
    public static readonly PROCESS = 79;
    public static readonly TRIGGER = 80;
    public static readonly VERIFY = 81;
    public static readonly STEP = 82;
    public static readonly IF = 83;
    public static readonly ELSE = 84;
    public static readonly PARALLEL = 85;
    public static readonly FOREACH = 86;
    public static readonly WAIT = 87;
    public static readonly TIMEOUT = 88;
    public static readonly FAIL = 89;
    public static readonly RETURN = 90;
    public static readonly EMIT = 91;
    public static readonly APP = 92;
    public static readonly FRAMEWORK = 93;
    public static readonly ROUTE = 94;
    public static readonly JUSTIFIED_BY = 95;
    public static readonly DECIDED_BY = 96;
    public static readonly DEPLOYMENT = 97;
    public static readonly PROVIDER = 98;
    public static readonly REGION = 99;
    public static readonly SOURCE = 100;
    public static readonly NETWORK = 101;
    public static readonly ZONE = 102;
    public static readonly CLUSTER = 103;
    public static readonly GROUP = 104;
    public static readonly RUNS = 105;
    public static readonly STORES = 106;
    public static readonly CARRIES = 107;
    public static readonly REPLICAS = 108;
    public static readonly RULE = 109;
    public static readonly SEVERITY = 110;
    public static readonly EVERY = 111;
    public static readonly WHERE = 112;
    public static readonly MUST = 113;
    public static readonly NOT = 114;
    public static readonly MAY = 115;
    public static readonly DEPEND = 116;
    public static readonly HAVE = 117;
    public static readonly BE = 118;
    public static readonly EXCEPT = 119;
    public static readonly VIEW = 120;
    public static readonly OF = 121;
    public static readonly STYLE = 122;
    public static readonly TITLE = 123;
    public static readonly INCLUDE = 124;
    public static readonly EXCLUDE = 125;
    public static readonly LAYOUT = 126;
    public static readonly USE = 127;
    public static readonly AS = 128;
    public static readonly ANCHOR_KW = 129;
    public static readonly HANDLER_KW = 130;
    public static readonly HTTP_METHOD = 131;
    public static readonly BOOL = 132;
    public static readonly ID = 133;
    public static readonly NUMBER = 134;
    public static readonly STRING = 135;
    public static readonly DOC_COMMENT = 136;
    public static readonly LINE_COMMENT = 137;
    public static readonly BLOCK_COMMENT = 138;
    public static readonly WS = 139;
    public static readonly RULE_file = 0;
    public static readonly RULE_useDecl = 1;
    public static readonly RULE_topDecl = 2;
    public static readonly RULE_meta = 3;
    public static readonly RULE_annotation = 4;
    public static readonly RULE_annotationItem = 5;
    public static readonly RULE_systemDecl = 6;
    public static readonly RULE_systemItem = 7;
    public static readonly RULE_layerDecl = 8;
    public static readonly RULE_actorDecl = 9;
    public static readonly RULE_externalDecl = 10;
    public static readonly RULE_requirementDecl = 11;
    public static readonly RULE_decisionDecl = 12;
    public static readonly RULE_contextDecl = 13;
    public static readonly RULE_rootClause = 14;
    public static readonly RULE_contextMember = 15;
    public static readonly RULE_entityDecl = 16;
    public static readonly RULE_valueDecl = 17;
    public static readonly RULE_dtoDecl = 18;
    public static readonly RULE_fieldBlock = 19;
    public static readonly RULE_fieldBlockItem = 20;
    public static readonly RULE_fieldDecl = 21;
    public static readonly RULE_fieldModifier = 22;
    public static readonly RULE_enumDecl = 23;
    public static readonly RULE_aggregateDecl = 24;
    public static readonly RULE_typeRef = 25;
    public static readonly RULE_componentDecl = 26;
    public static readonly RULE_componentKind = 27;
    public static readonly RULE_layerClause = 28;
    public static readonly RULE_componentBody = 29;
    public static readonly RULE_componentItem = 30;
    public static readonly RULE_opDecl = 31;
    public static readonly RULE_paramList = 32;
    public static readonly RULE_param = 33;
    public static readonly RULE_apiDecl = 34;
    public static readonly RULE_protocol = 35;
    public static readonly RULE_endpointDecl = 36;
    public static readonly RULE_operationSig = 37;
    public static readonly RULE_endpointBody = 38;
    public static readonly RULE_endpointItem = 39;
    public static readonly RULE_paramLocation = 40;
    public static readonly RULE_channelDecl = 41;
    public static readonly RULE_eventDecl = 42;
    public static readonly RULE_handlerDecl = 43;
    public static readonly RULE_jobDecl = 44;
    public static readonly RULE_processDecl = 45;
    public static readonly RULE_processBlock = 46;
    public static readonly RULE_processItem = 47;
    public static readonly RULE_processStmt = 48;
    public static readonly RULE_ifTail = 49;
    public static readonly RULE_stepTarget = 50;
    public static readonly RULE_emitStmt = 51;
    public static readonly RULE_appDecl = 52;
    public static readonly RULE_appItem = 53;
    public static readonly RULE_routeDecl = 54;
    public static readonly RULE_traceClause = 55;
    public static readonly RULE_traceRef = 56;
    public static readonly RULE_deploymentDecl = 57;
    public static readonly RULE_deployItem = 58;
    public static readonly RULE_groupDecl = 59;
    public static readonly RULE_groupKind = 60;
    public static readonly RULE_nodeDecl = 61;
    public static readonly RULE_resourceType = 62;
    public static readonly RULE_nodeClause = 63;
    public static readonly RULE_nodeProp = 64;
    public static readonly RULE_connection = 65;
    public static readonly RULE_ruleDecl = 66;
    public static readonly RULE_ruleStmt = 67;
    public static readonly RULE_subject = 68;
    public static readonly RULE_modality = 69;
    public static readonly RULE_predicate = 70;
    public static readonly RULE_property = 71;
    public static readonly RULE_anchorWord = 72;
    public static readonly RULE_exception = 73;
    public static readonly RULE_elementKind = 74;
    public static readonly RULE_viewDecl = 75;
    public static readonly RULE_viewKind = 76;
    public static readonly RULE_viewItem = 77;
    public static readonly RULE_viewSelector = 78;
    public static readonly RULE_anchor = 79;
    public static readonly RULE_qualifiedName = 80;
    public static readonly RULE_qualifiedNameList = 81;
    public static readonly RULE_literalList = 82;
    public static readonly RULE_literal = 83;
    public static readonly RULE_name = 84;

    public static readonly literalNames = [
        null, "'#['", "','", "']'", "'('", "')'", "'{'", "'}'", "':'", "'<'", 
        "'>'", "'?'", "'['", "'->'", "'=>'", "'='", "'.'", "'*'", "'@'", 
        "'system'", "'description'", "'owner'", "'version'", "'layer'", 
        "'match'", "'actor'", "'external'", "'requirement'", "'decision'", 
        "'context'", "'root'", "'entity'", "'value'", "'dto'", "'enum'", 
        "'aggregate'", "'contains'", "'Map'", "'service'", "'controller'", 
        "'repository'", "'gateway'", "'middleware'", "'guard'", "'component'", 
        "'page'", "'store'", "'in'", "'uses'", "'calls'", "'renders'", "'implements'", 
        "'op'", "'api'", "'base'", "'http'", "'graphql'", "'grpc'", "'websocket'", 
        "'endpoint'", "'query'", "'mutation'", "'subscription'", "'rpc'", 
        "'message'", "'body'", "'param'", "'returns'", "'auth'", "'roles'", 
        "'rateLimit'", "'path'", "'channel'", "'kind'", "'event'", "'via'", 
        "'on'", "'job'", "'cron'", "'process'", "'trigger'", "'verify'", 
        "'step'", "'if'", "'else'", "'parallel'", "'foreach'", "'wait'", 
        "'timeout'", "'fail'", "'return'", "'emit'", "'app'", "'framework'", 
        "'route'", "'justifiedBy'", "'decidedBy'", "'deployment'", "'provider'", 
        "'region'", "'source'", "'network'", "'zone'", "'cluster'", "'group'", 
        "'runs'", "'stores'", "'carries'", "'replicas'", "'rule'", "'severity'", 
        "'every'", "'where'", "'must'", "'not'", "'may'", "'depend'", "'have'", 
        "'be'", "'except'", "'view'", "'of'", "'style'", "'title'", "'include'", 
        "'exclude'", "'layout'", "'use'", "'as'", "'anchor'", "'handler'"
    ];

    public static readonly symbolicNames = [
        null, null, null, null, null, null, null, null, null, null, null, 
        null, null, null, null, null, null, null, null, "SYSTEM", "DESCRIPTION", 
        "OWNER", "VERSION", "LAYER", "MATCH", "ACTOR", "EXTERNAL", "REQUIREMENT", 
        "DECISION", "CONTEXT", "ROOT", "ENTITY", "VALUE", "DTO", "ENUM", 
        "AGGREGATE", "CONTAINS", "MAP", "SERVICE", "CONTROLLER", "REPOSITORY", 
        "GATEWAY", "MIDDLEWARE", "GUARD", "COMPONENT", "PAGE", "STORE", 
        "IN", "USES", "CALLS", "RENDERS", "IMPLEMENTS", "OP", "API", "BASE", 
        "HTTP", "GRAPHQL", "GRPC", "WEBSOCKET", "ENDPOINT", "QUERY", "MUTATION", 
        "SUBSCRIPTION", "RPC", "MESSAGE", "BODY", "PARAM", "RETURNS", "AUTH", 
        "ROLES", "RATE_LIMIT", "PATH", "CHANNEL", "KIND", "EVENT", "VIA", 
        "ON", "JOB", "CRON", "PROCESS", "TRIGGER", "VERIFY", "STEP", "IF", 
        "ELSE", "PARALLEL", "FOREACH", "WAIT", "TIMEOUT", "FAIL", "RETURN", 
        "EMIT", "APP", "FRAMEWORK", "ROUTE", "JUSTIFIED_BY", "DECIDED_BY", 
        "DEPLOYMENT", "PROVIDER", "REGION", "SOURCE", "NETWORK", "ZONE", 
        "CLUSTER", "GROUP", "RUNS", "STORES", "CARRIES", "REPLICAS", "RULE", 
        "SEVERITY", "EVERY", "WHERE", "MUST", "NOT", "MAY", "DEPEND", "HAVE", 
        "BE", "EXCEPT", "VIEW", "OF", "STYLE", "TITLE", "INCLUDE", "EXCLUDE", 
        "LAYOUT", "USE", "AS", "ANCHOR_KW", "HANDLER_KW", "HTTP_METHOD", 
        "BOOL", "ID", "NUMBER", "STRING", "DOC_COMMENT", "LINE_COMMENT", 
        "BLOCK_COMMENT", "WS"
    ];
    public static readonly ruleNames = [
        "file", "useDecl", "topDecl", "meta", "annotation", "annotationItem", 
        "systemDecl", "systemItem", "layerDecl", "actorDecl", "externalDecl", 
        "requirementDecl", "decisionDecl", "contextDecl", "rootClause", 
        "contextMember", "entityDecl", "valueDecl", "dtoDecl", "fieldBlock", 
        "fieldBlockItem", "fieldDecl", "fieldModifier", "enumDecl", "aggregateDecl", 
        "typeRef", "componentDecl", "componentKind", "layerClause", "componentBody", 
        "componentItem", "opDecl", "paramList", "param", "apiDecl", "protocol", 
        "endpointDecl", "operationSig", "endpointBody", "endpointItem", 
        "paramLocation", "channelDecl", "eventDecl", "handlerDecl", "jobDecl", 
        "processDecl", "processBlock", "processItem", "processStmt", "ifTail", 
        "stepTarget", "emitStmt", "appDecl", "appItem", "routeDecl", "traceClause", 
        "traceRef", "deploymentDecl", "deployItem", "groupDecl", "groupKind", 
        "nodeDecl", "resourceType", "nodeClause", "nodeProp", "connection", 
        "ruleDecl", "ruleStmt", "subject", "modality", "predicate", "property", 
        "anchorWord", "exception", "elementKind", "viewDecl", "viewKind", 
        "viewItem", "viewSelector", "anchor", "qualifiedName", "qualifiedNameList", 
        "literalList", "literal", "name",
    ];

    public get grammarFileName(): string { return "Planta.g4"; }
    public get literalNames(): (string | null)[] { return PlantaParser.literalNames; }
    public get symbolicNames(): (string | null)[] { return PlantaParser.symbolicNames; }
    public get ruleNames(): string[] { return PlantaParser.ruleNames; }
    public get serializedATN(): number[] { return PlantaParser._serializedATN; }

    protected createFailedPredicateException(predicate?: string, message?: string): antlr.FailedPredicateException {
        return new antlr.FailedPredicateException(this, predicate, message);
    }

    public constructor(input: antlr.TokenStream) {
        super(input);
        this.interpreter = new antlr.ParserATNSimulator(this, PlantaParser._ATN, PlantaParser.decisionsToDFA, new antlr.PredictionContextCache());
    }
    public file(): FileContext {
        let localContext = new FileContext(this.context, this.state);
        this.enterRule(localContext, 0, PlantaParser.RULE_file);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 173;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 127) {
                {
                {
                this.state = 170;
                this.useDecl();
                }
                }
                this.state = 175;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 179;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 1049100290) !== 0) || ((((_la - 92)) & ~0x1F) === 0 && ((1 << (_la - 92)) & 268566561) !== 0) || _la === 136) {
                {
                {
                this.state = 176;
                this.topDecl();
                }
                }
                this.state = 181;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 182;
            this.match(PlantaParser.EOF);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public useDecl(): UseDeclContext {
        let localContext = new UseDeclContext(this.context, this.state);
        this.enterRule(localContext, 2, PlantaParser.RULE_useDecl);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 184;
            this.match(PlantaParser.USE);
            this.state = 185;
            this.qualifiedName();
            this.state = 188;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 128) {
                {
                this.state = 186;
                this.match(PlantaParser.AS);
                this.state = 187;
                this.name();
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public topDecl(): TopDeclContext {
        let localContext = new TopDeclContext(this.context, this.state);
        this.enterRule(localContext, 4, PlantaParser.RULE_topDecl);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 190;
            this.meta();
            this.state = 202;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PlantaParser.SYSTEM:
                {
                this.state = 191;
                this.systemDecl();
                }
                break;
            case PlantaParser.LAYER:
                {
                this.state = 192;
                this.layerDecl();
                }
                break;
            case PlantaParser.ACTOR:
                {
                this.state = 193;
                this.actorDecl();
                }
                break;
            case PlantaParser.EXTERNAL:
                {
                this.state = 194;
                this.externalDecl();
                }
                break;
            case PlantaParser.CONTEXT:
                {
                this.state = 195;
                this.contextDecl();
                }
                break;
            case PlantaParser.APP:
                {
                this.state = 196;
                this.appDecl();
                }
                break;
            case PlantaParser.REQUIREMENT:
                {
                this.state = 197;
                this.requirementDecl();
                }
                break;
            case PlantaParser.DECISION:
                {
                this.state = 198;
                this.decisionDecl();
                }
                break;
            case PlantaParser.DEPLOYMENT:
                {
                this.state = 199;
                this.deploymentDecl();
                }
                break;
            case PlantaParser.RULE:
                {
                this.state = 200;
                this.ruleDecl();
                }
                break;
            case PlantaParser.VIEW:
                {
                this.state = 201;
                this.viewDecl();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public meta(): MetaContext {
        let localContext = new MetaContext(this.context, this.state);
        this.enterRule(localContext, 6, PlantaParser.RULE_meta);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 207;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 136) {
                {
                {
                this.state = 204;
                this.match(PlantaParser.DOC_COMMENT);
                }
                }
                this.state = 209;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 213;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 1) {
                {
                {
                this.state = 210;
                this.annotation();
                }
                }
                this.state = 215;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public annotation(): AnnotationContext {
        let localContext = new AnnotationContext(this.context, this.state);
        this.enterRule(localContext, 8, PlantaParser.RULE_annotation);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 216;
            this.match(PlantaParser.T__0);
            this.state = 217;
            this.annotationItem();
            this.state = 222;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 2) {
                {
                {
                this.state = 218;
                this.match(PlantaParser.T__1);
                this.state = 219;
                this.annotationItem();
                }
                }
                this.state = 224;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 225;
            this.match(PlantaParser.T__2);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public annotationItem(): AnnotationItemContext {
        let localContext = new AnnotationItemContext(this.context, this.state);
        this.enterRule(localContext, 10, PlantaParser.RULE_annotationItem);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 227;
            this.name();
            this.state = 233;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 4) {
                {
                this.state = 228;
                this.match(PlantaParser.T__3);
                this.state = 230;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (((((_la - 19)) & ~0x1F) === 0 && ((1 << (_la - 19)) & 4294967295) !== 0) || ((((_la - 51)) & ~0x1F) === 0 && ((1 << (_la - 51)) & 4294967295) !== 0) || ((((_la - 83)) & ~0x1F) === 0 && ((1 << (_la - 83)) & 4294955007) !== 0) || ((((_la - 115)) & ~0x1F) === 0 && ((1 << (_la - 115)) & 2031615) !== 0)) {
                    {
                    this.state = 229;
                    this.literalList();
                    }
                }

                this.state = 232;
                this.match(PlantaParser.T__4);
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public systemDecl(): SystemDeclContext {
        let localContext = new SystemDeclContext(this.context, this.state);
        this.enterRule(localContext, 12, PlantaParser.RULE_systemDecl);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 235;
            this.match(PlantaParser.SYSTEM);
            this.state = 236;
            this.name();
            this.state = 237;
            this.match(PlantaParser.T__5);
            this.state = 241;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 7340032) !== 0)) {
                {
                {
                this.state = 238;
                this.systemItem();
                }
                }
                this.state = 243;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 244;
            this.match(PlantaParser.T__6);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public systemItem(): SystemItemContext {
        let localContext = new SystemItemContext(this.context, this.state);
        this.enterRule(localContext, 14, PlantaParser.RULE_systemItem);
        try {
            this.state = 252;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PlantaParser.DESCRIPTION:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 246;
                this.match(PlantaParser.DESCRIPTION);
                this.state = 247;
                this.match(PlantaParser.STRING);
                }
                break;
            case PlantaParser.OWNER:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 248;
                this.match(PlantaParser.OWNER);
                this.state = 249;
                this.match(PlantaParser.STRING);
                }
                break;
            case PlantaParser.VERSION:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 250;
                this.match(PlantaParser.VERSION);
                this.state = 251;
                this.match(PlantaParser.STRING);
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public layerDecl(): LayerDeclContext {
        let localContext = new LayerDeclContext(this.context, this.state);
        this.enterRule(localContext, 16, PlantaParser.RULE_layerDecl);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 254;
            this.match(PlantaParser.LAYER);
            this.state = 255;
            this.name();
            this.state = 265;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 24) {
                {
                this.state = 256;
                this.match(PlantaParser.MATCH);
                this.state = 257;
                this.match(PlantaParser.STRING);
                this.state = 262;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 2) {
                    {
                    {
                    this.state = 258;
                    this.match(PlantaParser.T__1);
                    this.state = 259;
                    this.match(PlantaParser.STRING);
                    }
                    }
                    this.state = 264;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public actorDecl(): ActorDeclContext {
        let localContext = new ActorDeclContext(this.context, this.state);
        this.enterRule(localContext, 18, PlantaParser.RULE_actorDecl);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 267;
            this.match(PlantaParser.ACTOR);
            this.state = 268;
            this.name();
            this.state = 270;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 135) {
                {
                this.state = 269;
                this.match(PlantaParser.STRING);
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public externalDecl(): ExternalDeclContext {
        let localContext = new ExternalDeclContext(this.context, this.state);
        this.enterRule(localContext, 20, PlantaParser.RULE_externalDecl);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 272;
            this.match(PlantaParser.EXTERNAL);
            this.state = 273;
            this.name();
            this.state = 275;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 135) {
                {
                this.state = 274;
                this.match(PlantaParser.STRING);
                }
            }

            this.state = 287;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 6) {
                {
                this.state = 277;
                this.match(PlantaParser.T__5);
                this.state = 283;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 1 || _la === 52 || _la === 136) {
                    {
                    {
                    this.state = 278;
                    this.meta();
                    this.state = 279;
                    this.opDecl();
                    }
                    }
                    this.state = 285;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                this.state = 286;
                this.match(PlantaParser.T__6);
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public requirementDecl(): RequirementDeclContext {
        let localContext = new RequirementDeclContext(this.context, this.state);
        this.enterRule(localContext, 22, PlantaParser.RULE_requirementDecl);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 289;
            this.match(PlantaParser.REQUIREMENT);
            this.state = 290;
            this.name();
            this.state = 291;
            this.anchor();
            this.state = 293;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 135) {
                {
                this.state = 292;
                this.match(PlantaParser.STRING);
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public decisionDecl(): DecisionDeclContext {
        let localContext = new DecisionDeclContext(this.context, this.state);
        this.enterRule(localContext, 24, PlantaParser.RULE_decisionDecl);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 295;
            this.match(PlantaParser.DECISION);
            this.state = 296;
            this.name();
            this.state = 297;
            this.anchor();
            this.state = 299;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 135) {
                {
                this.state = 298;
                this.match(PlantaParser.STRING);
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public contextDecl(): ContextDeclContext {
        let localContext = new ContextDeclContext(this.context, this.state);
        this.enterRule(localContext, 26, PlantaParser.RULE_contextDecl);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 301;
            this.match(PlantaParser.CONTEXT);
            this.state = 302;
            this.name();
            this.state = 304;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 30) {
                {
                this.state = 303;
                this.rootClause();
                }
            }

            this.state = 306;
            this.match(PlantaParser.T__5);
            this.state = 310;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 1 || _la === 31 || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 2129871) !== 0) || ((((_la - 72)) & ~0x1F) === 0 && ((1 << (_la - 72)) & 181) !== 0) || _la === 136) {
                {
                {
                this.state = 307;
                this.contextMember();
                }
                }
                this.state = 312;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 313;
            this.match(PlantaParser.T__6);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public rootClause(): RootClauseContext {
        let localContext = new RootClauseContext(this.context, this.state);
        this.enterRule(localContext, 28, PlantaParser.RULE_rootClause);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 315;
            this.match(PlantaParser.ROOT);
            this.state = 316;
            this.match(PlantaParser.STRING);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public contextMember(): ContextMemberContext {
        let localContext = new ContextMemberContext(this.context, this.state);
        this.enterRule(localContext, 30, PlantaParser.RULE_contextMember);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 318;
            this.meta();
            this.state = 331;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PlantaParser.ENTITY:
                {
                this.state = 319;
                this.entityDecl();
                }
                break;
            case PlantaParser.VALUE:
                {
                this.state = 320;
                this.valueDecl();
                }
                break;
            case PlantaParser.DTO:
                {
                this.state = 321;
                this.dtoDecl();
                }
                break;
            case PlantaParser.ENUM:
                {
                this.state = 322;
                this.enumDecl();
                }
                break;
            case PlantaParser.AGGREGATE:
                {
                this.state = 323;
                this.aggregateDecl();
                }
                break;
            case PlantaParser.SERVICE:
            case PlantaParser.CONTROLLER:
            case PlantaParser.REPOSITORY:
            case PlantaParser.GATEWAY:
            case PlantaParser.MIDDLEWARE:
            case PlantaParser.GUARD:
            case PlantaParser.COMPONENT:
            case PlantaParser.PAGE:
            case PlantaParser.STORE:
                {
                this.state = 324;
                this.componentDecl();
                }
                break;
            case PlantaParser.API:
                {
                this.state = 325;
                this.apiDecl();
                }
                break;
            case PlantaParser.CHANNEL:
                {
                this.state = 326;
                this.channelDecl();
                }
                break;
            case PlantaParser.EVENT:
                {
                this.state = 327;
                this.eventDecl();
                }
                break;
            case PlantaParser.ON:
                {
                this.state = 328;
                this.handlerDecl();
                }
                break;
            case PlantaParser.JOB:
                {
                this.state = 329;
                this.jobDecl();
                }
                break;
            case PlantaParser.PROCESS:
                {
                this.state = 330;
                this.processDecl();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public entityDecl(): EntityDeclContext {
        let localContext = new EntityDeclContext(this.context, this.state);
        this.enterRule(localContext, 32, PlantaParser.RULE_entityDecl);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 333;
            this.match(PlantaParser.ENTITY);
            this.state = 334;
            this.name();
            this.state = 336;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 18) {
                {
                this.state = 335;
                this.anchor();
                }
            }

            this.state = 339;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 6) {
                {
                this.state = 338;
                this.fieldBlock();
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public valueDecl(): ValueDeclContext {
        let localContext = new ValueDeclContext(this.context, this.state);
        this.enterRule(localContext, 34, PlantaParser.RULE_valueDecl);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 341;
            this.match(PlantaParser.VALUE);
            this.state = 342;
            this.name();
            this.state = 344;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 18) {
                {
                this.state = 343;
                this.anchor();
                }
            }

            this.state = 347;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 6) {
                {
                this.state = 346;
                this.fieldBlock();
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public dtoDecl(): DtoDeclContext {
        let localContext = new DtoDeclContext(this.context, this.state);
        this.enterRule(localContext, 36, PlantaParser.RULE_dtoDecl);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 349;
            this.match(PlantaParser.DTO);
            this.state = 350;
            this.name();
            this.state = 352;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 18) {
                {
                this.state = 351;
                this.anchor();
                }
            }

            this.state = 355;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 6) {
                {
                this.state = 354;
                this.fieldBlock();
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fieldBlock(): FieldBlockContext {
        let localContext = new FieldBlockContext(this.context, this.state);
        this.enterRule(localContext, 38, PlantaParser.RULE_fieldBlock);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 357;
            this.match(PlantaParser.T__5);
            this.state = 361;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4294443010) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 4294967295) !== 0) || ((((_la - 96)) & ~0x1F) === 0 && ((1 << (_la - 96)) & 4294967295) !== 0) || ((((_la - 128)) & ~0x1F) === 0 && ((1 << (_la - 128)) & 295) !== 0)) {
                {
                {
                this.state = 358;
                this.fieldBlockItem();
                }
                }
                this.state = 363;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 364;
            this.match(PlantaParser.T__6);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fieldBlockItem(): FieldBlockItemContext {
        let localContext = new FieldBlockItemContext(this.context, this.state);
        this.enterRule(localContext, 40, PlantaParser.RULE_fieldBlockItem);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 366;
            this.meta();
            this.state = 369;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PlantaParser.SYSTEM:
            case PlantaParser.DESCRIPTION:
            case PlantaParser.OWNER:
            case PlantaParser.VERSION:
            case PlantaParser.LAYER:
            case PlantaParser.MATCH:
            case PlantaParser.ACTOR:
            case PlantaParser.EXTERNAL:
            case PlantaParser.REQUIREMENT:
            case PlantaParser.DECISION:
            case PlantaParser.CONTEXT:
            case PlantaParser.ROOT:
            case PlantaParser.ENTITY:
            case PlantaParser.VALUE:
            case PlantaParser.DTO:
            case PlantaParser.ENUM:
            case PlantaParser.AGGREGATE:
            case PlantaParser.CONTAINS:
            case PlantaParser.MAP:
            case PlantaParser.SERVICE:
            case PlantaParser.CONTROLLER:
            case PlantaParser.REPOSITORY:
            case PlantaParser.GATEWAY:
            case PlantaParser.MIDDLEWARE:
            case PlantaParser.GUARD:
            case PlantaParser.COMPONENT:
            case PlantaParser.PAGE:
            case PlantaParser.STORE:
            case PlantaParser.IN:
            case PlantaParser.USES:
            case PlantaParser.CALLS:
            case PlantaParser.RENDERS:
            case PlantaParser.IMPLEMENTS:
            case PlantaParser.OP:
            case PlantaParser.API:
            case PlantaParser.BASE:
            case PlantaParser.HTTP:
            case PlantaParser.GRAPHQL:
            case PlantaParser.GRPC:
            case PlantaParser.WEBSOCKET:
            case PlantaParser.ENDPOINT:
            case PlantaParser.QUERY:
            case PlantaParser.MUTATION:
            case PlantaParser.SUBSCRIPTION:
            case PlantaParser.RPC:
            case PlantaParser.MESSAGE:
            case PlantaParser.BODY:
            case PlantaParser.PARAM:
            case PlantaParser.RETURNS:
            case PlantaParser.AUTH:
            case PlantaParser.ROLES:
            case PlantaParser.RATE_LIMIT:
            case PlantaParser.PATH:
            case PlantaParser.CHANNEL:
            case PlantaParser.KIND:
            case PlantaParser.EVENT:
            case PlantaParser.VIA:
            case PlantaParser.ON:
            case PlantaParser.JOB:
            case PlantaParser.CRON:
            case PlantaParser.PROCESS:
            case PlantaParser.TRIGGER:
            case PlantaParser.VERIFY:
            case PlantaParser.STEP:
            case PlantaParser.IF:
            case PlantaParser.ELSE:
            case PlantaParser.PARALLEL:
            case PlantaParser.FOREACH:
            case PlantaParser.WAIT:
            case PlantaParser.TIMEOUT:
            case PlantaParser.FAIL:
            case PlantaParser.RETURN:
            case PlantaParser.EMIT:
            case PlantaParser.APP:
            case PlantaParser.FRAMEWORK:
            case PlantaParser.ROUTE:
            case PlantaParser.DEPLOYMENT:
            case PlantaParser.PROVIDER:
            case PlantaParser.REGION:
            case PlantaParser.SOURCE:
            case PlantaParser.NETWORK:
            case PlantaParser.ZONE:
            case PlantaParser.CLUSTER:
            case PlantaParser.GROUP:
            case PlantaParser.RUNS:
            case PlantaParser.STORES:
            case PlantaParser.CARRIES:
            case PlantaParser.REPLICAS:
            case PlantaParser.RULE:
            case PlantaParser.SEVERITY:
            case PlantaParser.EVERY:
            case PlantaParser.WHERE:
            case PlantaParser.MUST:
            case PlantaParser.NOT:
            case PlantaParser.MAY:
            case PlantaParser.DEPEND:
            case PlantaParser.HAVE:
            case PlantaParser.BE:
            case PlantaParser.EXCEPT:
            case PlantaParser.VIEW:
            case PlantaParser.OF:
            case PlantaParser.STYLE:
            case PlantaParser.TITLE:
            case PlantaParser.INCLUDE:
            case PlantaParser.EXCLUDE:
            case PlantaParser.LAYOUT:
            case PlantaParser.USE:
            case PlantaParser.AS:
            case PlantaParser.ANCHOR_KW:
            case PlantaParser.HANDLER_KW:
            case PlantaParser.ID:
                {
                this.state = 367;
                this.fieldDecl();
                }
                break;
            case PlantaParser.JUSTIFIED_BY:
            case PlantaParser.DECIDED_BY:
                {
                this.state = 368;
                this.traceClause();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fieldDecl(): FieldDeclContext {
        let localContext = new FieldDeclContext(this.context, this.state);
        this.enterRule(localContext, 42, PlantaParser.RULE_fieldDecl);
        let _la: number;
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 371;
            this.name();
            this.state = 372;
            this.match(PlantaParser.T__7);
            this.state = 373;
            this.typeRef();
            this.state = 377;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 30, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 374;
                    this.fieldModifier();
                    }
                    }
                }
                this.state = 379;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 30, this.context);
            }
            this.state = 381;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 18) {
                {
                this.state = 380;
                this.anchor();
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fieldModifier(): FieldModifierContext {
        let localContext = new FieldModifierContext(this.context, this.state);
        this.enterRule(localContext, 44, PlantaParser.RULE_fieldModifier);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 383;
            this.name();
            this.state = 389;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 4) {
                {
                this.state = 384;
                this.match(PlantaParser.T__3);
                this.state = 386;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (((((_la - 19)) & ~0x1F) === 0 && ((1 << (_la - 19)) & 4294967295) !== 0) || ((((_la - 51)) & ~0x1F) === 0 && ((1 << (_la - 51)) & 4294967295) !== 0) || ((((_la - 83)) & ~0x1F) === 0 && ((1 << (_la - 83)) & 4294955007) !== 0) || ((((_la - 115)) & ~0x1F) === 0 && ((1 << (_la - 115)) & 2031615) !== 0)) {
                    {
                    this.state = 385;
                    this.literalList();
                    }
                }

                this.state = 388;
                this.match(PlantaParser.T__4);
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public enumDecl(): EnumDeclContext {
        let localContext = new EnumDeclContext(this.context, this.state);
        this.enterRule(localContext, 46, PlantaParser.RULE_enumDecl);
        let _la: number;
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 391;
            this.match(PlantaParser.ENUM);
            this.state = 392;
            this.name();
            this.state = 394;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 18) {
                {
                this.state = 393;
                this.anchor();
                }
            }

            this.state = 396;
            this.match(PlantaParser.T__5);
            this.state = 397;
            this.name();
            this.state = 402;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 35, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 398;
                    this.match(PlantaParser.T__1);
                    this.state = 399;
                    this.name();
                    }
                    }
                }
                this.state = 404;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 35, this.context);
            }
            this.state = 406;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 2) {
                {
                this.state = 405;
                this.match(PlantaParser.T__1);
                }
            }

            this.state = 408;
            this.match(PlantaParser.T__6);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public aggregateDecl(): AggregateDeclContext {
        let localContext = new AggregateDeclContext(this.context, this.state);
        this.enterRule(localContext, 48, PlantaParser.RULE_aggregateDecl);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 410;
            this.match(PlantaParser.AGGREGATE);
            this.state = 411;
            this.name();
            this.state = 412;
            this.match(PlantaParser.ROOT);
            this.state = 413;
            this.qualifiedName();
            this.state = 414;
            this.match(PlantaParser.T__5);
            this.state = 419;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 36) {
                {
                {
                this.state = 415;
                this.match(PlantaParser.CONTAINS);
                this.state = 416;
                this.qualifiedNameList();
                }
                }
                this.state = 421;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 422;
            this.match(PlantaParser.T__6);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public typeRef(): TypeRefContext {
        let localContext = new TypeRefContext(this.context, this.state);
        this.enterRule(localContext, 50, PlantaParser.RULE_typeRef);
        let _la: number;
        try {
            this.state = 441;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 41, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 424;
                this.match(PlantaParser.MAP);
                this.state = 425;
                this.match(PlantaParser.T__8);
                this.state = 426;
                this.typeRef();
                this.state = 427;
                this.match(PlantaParser.T__1);
                this.state = 428;
                this.typeRef();
                this.state = 429;
                this.match(PlantaParser.T__9);
                this.state = 431;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 11) {
                    {
                    this.state = 430;
                    this.match(PlantaParser.T__10);
                    }
                }

                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 433;
                this.qualifiedName();
                this.state = 436;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 12) {
                    {
                    this.state = 434;
                    this.match(PlantaParser.T__11);
                    this.state = 435;
                    this.match(PlantaParser.T__2);
                    }
                }

                this.state = 439;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 11) {
                    {
                    this.state = 438;
                    this.match(PlantaParser.T__10);
                    }
                }

                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public componentDecl(): ComponentDeclContext {
        let localContext = new ComponentDeclContext(this.context, this.state);
        this.enterRule(localContext, 52, PlantaParser.RULE_componentDecl);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 443;
            this.componentKind();
            this.state = 444;
            this.name();
            this.state = 446;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 18) {
                {
                this.state = 445;
                this.anchor();
                }
            }

            this.state = 449;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 47) {
                {
                this.state = 448;
                this.layerClause();
                }
            }

            this.state = 452;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 6) {
                {
                this.state = 451;
                this.componentBody();
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public componentKind(): ComponentKindContext {
        let localContext = new ComponentKindContext(this.context, this.state);
        this.enterRule(localContext, 54, PlantaParser.RULE_componentKind);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 454;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 38)) & ~0x1F) === 0 && ((1 << (_la - 38)) & 511) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public layerClause(): LayerClauseContext {
        let localContext = new LayerClauseContext(this.context, this.state);
        this.enterRule(localContext, 56, PlantaParser.RULE_layerClause);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 456;
            this.match(PlantaParser.IN);
            this.state = 457;
            this.match(PlantaParser.LAYER);
            this.state = 458;
            this.qualifiedName();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public componentBody(): ComponentBodyContext {
        let localContext = new ComponentBodyContext(this.context, this.state);
        this.enterRule(localContext, 58, PlantaParser.RULE_componentBody);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 460;
            this.match(PlantaParser.T__5);
            this.state = 464;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 1 || ((((_la - 48)) & ~0x1F) === 0 && ((1 << (_la - 48)) & 31) !== 0) || _la === 95 || _la === 96 || _la === 136) {
                {
                {
                this.state = 461;
                this.componentItem();
                }
                }
                this.state = 466;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 467;
            this.match(PlantaParser.T__6);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public componentItem(): ComponentItemContext {
        let localContext = new ComponentItemContext(this.context, this.state);
        this.enterRule(localContext, 60, PlantaParser.RULE_componentItem);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 469;
            this.meta();
            this.state = 480;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PlantaParser.OP:
                {
                this.state = 470;
                this.opDecl();
                }
                break;
            case PlantaParser.USES:
                {
                this.state = 471;
                this.match(PlantaParser.USES);
                this.state = 472;
                this.qualifiedNameList();
                }
                break;
            case PlantaParser.CALLS:
                {
                this.state = 473;
                this.match(PlantaParser.CALLS);
                this.state = 474;
                this.qualifiedNameList();
                }
                break;
            case PlantaParser.RENDERS:
                {
                this.state = 475;
                this.match(PlantaParser.RENDERS);
                this.state = 476;
                this.qualifiedNameList();
                }
                break;
            case PlantaParser.IMPLEMENTS:
                {
                this.state = 477;
                this.match(PlantaParser.IMPLEMENTS);
                this.state = 478;
                this.qualifiedNameList();
                }
                break;
            case PlantaParser.JUSTIFIED_BY:
            case PlantaParser.DECIDED_BY:
                {
                this.state = 479;
                this.traceClause();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public opDecl(): OpDeclContext {
        let localContext = new OpDeclContext(this.context, this.state);
        this.enterRule(localContext, 62, PlantaParser.RULE_opDecl);
        let _la: number;
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 482;
            this.match(PlantaParser.OP);
            this.state = 483;
            this.name();
            this.state = 484;
            this.match(PlantaParser.T__3);
            this.state = 486;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (((((_la - 19)) & ~0x1F) === 0 && ((1 << (_la - 19)) & 4294967295) !== 0) || ((((_la - 51)) & ~0x1F) === 0 && ((1 << (_la - 51)) & 4294967295) !== 0) || ((((_la - 83)) & ~0x1F) === 0 && ((1 << (_la - 83)) & 4294955007) !== 0) || ((((_la - 115)) & ~0x1F) === 0 && ((1 << (_la - 115)) & 327679) !== 0)) {
                {
                this.state = 485;
                this.paramList();
                }
            }

            this.state = 488;
            this.match(PlantaParser.T__4);
            this.state = 491;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 13) {
                {
                this.state = 489;
                this.match(PlantaParser.T__12);
                this.state = 490;
                this.typeRef();
                }
            }

            this.state = 494;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 18) {
                {
                this.state = 493;
                this.anchor();
                }
            }

            this.state = 499;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 50, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 496;
                    this.traceClause();
                    }
                    }
                }
                this.state = 501;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 50, this.context);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public paramList(): ParamListContext {
        let localContext = new ParamListContext(this.context, this.state);
        this.enterRule(localContext, 64, PlantaParser.RULE_paramList);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 502;
            this.param();
            this.state = 507;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 2) {
                {
                {
                this.state = 503;
                this.match(PlantaParser.T__1);
                this.state = 504;
                this.param();
                }
                }
                this.state = 509;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public param(): ParamContext {
        let localContext = new ParamContext(this.context, this.state);
        this.enterRule(localContext, 66, PlantaParser.RULE_param);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 510;
            this.name();
            this.state = 511;
            this.match(PlantaParser.T__7);
            this.state = 512;
            this.typeRef();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public apiDecl(): ApiDeclContext {
        let localContext = new ApiDeclContext(this.context, this.state);
        this.enterRule(localContext, 68, PlantaParser.RULE_apiDecl);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 514;
            this.match(PlantaParser.API);
            this.state = 515;
            this.name();
            this.state = 516;
            this.protocol();
            this.state = 519;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 54) {
                {
                this.state = 517;
                this.match(PlantaParser.BASE);
                this.state = 518;
                this.match(PlantaParser.STRING);
                }
            }

            this.state = 521;
            this.match(PlantaParser.T__5);
            this.state = 527;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 1 || _la === 59 || _la === 136) {
                {
                {
                this.state = 522;
                this.meta();
                this.state = 523;
                this.endpointDecl();
                }
                }
                this.state = 529;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 530;
            this.match(PlantaParser.T__6);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public protocol(): ProtocolContext {
        let localContext = new ProtocolContext(this.context, this.state);
        this.enterRule(localContext, 70, PlantaParser.RULE_protocol);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 532;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 55)) & ~0x1F) === 0 && ((1 << (_la - 55)) & 15) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public endpointDecl(): EndpointDeclContext {
        let localContext = new EndpointDeclContext(this.context, this.state);
        this.enterRule(localContext, 72, PlantaParser.RULE_endpointDecl);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 534;
            this.match(PlantaParser.ENDPOINT);
            this.state = 536;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 54, this.context) ) {
            case 1:
                {
                this.state = 535;
                this.name();
                }
                break;
            }
            this.state = 538;
            this.operationSig();
            this.state = 539;
            this.match(PlantaParser.T__13);
            this.state = 540;
            this.qualifiedName();
            this.state = 542;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 6) {
                {
                this.state = 541;
                this.endpointBody();
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public operationSig(): OperationSigContext {
        let localContext = new OperationSigContext(this.context, this.state);
        this.enterRule(localContext, 74, PlantaParser.RULE_operationSig);
        let _la: number;
        try {
            this.state = 548;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PlantaParser.HTTP_METHOD:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 544;
                this.match(PlantaParser.HTTP_METHOD);
                this.state = 545;
                this.match(PlantaParser.STRING);
                }
                break;
            case PlantaParser.QUERY:
            case PlantaParser.MUTATION:
            case PlantaParser.SUBSCRIPTION:
            case PlantaParser.RPC:
            case PlantaParser.MESSAGE:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 546;
                _la = this.tokenStream.LA(1);
                if(!(((((_la - 60)) & ~0x1F) === 0 && ((1 << (_la - 60)) & 31) !== 0))) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 547;
                this.match(PlantaParser.STRING);
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public endpointBody(): EndpointBodyContext {
        let localContext = new EndpointBodyContext(this.context, this.state);
        this.enterRule(localContext, 76, PlantaParser.RULE_endpointBody);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 550;
            this.match(PlantaParser.T__5);
            this.state = 554;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 65)) & ~0x1F) === 0 && ((1 << (_la - 65)) & 3221225519) !== 0)) {
                {
                {
                this.state = 551;
                this.endpointItem();
                }
                }
                this.state = 556;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 557;
            this.match(PlantaParser.T__6);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public endpointItem(): EndpointItemContext {
        let localContext = new EndpointItemContext(this.context, this.state);
        this.enterRule(localContext, 78, PlantaParser.RULE_endpointItem);
        let _la: number;
        try {
            this.state = 593;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PlantaParser.BODY:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 559;
                this.match(PlantaParser.BODY);
                this.state = 560;
                this.typeRef();
                }
                break;
            case PlantaParser.PARAM:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 561;
                this.match(PlantaParser.PARAM);
                this.state = 562;
                this.name();
                this.state = 563;
                this.match(PlantaParser.T__7);
                this.state = 564;
                this.typeRef();
                this.state = 567;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 47) {
                    {
                    this.state = 565;
                    this.match(PlantaParser.IN);
                    this.state = 566;
                    this.paramLocation();
                    }
                }

                }
                break;
            case PlantaParser.RETURNS:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 569;
                this.match(PlantaParser.RETURNS);
                this.state = 570;
                this.match(PlantaParser.NUMBER);
                this.state = 572;
                this.errorHandler.sync(this);
                switch (this.interpreter.adaptivePredict(this.tokenStream, 59, this.context) ) {
                case 1:
                    {
                    this.state = 571;
                    this.typeRef();
                    }
                    break;
                }
                }
                break;
            case PlantaParser.AUTH:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 574;
                this.match(PlantaParser.AUTH);
                this.state = 575;
                this.name();
                this.state = 588;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 69) {
                    {
                    this.state = 576;
                    this.match(PlantaParser.ROLES);
                    this.state = 577;
                    this.match(PlantaParser.T__11);
                    this.state = 578;
                    this.name();
                    this.state = 583;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                    while (_la === 2) {
                        {
                        {
                        this.state = 579;
                        this.match(PlantaParser.T__1);
                        this.state = 580;
                        this.name();
                        }
                        }
                        this.state = 585;
                        this.errorHandler.sync(this);
                        _la = this.tokenStream.LA(1);
                    }
                    this.state = 586;
                    this.match(PlantaParser.T__2);
                    }
                }

                }
                break;
            case PlantaParser.RATE_LIMIT:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 590;
                this.match(PlantaParser.RATE_LIMIT);
                this.state = 591;
                this.match(PlantaParser.STRING);
                }
                break;
            case PlantaParser.JUSTIFIED_BY:
            case PlantaParser.DECIDED_BY:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 592;
                this.traceClause();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public paramLocation(): ParamLocationContext {
        let localContext = new ParamLocationContext(this.context, this.state);
        this.enterRule(localContext, 80, PlantaParser.RULE_paramLocation);
        try {
            this.state = 598;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 63, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 595;
                this.match(PlantaParser.PATH);
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 596;
                this.match(PlantaParser.QUERY);
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 597;
                this.name();
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public channelDecl(): ChannelDeclContext {
        let localContext = new ChannelDeclContext(this.context, this.state);
        this.enterRule(localContext, 82, PlantaParser.RULE_channelDecl);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 600;
            this.match(PlantaParser.CHANNEL);
            this.state = 601;
            this.name();
            this.state = 602;
            this.match(PlantaParser.KIND);
            this.state = 603;
            this.name();
            this.state = 605;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 18) {
                {
                this.state = 604;
                this.anchor();
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public eventDecl(): EventDeclContext {
        let localContext = new EventDeclContext(this.context, this.state);
        this.enterRule(localContext, 84, PlantaParser.RULE_eventDecl);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 607;
            this.match(PlantaParser.EVENT);
            this.state = 608;
            this.name();
            this.state = 611;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 75) {
                {
                this.state = 609;
                this.match(PlantaParser.VIA);
                this.state = 610;
                this.qualifiedName();
                }
            }

            this.state = 614;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 18) {
                {
                this.state = 613;
                this.anchor();
                }
            }

            this.state = 617;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 6) {
                {
                this.state = 616;
                this.fieldBlock();
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public handlerDecl(): HandlerDeclContext {
        let localContext = new HandlerDeclContext(this.context, this.state);
        this.enterRule(localContext, 86, PlantaParser.RULE_handlerDecl);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 619;
            this.match(PlantaParser.ON);
            this.state = 620;
            this.qualifiedName();
            this.state = 621;
            this.match(PlantaParser.T__13);
            this.state = 622;
            this.qualifiedName();
            this.state = 626;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 95 || _la === 96) {
                {
                {
                this.state = 623;
                this.traceClause();
                }
                }
                this.state = 628;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public jobDecl(): JobDeclContext {
        let localContext = new JobDeclContext(this.context, this.state);
        this.enterRule(localContext, 88, PlantaParser.RULE_jobDecl);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 629;
            this.match(PlantaParser.JOB);
            this.state = 630;
            this.name();
            this.state = 631;
            this.match(PlantaParser.CRON);
            this.state = 632;
            this.match(PlantaParser.STRING);
            this.state = 633;
            this.match(PlantaParser.T__13);
            this.state = 634;
            this.qualifiedName();
            this.state = 638;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 95 || _la === 96) {
                {
                {
                this.state = 635;
                this.traceClause();
                }
                }
                this.state = 640;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public processDecl(): ProcessDeclContext {
        let localContext = new ProcessDeclContext(this.context, this.state);
        this.enterRule(localContext, 90, PlantaParser.RULE_processDecl);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 641;
            this.match(PlantaParser.PROCESS);
            this.state = 642;
            this.name();
            this.state = 643;
            this.processBlock();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public processBlock(): ProcessBlockContext {
        let localContext = new ProcessBlockContext(this.context, this.state);
        this.enterRule(localContext, 92, PlantaParser.RULE_processBlock);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 645;
            this.match(PlantaParser.T__5);
            this.state = 649;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 1 || _la === 25 || ((((_la - 80)) & ~0x1F) === 0 && ((1 << (_la - 80)) & 102127) !== 0) || _la === 136) {
                {
                {
                this.state = 646;
                this.processItem();
                }
                }
                this.state = 651;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 652;
            this.match(PlantaParser.T__6);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public processItem(): ProcessItemContext {
        let localContext = new ProcessItemContext(this.context, this.state);
        this.enterRule(localContext, 94, PlantaParser.RULE_processItem);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 654;
            this.meta();
            this.state = 655;
            this.processStmt();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public processStmt(): ProcessStmtContext {
        let localContext = new ProcessStmtContext(this.context, this.state);
        this.enterRule(localContext, 96, PlantaParser.RULE_processStmt);
        let _la: number;
        try {
            this.state = 705;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PlantaParser.JUSTIFIED_BY:
            case PlantaParser.DECIDED_BY:
                localContext = new ProcTraceContext(localContext);
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 657;
                this.traceClause();
                }
                break;
            case PlantaParser.TRIGGER:
                localContext = new ProcTriggerContext(localContext);
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 658;
                this.match(PlantaParser.TRIGGER);
                this.state = 659;
                this.qualifiedName();
                }
                break;
            case PlantaParser.ACTOR:
                localContext = new ProcActorContext(localContext);
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 660;
                this.match(PlantaParser.ACTOR);
                this.state = 661;
                this.qualifiedName();
                }
                break;
            case PlantaParser.VERIFY:
                localContext = new ProcVerifyContext(localContext);
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 662;
                this.match(PlantaParser.VERIFY);
                this.state = 665;
                this.errorHandler.sync(this);
                switch (this.interpreter.adaptivePredict(this.tokenStream, 71, this.context) ) {
                case 1:
                    {
                    this.state = 663;
                    this.match(PlantaParser.CALLS);
                    }
                    break;
                case 2:
                    {
                    this.state = 664;
                    this.name();
                    }
                    break;
                }
                }
                break;
            case PlantaParser.STEP:
                localContext = new ProcStepContext(localContext);
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 667;
                this.match(PlantaParser.STEP);
                this.state = 668;
                this.name();
                this.state = 669;
                this.match(PlantaParser.T__7);
                this.state = 670;
                this.stepTarget();
                }
                break;
            case PlantaParser.EMIT:
                localContext = new ProcEmitContext(localContext);
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 672;
                this.emitStmt();
                }
                break;
            case PlantaParser.IF:
                localContext = new ProcIfContext(localContext);
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 673;
                this.match(PlantaParser.IF);
                this.state = 674;
                this.match(PlantaParser.STRING);
                this.state = 675;
                this.processBlock();
                this.state = 681;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 84) {
                    {
                    this.state = 676;
                    this.match(PlantaParser.ELSE);
                    this.state = 679;
                    this.errorHandler.sync(this);
                    switch (this.tokenStream.LA(1)) {
                    case PlantaParser.IF:
                        {
                        this.state = 677;
                        this.ifTail();
                        }
                        break;
                    case PlantaParser.T__5:
                        {
                        this.state = 678;
                        this.processBlock();
                        }
                        break;
                    default:
                        throw new antlr.NoViableAltException(this);
                    }
                    }
                }

                }
                break;
            case PlantaParser.PARALLEL:
                localContext = new ProcParallelContext(localContext);
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 683;
                this.match(PlantaParser.PARALLEL);
                this.state = 684;
                this.processBlock();
                }
                break;
            case PlantaParser.FOREACH:
                localContext = new ProcForeachContext(localContext);
                this.enterOuterAlt(localContext, 9);
                {
                this.state = 685;
                this.match(PlantaParser.FOREACH);
                this.state = 686;
                this.match(PlantaParser.STRING);
                this.state = 687;
                this.processBlock();
                }
                break;
            case PlantaParser.WAIT:
                localContext = new ProcWaitContext(localContext);
                this.enterOuterAlt(localContext, 10);
                {
                this.state = 688;
                this.match(PlantaParser.WAIT);
                this.state = 689;
                this.qualifiedName();
                this.state = 692;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 88) {
                    {
                    this.state = 690;
                    this.match(PlantaParser.TIMEOUT);
                    this.state = 691;
                    this.match(PlantaParser.STRING);
                    }
                }

                }
                break;
            case PlantaParser.FAIL:
                localContext = new ProcFailContext(localContext);
                this.enterOuterAlt(localContext, 11);
                {
                this.state = 694;
                this.match(PlantaParser.FAIL);
                this.state = 696;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 134) {
                    {
                    this.state = 695;
                    this.match(PlantaParser.NUMBER);
                    }
                }

                this.state = 699;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 135) {
                    {
                    this.state = 698;
                    this.match(PlantaParser.STRING);
                    }
                }

                }
                break;
            case PlantaParser.RETURN:
                localContext = new ProcReturnContext(localContext);
                this.enterOuterAlt(localContext, 12);
                {
                this.state = 701;
                this.match(PlantaParser.RETURN);
                this.state = 703;
                this.errorHandler.sync(this);
                switch (this.interpreter.adaptivePredict(this.tokenStream, 77, this.context) ) {
                case 1:
                    {
                    this.state = 702;
                    this.typeRef();
                    }
                    break;
                }
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public ifTail(): IfTailContext {
        let localContext = new IfTailContext(this.context, this.state);
        this.enterRule(localContext, 98, PlantaParser.RULE_ifTail);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 707;
            this.match(PlantaParser.IF);
            this.state = 708;
            this.match(PlantaParser.STRING);
            this.state = 709;
            this.processBlock();
            this.state = 715;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 84) {
                {
                this.state = 710;
                this.match(PlantaParser.ELSE);
                this.state = 713;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PlantaParser.IF:
                    {
                    this.state = 711;
                    this.ifTail();
                    }
                    break;
                case PlantaParser.T__5:
                    {
                    this.state = 712;
                    this.processBlock();
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public stepTarget(): StepTargetContext {
        let localContext = new StepTargetContext(this.context, this.state);
        this.enterRule(localContext, 100, PlantaParser.RULE_stepTarget);
        try {
            this.state = 720;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 81, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 717;
                this.emitStmt();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 718;
                this.qualifiedName();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 719;
                this.match(PlantaParser.STRING);
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public emitStmt(): EmitStmtContext {
        let localContext = new EmitStmtContext(this.context, this.state);
        this.enterRule(localContext, 102, PlantaParser.RULE_emitStmt);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 722;
            this.match(PlantaParser.EMIT);
            this.state = 723;
            this.qualifiedName();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public appDecl(): AppDeclContext {
        let localContext = new AppDeclContext(this.context, this.state);
        this.enterRule(localContext, 104, PlantaParser.RULE_appDecl);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 725;
            this.match(PlantaParser.APP);
            this.state = 726;
            this.name();
            this.state = 727;
            this.match(PlantaParser.KIND);
            this.state = 728;
            this.name();
            this.state = 731;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 93) {
                {
                this.state = 729;
                this.match(PlantaParser.FRAMEWORK);
                this.state = 730;
                this.name();
                }
            }

            this.state = 734;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 30) {
                {
                this.state = 733;
                this.rootClause();
                }
            }

            this.state = 744;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 6) {
                {
                this.state = 736;
                this.match(PlantaParser.T__5);
                this.state = 740;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 1 || ((((_la - 36)) & ~0x1F) === 0 && ((1 << (_la - 36)) & 2045) !== 0) || _la === 94 || _la === 136) {
                    {
                    {
                    this.state = 737;
                    this.appItem();
                    }
                    }
                    this.state = 742;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                this.state = 743;
                this.match(PlantaParser.T__6);
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public appItem(): AppItemContext {
        let localContext = new AppItemContext(this.context, this.state);
        this.enterRule(localContext, 106, PlantaParser.RULE_appItem);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 746;
            this.meta();
            this.state = 751;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PlantaParser.CONTAINS:
                {
                this.state = 747;
                this.match(PlantaParser.CONTAINS);
                this.state = 748;
                this.qualifiedNameList();
                }
                break;
            case PlantaParser.ROUTE:
                {
                this.state = 749;
                this.routeDecl();
                }
                break;
            case PlantaParser.SERVICE:
            case PlantaParser.CONTROLLER:
            case PlantaParser.REPOSITORY:
            case PlantaParser.GATEWAY:
            case PlantaParser.MIDDLEWARE:
            case PlantaParser.GUARD:
            case PlantaParser.COMPONENT:
            case PlantaParser.PAGE:
            case PlantaParser.STORE:
                {
                this.state = 750;
                this.componentDecl();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public routeDecl(): RouteDeclContext {
        let localContext = new RouteDeclContext(this.context, this.state);
        this.enterRule(localContext, 108, PlantaParser.RULE_routeDecl);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 753;
            this.match(PlantaParser.ROUTE);
            this.state = 754;
            this.match(PlantaParser.STRING);
            this.state = 755;
            this.match(PlantaParser.T__13);
            this.state = 756;
            this.qualifiedName();
            this.state = 759;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 87, this.context) ) {
            case 1:
                {
                this.state = 757;
                this.match(PlantaParser.GUARD);
                this.state = 758;
                this.qualifiedName();
                }
                break;
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public traceClause(): TraceClauseContext {
        let localContext = new TraceClauseContext(this.context, this.state);
        this.enterRule(localContext, 110, PlantaParser.RULE_traceClause);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 761;
            _la = this.tokenStream.LA(1);
            if(!(_la === 95 || _la === 96)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            this.state = 762;
            this.traceRef();
            this.state = 767;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 2) {
                {
                {
                this.state = 763;
                this.match(PlantaParser.T__1);
                this.state = 764;
                this.traceRef();
                }
                }
                this.state = 769;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public traceRef(): TraceRefContext {
        let localContext = new TraceRefContext(this.context, this.state);
        this.enterRule(localContext, 112, PlantaParser.RULE_traceRef);
        try {
            this.state = 772;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PlantaParser.STRING:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 770;
                this.match(PlantaParser.STRING);
                }
                break;
            case PlantaParser.SYSTEM:
            case PlantaParser.DESCRIPTION:
            case PlantaParser.OWNER:
            case PlantaParser.VERSION:
            case PlantaParser.LAYER:
            case PlantaParser.MATCH:
            case PlantaParser.ACTOR:
            case PlantaParser.EXTERNAL:
            case PlantaParser.REQUIREMENT:
            case PlantaParser.DECISION:
            case PlantaParser.CONTEXT:
            case PlantaParser.ROOT:
            case PlantaParser.ENTITY:
            case PlantaParser.VALUE:
            case PlantaParser.DTO:
            case PlantaParser.ENUM:
            case PlantaParser.AGGREGATE:
            case PlantaParser.CONTAINS:
            case PlantaParser.MAP:
            case PlantaParser.SERVICE:
            case PlantaParser.CONTROLLER:
            case PlantaParser.REPOSITORY:
            case PlantaParser.GATEWAY:
            case PlantaParser.MIDDLEWARE:
            case PlantaParser.GUARD:
            case PlantaParser.COMPONENT:
            case PlantaParser.PAGE:
            case PlantaParser.STORE:
            case PlantaParser.IN:
            case PlantaParser.USES:
            case PlantaParser.CALLS:
            case PlantaParser.RENDERS:
            case PlantaParser.IMPLEMENTS:
            case PlantaParser.OP:
            case PlantaParser.API:
            case PlantaParser.BASE:
            case PlantaParser.HTTP:
            case PlantaParser.GRAPHQL:
            case PlantaParser.GRPC:
            case PlantaParser.WEBSOCKET:
            case PlantaParser.ENDPOINT:
            case PlantaParser.QUERY:
            case PlantaParser.MUTATION:
            case PlantaParser.SUBSCRIPTION:
            case PlantaParser.RPC:
            case PlantaParser.MESSAGE:
            case PlantaParser.BODY:
            case PlantaParser.PARAM:
            case PlantaParser.RETURNS:
            case PlantaParser.AUTH:
            case PlantaParser.ROLES:
            case PlantaParser.RATE_LIMIT:
            case PlantaParser.PATH:
            case PlantaParser.CHANNEL:
            case PlantaParser.KIND:
            case PlantaParser.EVENT:
            case PlantaParser.VIA:
            case PlantaParser.ON:
            case PlantaParser.JOB:
            case PlantaParser.CRON:
            case PlantaParser.PROCESS:
            case PlantaParser.TRIGGER:
            case PlantaParser.VERIFY:
            case PlantaParser.STEP:
            case PlantaParser.IF:
            case PlantaParser.ELSE:
            case PlantaParser.PARALLEL:
            case PlantaParser.FOREACH:
            case PlantaParser.WAIT:
            case PlantaParser.TIMEOUT:
            case PlantaParser.FAIL:
            case PlantaParser.RETURN:
            case PlantaParser.EMIT:
            case PlantaParser.APP:
            case PlantaParser.FRAMEWORK:
            case PlantaParser.ROUTE:
            case PlantaParser.DEPLOYMENT:
            case PlantaParser.PROVIDER:
            case PlantaParser.REGION:
            case PlantaParser.SOURCE:
            case PlantaParser.NETWORK:
            case PlantaParser.ZONE:
            case PlantaParser.CLUSTER:
            case PlantaParser.GROUP:
            case PlantaParser.RUNS:
            case PlantaParser.STORES:
            case PlantaParser.CARRIES:
            case PlantaParser.REPLICAS:
            case PlantaParser.RULE:
            case PlantaParser.SEVERITY:
            case PlantaParser.EVERY:
            case PlantaParser.WHERE:
            case PlantaParser.MUST:
            case PlantaParser.NOT:
            case PlantaParser.MAY:
            case PlantaParser.DEPEND:
            case PlantaParser.HAVE:
            case PlantaParser.BE:
            case PlantaParser.EXCEPT:
            case PlantaParser.VIEW:
            case PlantaParser.OF:
            case PlantaParser.STYLE:
            case PlantaParser.TITLE:
            case PlantaParser.INCLUDE:
            case PlantaParser.EXCLUDE:
            case PlantaParser.LAYOUT:
            case PlantaParser.USE:
            case PlantaParser.AS:
            case PlantaParser.ANCHOR_KW:
            case PlantaParser.HANDLER_KW:
            case PlantaParser.ID:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 771;
                this.qualifiedName();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public deploymentDecl(): DeploymentDeclContext {
        let localContext = new DeploymentDeclContext(this.context, this.state);
        this.enterRule(localContext, 114, PlantaParser.RULE_deploymentDecl);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 774;
            this.match(PlantaParser.DEPLOYMENT);
            this.state = 775;
            this.name();
            this.state = 778;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 98) {
                {
                this.state = 776;
                this.match(PlantaParser.PROVIDER);
                this.state = 777;
                this.name();
                }
            }

            this.state = 782;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 99) {
                {
                this.state = 780;
                this.match(PlantaParser.REGION);
                this.state = 781;
                this.match(PlantaParser.STRING);
                }
            }

            this.state = 788;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 100) {
                {
                this.state = 784;
                this.match(PlantaParser.SOURCE);
                this.state = 785;
                this.name();
                this.state = 786;
                this.match(PlantaParser.STRING);
                }
            }

            this.state = 790;
            this.match(PlantaParser.T__5);
            this.state = 794;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4294443010) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 2147483647) !== 0) || ((((_la - 97)) & ~0x1F) === 0 && ((1 << (_la - 97)) & 4294967295) !== 0) || ((((_la - 129)) & ~0x1F) === 0 && ((1 << (_la - 129)) & 147) !== 0)) {
                {
                {
                this.state = 791;
                this.deployItem();
                }
                }
                this.state = 796;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 797;
            this.match(PlantaParser.T__6);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public deployItem(): DeployItemContext {
        let localContext = new DeployItemContext(this.context, this.state);
        this.enterRule(localContext, 116, PlantaParser.RULE_deployItem);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 799;
            this.meta();
            this.state = 803;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 94, this.context) ) {
            case 1:
                {
                this.state = 800;
                this.groupDecl();
                }
                break;
            case 2:
                {
                this.state = 801;
                this.connection();
                }
                break;
            case 3:
                {
                this.state = 802;
                this.nodeDecl();
                }
                break;
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public groupDecl(): GroupDeclContext {
        let localContext = new GroupDeclContext(this.context, this.state);
        this.enterRule(localContext, 118, PlantaParser.RULE_groupDecl);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 805;
            this.groupKind();
            this.state = 806;
            this.name();
            this.state = 809;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 8) {
                {
                this.state = 807;
                this.match(PlantaParser.T__7);
                this.state = 808;
                this.resourceType();
                }
            }

            this.state = 812;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 18) {
                {
                this.state = 811;
                this.anchor();
                }
            }

            this.state = 814;
            this.match(PlantaParser.T__5);
            this.state = 818;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4294443010) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 2147483647) !== 0) || ((((_la - 97)) & ~0x1F) === 0 && ((1 << (_la - 97)) & 4294967295) !== 0) || ((((_la - 129)) & ~0x1F) === 0 && ((1 << (_la - 129)) & 147) !== 0)) {
                {
                {
                this.state = 815;
                this.deployItem();
                }
                }
                this.state = 820;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 821;
            this.match(PlantaParser.T__6);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public groupKind(): GroupKindContext {
        let localContext = new GroupKindContext(this.context, this.state);
        this.enterRule(localContext, 120, PlantaParser.RULE_groupKind);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 823;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 99)) & ~0x1F) === 0 && ((1 << (_la - 99)) & 61) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public nodeDecl(): NodeDeclContext {
        let localContext = new NodeDeclContext(this.context, this.state);
        this.enterRule(localContext, 122, PlantaParser.RULE_nodeDecl);
        let _la: number;
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 825;
            this.name();
            this.state = 826;
            this.match(PlantaParser.T__7);
            this.state = 827;
            this.resourceType();
            this.state = 831;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 98, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 828;
                    this.nodeClause();
                    }
                    }
                }
                this.state = 833;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 98, this.context);
            }
            this.state = 835;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 18) {
                {
                this.state = 834;
                this.anchor();
                }
            }

            this.state = 845;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 6) {
                {
                this.state = 837;
                this.match(PlantaParser.T__5);
                this.state = 841;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (((((_la - 19)) & ~0x1F) === 0 && ((1 << (_la - 19)) & 4294967295) !== 0) || ((((_la - 51)) & ~0x1F) === 0 && ((1 << (_la - 51)) & 4294967295) !== 0) || ((((_la - 83)) & ~0x1F) === 0 && ((1 << (_la - 83)) & 4294955007) !== 0) || ((((_la - 115)) & ~0x1F) === 0 && ((1 << (_la - 115)) & 327679) !== 0)) {
                    {
                    {
                    this.state = 838;
                    this.nodeProp();
                    }
                    }
                    this.state = 843;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                this.state = 844;
                this.match(PlantaParser.T__6);
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public resourceType(): ResourceTypeContext {
        let localContext = new ResourceTypeContext(this.context, this.state);
        this.enterRule(localContext, 124, PlantaParser.RULE_resourceType);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 847;
            this.qualifiedName();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public nodeClause(): NodeClauseContext {
        let localContext = new NodeClauseContext(this.context, this.state);
        this.enterRule(localContext, 126, PlantaParser.RULE_nodeClause);
        try {
            this.state = 857;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PlantaParser.RUNS:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 849;
                this.match(PlantaParser.RUNS);
                this.state = 850;
                this.qualifiedName();
                }
                break;
            case PlantaParser.STORES:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 851;
                this.match(PlantaParser.STORES);
                this.state = 852;
                this.qualifiedNameList();
                }
                break;
            case PlantaParser.CARRIES:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 853;
                this.match(PlantaParser.CARRIES);
                this.state = 854;
                this.qualifiedNameList();
                }
                break;
            case PlantaParser.REPLICAS:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 855;
                this.match(PlantaParser.REPLICAS);
                this.state = 856;
                this.match(PlantaParser.NUMBER);
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public nodeProp(): NodePropContext {
        let localContext = new NodePropContext(this.context, this.state);
        this.enterRule(localContext, 128, PlantaParser.RULE_nodeProp);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 859;
            this.name();
            this.state = 860;
            this.match(PlantaParser.T__14);
            this.state = 861;
            this.literal();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public connection(): ConnectionContext {
        let localContext = new ConnectionContext(this.context, this.state);
        this.enterRule(localContext, 130, PlantaParser.RULE_connection);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 863;
            this.qualifiedName();
            this.state = 866;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                {
                this.state = 864;
                this.match(PlantaParser.T__12);
                this.state = 865;
                this.qualifiedName();
                }
                }
                this.state = 868;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while (_la === 13);
            this.state = 871;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 135) {
                {
                this.state = 870;
                this.match(PlantaParser.STRING);
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public ruleDecl(): RuleDeclContext {
        let localContext = new RuleDeclContext(this.context, this.state);
        this.enterRule(localContext, 132, PlantaParser.RULE_ruleDecl);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 873;
            this.match(PlantaParser.RULE);
            this.state = 874;
            this.name();
            this.state = 877;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 110) {
                {
                this.state = 875;
                this.match(PlantaParser.SEVERITY);
                this.state = 876;
                this.name();
                }
            }

            this.state = 879;
            this.match(PlantaParser.T__5);
            this.state = 883;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 3196059648) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 137396175) !== 0) || ((((_la - 72)) & ~0x1F) === 0 && ((1 << (_la - 72)) & 1048741) !== 0) || _la === 111 || _la === 130) {
                {
                {
                this.state = 880;
                this.ruleStmt();
                }
                }
                this.state = 885;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 886;
            this.match(PlantaParser.T__6);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public ruleStmt(): RuleStmtContext {
        let localContext = new RuleStmtContext(this.context, this.state);
        this.enterRule(localContext, 134, PlantaParser.RULE_ruleStmt);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 888;
            this.subject();
            this.state = 889;
            this.modality();
            this.state = 890;
            this.predicate();
            this.state = 892;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 119) {
                {
                this.state = 891;
                this.exception();
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public subject(): SubjectContext {
        let localContext = new SubjectContext(this.context, this.state);
        this.enterRule(localContext, 136, PlantaParser.RULE_subject);
        let _la: number;
        try {
            this.state = 906;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PlantaParser.EVERY:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 894;
                this.match(PlantaParser.EVERY);
                this.state = 895;
                this.elementKind();
                this.state = 901;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 112) {
                    {
                    this.state = 896;
                    this.match(PlantaParser.WHERE);
                    this.state = 897;
                    this.name();
                    this.state = 898;
                    this.match(PlantaParser.T__14);
                    this.state = 899;
                    this.literal();
                    }
                }

                }
                break;
            case PlantaParser.LAYER:
            case PlantaParser.ACTOR:
            case PlantaParser.EXTERNAL:
            case PlantaParser.REQUIREMENT:
            case PlantaParser.DECISION:
            case PlantaParser.CONTEXT:
            case PlantaParser.ENTITY:
            case PlantaParser.VALUE:
            case PlantaParser.DTO:
            case PlantaParser.ENUM:
            case PlantaParser.AGGREGATE:
            case PlantaParser.SERVICE:
            case PlantaParser.CONTROLLER:
            case PlantaParser.REPOSITORY:
            case PlantaParser.GATEWAY:
            case PlantaParser.MIDDLEWARE:
            case PlantaParser.GUARD:
            case PlantaParser.COMPONENT:
            case PlantaParser.PAGE:
            case PlantaParser.STORE:
            case PlantaParser.OP:
            case PlantaParser.API:
            case PlantaParser.ENDPOINT:
            case PlantaParser.CHANNEL:
            case PlantaParser.EVENT:
            case PlantaParser.JOB:
            case PlantaParser.PROCESS:
            case PlantaParser.APP:
            case PlantaParser.HANDLER_KW:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 903;
                this.elementKind();
                this.state = 904;
                this.qualifiedName();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public modality(): ModalityContext {
        let localContext = new ModalityContext(this.context, this.state);
        this.enterRule(localContext, 138, PlantaParser.RULE_modality);
        let _la: number;
        try {
            this.state = 913;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PlantaParser.MUST:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 908;
                this.match(PlantaParser.MUST);
                this.state = 910;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 114) {
                    {
                    this.state = 909;
                    this.match(PlantaParser.NOT);
                    }
                }

                }
                break;
            case PlantaParser.MAY:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 912;
                this.match(PlantaParser.MAY);
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public predicate(): PredicateContext {
        let localContext = new PredicateContext(this.context, this.state);
        this.enterRule(localContext, 140, PlantaParser.RULE_predicate);
        try {
            this.state = 926;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PlantaParser.DEPEND:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 915;
                this.match(PlantaParser.DEPEND);
                this.state = 916;
                this.match(PlantaParser.ON);
                this.state = 917;
                this.subject();
                }
                break;
            case PlantaParser.HAVE:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 918;
                this.match(PlantaParser.HAVE);
                this.state = 919;
                this.property();
                }
                break;
            case PlantaParser.MATCH:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 920;
                this.match(PlantaParser.MATCH);
                this.state = 921;
                this.match(PlantaParser.STRING);
                }
                break;
            case PlantaParser.BE:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 922;
                this.match(PlantaParser.BE);
                this.state = 923;
                this.match(PlantaParser.IN);
                this.state = 924;
                this.match(PlantaParser.LAYER);
                this.state = 925;
                this.qualifiedName();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public property(): PropertyContext {
        let localContext = new PropertyContext(this.context, this.state);
        this.enterRule(localContext, 142, PlantaParser.RULE_property);
        try {
            this.state = 933;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 113, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 928;
                this.match(PlantaParser.JUSTIFIED_BY);
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 929;
                this.match(PlantaParser.DECIDED_BY);
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 930;
                this.match(PlantaParser.OWNER);
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 931;
                this.anchorWord();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 932;
                this.name();
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public anchorWord(): AnchorWordContext {
        let localContext = new AnchorWordContext(this.context, this.state);
        this.enterRule(localContext, 144, PlantaParser.RULE_anchorWord);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 935;
            this.match(PlantaParser.ANCHOR_KW);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public exception(): ExceptionContext {
        let localContext = new ExceptionContext(this.context, this.state);
        this.enterRule(localContext, 146, PlantaParser.RULE_exception);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 937;
            this.match(PlantaParser.EXCEPT);
            this.state = 938;
            this.match(PlantaParser.VIA);
            this.state = 939;
            this.elementKind();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public elementKind(): ElementKindContext {
        let localContext = new ElementKindContext(this.context, this.state);
        this.enterRule(localContext, 148, PlantaParser.RULE_elementKind);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 941;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 3196059648) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 137396175) !== 0) || ((((_la - 72)) & ~0x1F) === 0 && ((1 << (_la - 72)) & 1048741) !== 0) || _la === 130)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public viewDecl(): ViewDeclContext {
        let localContext = new ViewDeclContext(this.context, this.state);
        this.enterRule(localContext, 150, PlantaParser.RULE_viewDecl);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 943;
            this.match(PlantaParser.VIEW);
            this.state = 944;
            this.name();
            this.state = 945;
            this.match(PlantaParser.KIND);
            this.state = 946;
            this.viewKind();
            this.state = 949;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 121) {
                {
                this.state = 947;
                this.match(PlantaParser.OF);
                this.state = 948;
                this.qualifiedName();
                }
            }

            this.state = 953;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 122) {
                {
                this.state = 951;
                this.match(PlantaParser.STYLE);
                this.state = 952;
                this.name();
                }
            }

            this.state = 963;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 6) {
                {
                this.state = 955;
                this.match(PlantaParser.T__5);
                this.state = 959;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (((((_la - 123)) & ~0x1F) === 0 && ((1 << (_la - 123)) & 15) !== 0)) {
                    {
                    {
                    this.state = 956;
                    this.viewItem();
                    }
                    }
                    this.state = 961;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                this.state = 962;
                this.match(PlantaParser.T__6);
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public viewKind(): ViewKindContext {
        let localContext = new ViewKindContext(this.context, this.state);
        this.enterRule(localContext, 152, PlantaParser.RULE_viewKind);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 965;
            this.name();
            this.state = 968;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 16) {
                {
                this.state = 966;
                this.match(PlantaParser.T__15);
                this.state = 967;
                this.name();
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public viewItem(): ViewItemContext {
        let localContext = new ViewItemContext(this.context, this.state);
        this.enterRule(localContext, 154, PlantaParser.RULE_viewItem);
        let _la: number;
        try {
            this.state = 992;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PlantaParser.TITLE:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 970;
                this.match(PlantaParser.TITLE);
                this.state = 971;
                this.match(PlantaParser.STRING);
                }
                break;
            case PlantaParser.INCLUDE:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 972;
                this.match(PlantaParser.INCLUDE);
                this.state = 973;
                this.viewSelector();
                this.state = 978;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 2) {
                    {
                    {
                    this.state = 974;
                    this.match(PlantaParser.T__1);
                    this.state = 975;
                    this.viewSelector();
                    }
                    }
                    this.state = 980;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
                break;
            case PlantaParser.EXCLUDE:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 981;
                this.match(PlantaParser.EXCLUDE);
                this.state = 982;
                this.viewSelector();
                this.state = 987;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 2) {
                    {
                    {
                    this.state = 983;
                    this.match(PlantaParser.T__1);
                    this.state = 984;
                    this.viewSelector();
                    }
                    }
                    this.state = 989;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
                break;
            case PlantaParser.LAYOUT:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 990;
                this.match(PlantaParser.LAYOUT);
                this.state = 991;
                this.name();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public viewSelector(): ViewSelectorContext {
        let localContext = new ViewSelectorContext(this.context, this.state);
        this.enterRule(localContext, 156, PlantaParser.RULE_viewSelector);
        let _la: number;
        try {
            this.state = 1002;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 123, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 994;
                this.match(PlantaParser.T__16);
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 995;
                this.match(PlantaParser.EVERY);
                this.state = 996;
                this.elementKind();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 997;
                this.qualifiedName();
                this.state = 1000;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 16) {
                    {
                    this.state = 998;
                    this.match(PlantaParser.T__15);
                    this.state = 999;
                    this.match(PlantaParser.T__16);
                    }
                }

                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public anchor(): AnchorContext {
        let localContext = new AnchorContext(this.context, this.state);
        this.enterRule(localContext, 158, PlantaParser.RULE_anchor);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1004;
            this.match(PlantaParser.T__17);
            this.state = 1005;
            this.match(PlantaParser.STRING);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public qualifiedName(): QualifiedNameContext {
        let localContext = new QualifiedNameContext(this.context, this.state);
        this.enterRule(localContext, 160, PlantaParser.RULE_qualifiedName);
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1007;
            this.name();
            this.state = 1012;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 124, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 1008;
                    this.match(PlantaParser.T__15);
                    this.state = 1009;
                    this.name();
                    }
                    }
                }
                this.state = 1014;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 124, this.context);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public qualifiedNameList(): QualifiedNameListContext {
        let localContext = new QualifiedNameListContext(this.context, this.state);
        this.enterRule(localContext, 162, PlantaParser.RULE_qualifiedNameList);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1015;
            this.qualifiedName();
            this.state = 1020;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 2) {
                {
                {
                this.state = 1016;
                this.match(PlantaParser.T__1);
                this.state = 1017;
                this.qualifiedName();
                }
                }
                this.state = 1022;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public literalList(): LiteralListContext {
        let localContext = new LiteralListContext(this.context, this.state);
        this.enterRule(localContext, 164, PlantaParser.RULE_literalList);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1023;
            this.literal();
            this.state = 1028;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 2) {
                {
                {
                this.state = 1024;
                this.match(PlantaParser.T__1);
                this.state = 1025;
                this.literal();
                }
                }
                this.state = 1030;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public literal(): LiteralContext {
        let localContext = new LiteralContext(this.context, this.state);
        this.enterRule(localContext, 166, PlantaParser.RULE_literal);
        try {
            this.state = 1035;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PlantaParser.STRING:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 1031;
                this.match(PlantaParser.STRING);
                }
                break;
            case PlantaParser.NUMBER:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 1032;
                this.match(PlantaParser.NUMBER);
                }
                break;
            case PlantaParser.BOOL:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 1033;
                this.match(PlantaParser.BOOL);
                }
                break;
            case PlantaParser.SYSTEM:
            case PlantaParser.DESCRIPTION:
            case PlantaParser.OWNER:
            case PlantaParser.VERSION:
            case PlantaParser.LAYER:
            case PlantaParser.MATCH:
            case PlantaParser.ACTOR:
            case PlantaParser.EXTERNAL:
            case PlantaParser.REQUIREMENT:
            case PlantaParser.DECISION:
            case PlantaParser.CONTEXT:
            case PlantaParser.ROOT:
            case PlantaParser.ENTITY:
            case PlantaParser.VALUE:
            case PlantaParser.DTO:
            case PlantaParser.ENUM:
            case PlantaParser.AGGREGATE:
            case PlantaParser.CONTAINS:
            case PlantaParser.MAP:
            case PlantaParser.SERVICE:
            case PlantaParser.CONTROLLER:
            case PlantaParser.REPOSITORY:
            case PlantaParser.GATEWAY:
            case PlantaParser.MIDDLEWARE:
            case PlantaParser.GUARD:
            case PlantaParser.COMPONENT:
            case PlantaParser.PAGE:
            case PlantaParser.STORE:
            case PlantaParser.IN:
            case PlantaParser.USES:
            case PlantaParser.CALLS:
            case PlantaParser.RENDERS:
            case PlantaParser.IMPLEMENTS:
            case PlantaParser.OP:
            case PlantaParser.API:
            case PlantaParser.BASE:
            case PlantaParser.HTTP:
            case PlantaParser.GRAPHQL:
            case PlantaParser.GRPC:
            case PlantaParser.WEBSOCKET:
            case PlantaParser.ENDPOINT:
            case PlantaParser.QUERY:
            case PlantaParser.MUTATION:
            case PlantaParser.SUBSCRIPTION:
            case PlantaParser.RPC:
            case PlantaParser.MESSAGE:
            case PlantaParser.BODY:
            case PlantaParser.PARAM:
            case PlantaParser.RETURNS:
            case PlantaParser.AUTH:
            case PlantaParser.ROLES:
            case PlantaParser.RATE_LIMIT:
            case PlantaParser.PATH:
            case PlantaParser.CHANNEL:
            case PlantaParser.KIND:
            case PlantaParser.EVENT:
            case PlantaParser.VIA:
            case PlantaParser.ON:
            case PlantaParser.JOB:
            case PlantaParser.CRON:
            case PlantaParser.PROCESS:
            case PlantaParser.TRIGGER:
            case PlantaParser.VERIFY:
            case PlantaParser.STEP:
            case PlantaParser.IF:
            case PlantaParser.ELSE:
            case PlantaParser.PARALLEL:
            case PlantaParser.FOREACH:
            case PlantaParser.WAIT:
            case PlantaParser.TIMEOUT:
            case PlantaParser.FAIL:
            case PlantaParser.RETURN:
            case PlantaParser.EMIT:
            case PlantaParser.APP:
            case PlantaParser.FRAMEWORK:
            case PlantaParser.ROUTE:
            case PlantaParser.DEPLOYMENT:
            case PlantaParser.PROVIDER:
            case PlantaParser.REGION:
            case PlantaParser.SOURCE:
            case PlantaParser.NETWORK:
            case PlantaParser.ZONE:
            case PlantaParser.CLUSTER:
            case PlantaParser.GROUP:
            case PlantaParser.RUNS:
            case PlantaParser.STORES:
            case PlantaParser.CARRIES:
            case PlantaParser.REPLICAS:
            case PlantaParser.RULE:
            case PlantaParser.SEVERITY:
            case PlantaParser.EVERY:
            case PlantaParser.WHERE:
            case PlantaParser.MUST:
            case PlantaParser.NOT:
            case PlantaParser.MAY:
            case PlantaParser.DEPEND:
            case PlantaParser.HAVE:
            case PlantaParser.BE:
            case PlantaParser.EXCEPT:
            case PlantaParser.VIEW:
            case PlantaParser.OF:
            case PlantaParser.STYLE:
            case PlantaParser.TITLE:
            case PlantaParser.INCLUDE:
            case PlantaParser.EXCLUDE:
            case PlantaParser.LAYOUT:
            case PlantaParser.USE:
            case PlantaParser.AS:
            case PlantaParser.ANCHOR_KW:
            case PlantaParser.HANDLER_KW:
            case PlantaParser.ID:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 1034;
                this.name();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public name(): NameContext {
        let localContext = new NameContext(this.context, this.state);
        this.enterRule(localContext, 168, PlantaParser.RULE_name);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1037;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 19)) & ~0x1F) === 0 && ((1 << (_la - 19)) & 4294967295) !== 0) || ((((_la - 51)) & ~0x1F) === 0 && ((1 << (_la - 51)) & 4294967295) !== 0) || ((((_la - 83)) & ~0x1F) === 0 && ((1 << (_la - 83)) & 4294955007) !== 0) || ((((_la - 115)) & ~0x1F) === 0 && ((1 << (_la - 115)) & 327679) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }

    public static readonly _serializedATN: number[] = [
        4,1,139,1040,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,
        7,6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,13,7,
        13,2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,2,19,7,19,2,
        20,7,20,2,21,7,21,2,22,7,22,2,23,7,23,2,24,7,24,2,25,7,25,2,26,7,
        26,2,27,7,27,2,28,7,28,2,29,7,29,2,30,7,30,2,31,7,31,2,32,7,32,2,
        33,7,33,2,34,7,34,2,35,7,35,2,36,7,36,2,37,7,37,2,38,7,38,2,39,7,
        39,2,40,7,40,2,41,7,41,2,42,7,42,2,43,7,43,2,44,7,44,2,45,7,45,2,
        46,7,46,2,47,7,47,2,48,7,48,2,49,7,49,2,50,7,50,2,51,7,51,2,52,7,
        52,2,53,7,53,2,54,7,54,2,55,7,55,2,56,7,56,2,57,7,57,2,58,7,58,2,
        59,7,59,2,60,7,60,2,61,7,61,2,62,7,62,2,63,7,63,2,64,7,64,2,65,7,
        65,2,66,7,66,2,67,7,67,2,68,7,68,2,69,7,69,2,70,7,70,2,71,7,71,2,
        72,7,72,2,73,7,73,2,74,7,74,2,75,7,75,2,76,7,76,2,77,7,77,2,78,7,
        78,2,79,7,79,2,80,7,80,2,81,7,81,2,82,7,82,2,83,7,83,2,84,7,84,1,
        0,5,0,172,8,0,10,0,12,0,175,9,0,1,0,5,0,178,8,0,10,0,12,0,181,9,
        0,1,0,1,0,1,1,1,1,1,1,1,1,3,1,189,8,1,1,2,1,2,1,2,1,2,1,2,1,2,1,
        2,1,2,1,2,1,2,1,2,1,2,3,2,203,8,2,1,3,5,3,206,8,3,10,3,12,3,209,
        9,3,1,3,5,3,212,8,3,10,3,12,3,215,9,3,1,4,1,4,1,4,1,4,5,4,221,8,
        4,10,4,12,4,224,9,4,1,4,1,4,1,5,1,5,1,5,3,5,231,8,5,1,5,3,5,234,
        8,5,1,6,1,6,1,6,1,6,5,6,240,8,6,10,6,12,6,243,9,6,1,6,1,6,1,7,1,
        7,1,7,1,7,1,7,1,7,3,7,253,8,7,1,8,1,8,1,8,1,8,1,8,1,8,5,8,261,8,
        8,10,8,12,8,264,9,8,3,8,266,8,8,1,9,1,9,1,9,3,9,271,8,9,1,10,1,10,
        1,10,3,10,276,8,10,1,10,1,10,1,10,1,10,5,10,282,8,10,10,10,12,10,
        285,9,10,1,10,3,10,288,8,10,1,11,1,11,1,11,1,11,3,11,294,8,11,1,
        12,1,12,1,12,1,12,3,12,300,8,12,1,13,1,13,1,13,3,13,305,8,13,1,13,
        1,13,5,13,309,8,13,10,13,12,13,312,9,13,1,13,1,13,1,14,1,14,1,14,
        1,15,1,15,1,15,1,15,1,15,1,15,1,15,1,15,1,15,1,15,1,15,1,15,1,15,
        3,15,332,8,15,1,16,1,16,1,16,3,16,337,8,16,1,16,3,16,340,8,16,1,
        17,1,17,1,17,3,17,345,8,17,1,17,3,17,348,8,17,1,18,1,18,1,18,3,18,
        353,8,18,1,18,3,18,356,8,18,1,19,1,19,5,19,360,8,19,10,19,12,19,
        363,9,19,1,19,1,19,1,20,1,20,1,20,3,20,370,8,20,1,21,1,21,1,21,1,
        21,5,21,376,8,21,10,21,12,21,379,9,21,1,21,3,21,382,8,21,1,22,1,
        22,1,22,3,22,387,8,22,1,22,3,22,390,8,22,1,23,1,23,1,23,3,23,395,
        8,23,1,23,1,23,1,23,1,23,5,23,401,8,23,10,23,12,23,404,9,23,1,23,
        3,23,407,8,23,1,23,1,23,1,24,1,24,1,24,1,24,1,24,1,24,1,24,5,24,
        418,8,24,10,24,12,24,421,9,24,1,24,1,24,1,25,1,25,1,25,1,25,1,25,
        1,25,1,25,3,25,432,8,25,1,25,1,25,1,25,3,25,437,8,25,1,25,3,25,440,
        8,25,3,25,442,8,25,1,26,1,26,1,26,3,26,447,8,26,1,26,3,26,450,8,
        26,1,26,3,26,453,8,26,1,27,1,27,1,28,1,28,1,28,1,28,1,29,1,29,5,
        29,463,8,29,10,29,12,29,466,9,29,1,29,1,29,1,30,1,30,1,30,1,30,1,
        30,1,30,1,30,1,30,1,30,1,30,1,30,3,30,481,8,30,1,31,1,31,1,31,1,
        31,3,31,487,8,31,1,31,1,31,1,31,3,31,492,8,31,1,31,3,31,495,8,31,
        1,31,5,31,498,8,31,10,31,12,31,501,9,31,1,32,1,32,1,32,5,32,506,
        8,32,10,32,12,32,509,9,32,1,33,1,33,1,33,1,33,1,34,1,34,1,34,1,34,
        1,34,3,34,520,8,34,1,34,1,34,1,34,1,34,5,34,526,8,34,10,34,12,34,
        529,9,34,1,34,1,34,1,35,1,35,1,36,1,36,3,36,537,8,36,1,36,1,36,1,
        36,1,36,3,36,543,8,36,1,37,1,37,1,37,1,37,3,37,549,8,37,1,38,1,38,
        5,38,553,8,38,10,38,12,38,556,9,38,1,38,1,38,1,39,1,39,1,39,1,39,
        1,39,1,39,1,39,1,39,3,39,568,8,39,1,39,1,39,1,39,3,39,573,8,39,1,
        39,1,39,1,39,1,39,1,39,1,39,1,39,5,39,582,8,39,10,39,12,39,585,9,
        39,1,39,1,39,3,39,589,8,39,1,39,1,39,1,39,3,39,594,8,39,1,40,1,40,
        1,40,3,40,599,8,40,1,41,1,41,1,41,1,41,1,41,3,41,606,8,41,1,42,1,
        42,1,42,1,42,3,42,612,8,42,1,42,3,42,615,8,42,1,42,3,42,618,8,42,
        1,43,1,43,1,43,1,43,1,43,5,43,625,8,43,10,43,12,43,628,9,43,1,44,
        1,44,1,44,1,44,1,44,1,44,1,44,5,44,637,8,44,10,44,12,44,640,9,44,
        1,45,1,45,1,45,1,45,1,46,1,46,5,46,648,8,46,10,46,12,46,651,9,46,
        1,46,1,46,1,47,1,47,1,47,1,48,1,48,1,48,1,48,1,48,1,48,1,48,1,48,
        3,48,666,8,48,1,48,1,48,1,48,1,48,1,48,1,48,1,48,1,48,1,48,1,48,
        1,48,1,48,3,48,680,8,48,3,48,682,8,48,1,48,1,48,1,48,1,48,1,48,1,
        48,1,48,1,48,1,48,3,48,693,8,48,1,48,1,48,3,48,697,8,48,1,48,3,48,
        700,8,48,1,48,1,48,3,48,704,8,48,3,48,706,8,48,1,49,1,49,1,49,1,
        49,1,49,1,49,3,49,714,8,49,3,49,716,8,49,1,50,1,50,1,50,3,50,721,
        8,50,1,51,1,51,1,51,1,52,1,52,1,52,1,52,1,52,1,52,3,52,732,8,52,
        1,52,3,52,735,8,52,1,52,1,52,5,52,739,8,52,10,52,12,52,742,9,52,
        1,52,3,52,745,8,52,1,53,1,53,1,53,1,53,1,53,3,53,752,8,53,1,54,1,
        54,1,54,1,54,1,54,1,54,3,54,760,8,54,1,55,1,55,1,55,1,55,5,55,766,
        8,55,10,55,12,55,769,9,55,1,56,1,56,3,56,773,8,56,1,57,1,57,1,57,
        1,57,3,57,779,8,57,1,57,1,57,3,57,783,8,57,1,57,1,57,1,57,1,57,3,
        57,789,8,57,1,57,1,57,5,57,793,8,57,10,57,12,57,796,9,57,1,57,1,
        57,1,58,1,58,1,58,1,58,3,58,804,8,58,1,59,1,59,1,59,1,59,3,59,810,
        8,59,1,59,3,59,813,8,59,1,59,1,59,5,59,817,8,59,10,59,12,59,820,
        9,59,1,59,1,59,1,60,1,60,1,61,1,61,1,61,1,61,5,61,830,8,61,10,61,
        12,61,833,9,61,1,61,3,61,836,8,61,1,61,1,61,5,61,840,8,61,10,61,
        12,61,843,9,61,1,61,3,61,846,8,61,1,62,1,62,1,63,1,63,1,63,1,63,
        1,63,1,63,1,63,1,63,3,63,858,8,63,1,64,1,64,1,64,1,64,1,65,1,65,
        1,65,4,65,867,8,65,11,65,12,65,868,1,65,3,65,872,8,65,1,66,1,66,
        1,66,1,66,3,66,878,8,66,1,66,1,66,5,66,882,8,66,10,66,12,66,885,
        9,66,1,66,1,66,1,67,1,67,1,67,1,67,3,67,893,8,67,1,68,1,68,1,68,
        1,68,1,68,1,68,1,68,3,68,902,8,68,1,68,1,68,1,68,3,68,907,8,68,1,
        69,1,69,3,69,911,8,69,1,69,3,69,914,8,69,1,70,1,70,1,70,1,70,1,70,
        1,70,1,70,1,70,1,70,1,70,1,70,3,70,927,8,70,1,71,1,71,1,71,1,71,
        1,71,3,71,934,8,71,1,72,1,72,1,73,1,73,1,73,1,73,1,74,1,74,1,75,
        1,75,1,75,1,75,1,75,1,75,3,75,950,8,75,1,75,1,75,3,75,954,8,75,1,
        75,1,75,5,75,958,8,75,10,75,12,75,961,9,75,1,75,3,75,964,8,75,1,
        76,1,76,1,76,3,76,969,8,76,1,77,1,77,1,77,1,77,1,77,1,77,5,77,977,
        8,77,10,77,12,77,980,9,77,1,77,1,77,1,77,1,77,5,77,986,8,77,10,77,
        12,77,989,9,77,1,77,1,77,3,77,993,8,77,1,78,1,78,1,78,1,78,1,78,
        1,78,3,78,1001,8,78,3,78,1003,8,78,1,79,1,79,1,79,1,80,1,80,1,80,
        5,80,1011,8,80,10,80,12,80,1014,9,80,1,81,1,81,1,81,5,81,1019,8,
        81,10,81,12,81,1022,9,81,1,82,1,82,1,82,5,82,1027,8,82,10,82,12,
        82,1030,9,82,1,83,1,83,1,83,1,83,3,83,1036,8,83,1,84,1,84,1,84,0,
        0,85,0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,
        44,46,48,50,52,54,56,58,60,62,64,66,68,70,72,74,76,78,80,82,84,86,
        88,90,92,94,96,98,100,102,104,106,108,110,112,114,116,118,120,122,
        124,126,128,130,132,134,136,138,140,142,144,146,148,150,152,154,
        156,158,160,162,164,166,168,0,7,1,0,38,46,1,0,55,58,1,0,60,64,1,
        0,95,96,2,0,99,99,101,104,12,0,23,23,25,29,31,35,38,46,52,53,59,
        59,72,72,74,74,77,77,79,79,92,92,130,130,3,0,19,94,97,130,133,133,
        1136,0,173,1,0,0,0,2,184,1,0,0,0,4,190,1,0,0,0,6,207,1,0,0,0,8,216,
        1,0,0,0,10,227,1,0,0,0,12,235,1,0,0,0,14,252,1,0,0,0,16,254,1,0,
        0,0,18,267,1,0,0,0,20,272,1,0,0,0,22,289,1,0,0,0,24,295,1,0,0,0,
        26,301,1,0,0,0,28,315,1,0,0,0,30,318,1,0,0,0,32,333,1,0,0,0,34,341,
        1,0,0,0,36,349,1,0,0,0,38,357,1,0,0,0,40,366,1,0,0,0,42,371,1,0,
        0,0,44,383,1,0,0,0,46,391,1,0,0,0,48,410,1,0,0,0,50,441,1,0,0,0,
        52,443,1,0,0,0,54,454,1,0,0,0,56,456,1,0,0,0,58,460,1,0,0,0,60,469,
        1,0,0,0,62,482,1,0,0,0,64,502,1,0,0,0,66,510,1,0,0,0,68,514,1,0,
        0,0,70,532,1,0,0,0,72,534,1,0,0,0,74,548,1,0,0,0,76,550,1,0,0,0,
        78,593,1,0,0,0,80,598,1,0,0,0,82,600,1,0,0,0,84,607,1,0,0,0,86,619,
        1,0,0,0,88,629,1,0,0,0,90,641,1,0,0,0,92,645,1,0,0,0,94,654,1,0,
        0,0,96,705,1,0,0,0,98,707,1,0,0,0,100,720,1,0,0,0,102,722,1,0,0,
        0,104,725,1,0,0,0,106,746,1,0,0,0,108,753,1,0,0,0,110,761,1,0,0,
        0,112,772,1,0,0,0,114,774,1,0,0,0,116,799,1,0,0,0,118,805,1,0,0,
        0,120,823,1,0,0,0,122,825,1,0,0,0,124,847,1,0,0,0,126,857,1,0,0,
        0,128,859,1,0,0,0,130,863,1,0,0,0,132,873,1,0,0,0,134,888,1,0,0,
        0,136,906,1,0,0,0,138,913,1,0,0,0,140,926,1,0,0,0,142,933,1,0,0,
        0,144,935,1,0,0,0,146,937,1,0,0,0,148,941,1,0,0,0,150,943,1,0,0,
        0,152,965,1,0,0,0,154,992,1,0,0,0,156,1002,1,0,0,0,158,1004,1,0,
        0,0,160,1007,1,0,0,0,162,1015,1,0,0,0,164,1023,1,0,0,0,166,1035,
        1,0,0,0,168,1037,1,0,0,0,170,172,3,2,1,0,171,170,1,0,0,0,172,175,
        1,0,0,0,173,171,1,0,0,0,173,174,1,0,0,0,174,179,1,0,0,0,175,173,
        1,0,0,0,176,178,3,4,2,0,177,176,1,0,0,0,178,181,1,0,0,0,179,177,
        1,0,0,0,179,180,1,0,0,0,180,182,1,0,0,0,181,179,1,0,0,0,182,183,
        5,0,0,1,183,1,1,0,0,0,184,185,5,127,0,0,185,188,3,160,80,0,186,187,
        5,128,0,0,187,189,3,168,84,0,188,186,1,0,0,0,188,189,1,0,0,0,189,
        3,1,0,0,0,190,202,3,6,3,0,191,203,3,12,6,0,192,203,3,16,8,0,193,
        203,3,18,9,0,194,203,3,20,10,0,195,203,3,26,13,0,196,203,3,104,52,
        0,197,203,3,22,11,0,198,203,3,24,12,0,199,203,3,114,57,0,200,203,
        3,132,66,0,201,203,3,150,75,0,202,191,1,0,0,0,202,192,1,0,0,0,202,
        193,1,0,0,0,202,194,1,0,0,0,202,195,1,0,0,0,202,196,1,0,0,0,202,
        197,1,0,0,0,202,198,1,0,0,0,202,199,1,0,0,0,202,200,1,0,0,0,202,
        201,1,0,0,0,203,5,1,0,0,0,204,206,5,136,0,0,205,204,1,0,0,0,206,
        209,1,0,0,0,207,205,1,0,0,0,207,208,1,0,0,0,208,213,1,0,0,0,209,
        207,1,0,0,0,210,212,3,8,4,0,211,210,1,0,0,0,212,215,1,0,0,0,213,
        211,1,0,0,0,213,214,1,0,0,0,214,7,1,0,0,0,215,213,1,0,0,0,216,217,
        5,1,0,0,217,222,3,10,5,0,218,219,5,2,0,0,219,221,3,10,5,0,220,218,
        1,0,0,0,221,224,1,0,0,0,222,220,1,0,0,0,222,223,1,0,0,0,223,225,
        1,0,0,0,224,222,1,0,0,0,225,226,5,3,0,0,226,9,1,0,0,0,227,233,3,
        168,84,0,228,230,5,4,0,0,229,231,3,164,82,0,230,229,1,0,0,0,230,
        231,1,0,0,0,231,232,1,0,0,0,232,234,5,5,0,0,233,228,1,0,0,0,233,
        234,1,0,0,0,234,11,1,0,0,0,235,236,5,19,0,0,236,237,3,168,84,0,237,
        241,5,6,0,0,238,240,3,14,7,0,239,238,1,0,0,0,240,243,1,0,0,0,241,
        239,1,0,0,0,241,242,1,0,0,0,242,244,1,0,0,0,243,241,1,0,0,0,244,
        245,5,7,0,0,245,13,1,0,0,0,246,247,5,20,0,0,247,253,5,135,0,0,248,
        249,5,21,0,0,249,253,5,135,0,0,250,251,5,22,0,0,251,253,5,135,0,
        0,252,246,1,0,0,0,252,248,1,0,0,0,252,250,1,0,0,0,253,15,1,0,0,0,
        254,255,5,23,0,0,255,265,3,168,84,0,256,257,5,24,0,0,257,262,5,135,
        0,0,258,259,5,2,0,0,259,261,5,135,0,0,260,258,1,0,0,0,261,264,1,
        0,0,0,262,260,1,0,0,0,262,263,1,0,0,0,263,266,1,0,0,0,264,262,1,
        0,0,0,265,256,1,0,0,0,265,266,1,0,0,0,266,17,1,0,0,0,267,268,5,25,
        0,0,268,270,3,168,84,0,269,271,5,135,0,0,270,269,1,0,0,0,270,271,
        1,0,0,0,271,19,1,0,0,0,272,273,5,26,0,0,273,275,3,168,84,0,274,276,
        5,135,0,0,275,274,1,0,0,0,275,276,1,0,0,0,276,287,1,0,0,0,277,283,
        5,6,0,0,278,279,3,6,3,0,279,280,3,62,31,0,280,282,1,0,0,0,281,278,
        1,0,0,0,282,285,1,0,0,0,283,281,1,0,0,0,283,284,1,0,0,0,284,286,
        1,0,0,0,285,283,1,0,0,0,286,288,5,7,0,0,287,277,1,0,0,0,287,288,
        1,0,0,0,288,21,1,0,0,0,289,290,5,27,0,0,290,291,3,168,84,0,291,293,
        3,158,79,0,292,294,5,135,0,0,293,292,1,0,0,0,293,294,1,0,0,0,294,
        23,1,0,0,0,295,296,5,28,0,0,296,297,3,168,84,0,297,299,3,158,79,
        0,298,300,5,135,0,0,299,298,1,0,0,0,299,300,1,0,0,0,300,25,1,0,0,
        0,301,302,5,29,0,0,302,304,3,168,84,0,303,305,3,28,14,0,304,303,
        1,0,0,0,304,305,1,0,0,0,305,306,1,0,0,0,306,310,5,6,0,0,307,309,
        3,30,15,0,308,307,1,0,0,0,309,312,1,0,0,0,310,308,1,0,0,0,310,311,
        1,0,0,0,311,313,1,0,0,0,312,310,1,0,0,0,313,314,5,7,0,0,314,27,1,
        0,0,0,315,316,5,30,0,0,316,317,5,135,0,0,317,29,1,0,0,0,318,331,
        3,6,3,0,319,332,3,32,16,0,320,332,3,34,17,0,321,332,3,36,18,0,322,
        332,3,46,23,0,323,332,3,48,24,0,324,332,3,52,26,0,325,332,3,68,34,
        0,326,332,3,82,41,0,327,332,3,84,42,0,328,332,3,86,43,0,329,332,
        3,88,44,0,330,332,3,90,45,0,331,319,1,0,0,0,331,320,1,0,0,0,331,
        321,1,0,0,0,331,322,1,0,0,0,331,323,1,0,0,0,331,324,1,0,0,0,331,
        325,1,0,0,0,331,326,1,0,0,0,331,327,1,0,0,0,331,328,1,0,0,0,331,
        329,1,0,0,0,331,330,1,0,0,0,332,31,1,0,0,0,333,334,5,31,0,0,334,
        336,3,168,84,0,335,337,3,158,79,0,336,335,1,0,0,0,336,337,1,0,0,
        0,337,339,1,0,0,0,338,340,3,38,19,0,339,338,1,0,0,0,339,340,1,0,
        0,0,340,33,1,0,0,0,341,342,5,32,0,0,342,344,3,168,84,0,343,345,3,
        158,79,0,344,343,1,0,0,0,344,345,1,0,0,0,345,347,1,0,0,0,346,348,
        3,38,19,0,347,346,1,0,0,0,347,348,1,0,0,0,348,35,1,0,0,0,349,350,
        5,33,0,0,350,352,3,168,84,0,351,353,3,158,79,0,352,351,1,0,0,0,352,
        353,1,0,0,0,353,355,1,0,0,0,354,356,3,38,19,0,355,354,1,0,0,0,355,
        356,1,0,0,0,356,37,1,0,0,0,357,361,5,6,0,0,358,360,3,40,20,0,359,
        358,1,0,0,0,360,363,1,0,0,0,361,359,1,0,0,0,361,362,1,0,0,0,362,
        364,1,0,0,0,363,361,1,0,0,0,364,365,5,7,0,0,365,39,1,0,0,0,366,369,
        3,6,3,0,367,370,3,42,21,0,368,370,3,110,55,0,369,367,1,0,0,0,369,
        368,1,0,0,0,370,41,1,0,0,0,371,372,3,168,84,0,372,373,5,8,0,0,373,
        377,3,50,25,0,374,376,3,44,22,0,375,374,1,0,0,0,376,379,1,0,0,0,
        377,375,1,0,0,0,377,378,1,0,0,0,378,381,1,0,0,0,379,377,1,0,0,0,
        380,382,3,158,79,0,381,380,1,0,0,0,381,382,1,0,0,0,382,43,1,0,0,
        0,383,389,3,168,84,0,384,386,5,4,0,0,385,387,3,164,82,0,386,385,
        1,0,0,0,386,387,1,0,0,0,387,388,1,0,0,0,388,390,5,5,0,0,389,384,
        1,0,0,0,389,390,1,0,0,0,390,45,1,0,0,0,391,392,5,34,0,0,392,394,
        3,168,84,0,393,395,3,158,79,0,394,393,1,0,0,0,394,395,1,0,0,0,395,
        396,1,0,0,0,396,397,5,6,0,0,397,402,3,168,84,0,398,399,5,2,0,0,399,
        401,3,168,84,0,400,398,1,0,0,0,401,404,1,0,0,0,402,400,1,0,0,0,402,
        403,1,0,0,0,403,406,1,0,0,0,404,402,1,0,0,0,405,407,5,2,0,0,406,
        405,1,0,0,0,406,407,1,0,0,0,407,408,1,0,0,0,408,409,5,7,0,0,409,
        47,1,0,0,0,410,411,5,35,0,0,411,412,3,168,84,0,412,413,5,30,0,0,
        413,414,3,160,80,0,414,419,5,6,0,0,415,416,5,36,0,0,416,418,3,162,
        81,0,417,415,1,0,0,0,418,421,1,0,0,0,419,417,1,0,0,0,419,420,1,0,
        0,0,420,422,1,0,0,0,421,419,1,0,0,0,422,423,5,7,0,0,423,49,1,0,0,
        0,424,425,5,37,0,0,425,426,5,9,0,0,426,427,3,50,25,0,427,428,5,2,
        0,0,428,429,3,50,25,0,429,431,5,10,0,0,430,432,5,11,0,0,431,430,
        1,0,0,0,431,432,1,0,0,0,432,442,1,0,0,0,433,436,3,160,80,0,434,435,
        5,12,0,0,435,437,5,3,0,0,436,434,1,0,0,0,436,437,1,0,0,0,437,439,
        1,0,0,0,438,440,5,11,0,0,439,438,1,0,0,0,439,440,1,0,0,0,440,442,
        1,0,0,0,441,424,1,0,0,0,441,433,1,0,0,0,442,51,1,0,0,0,443,444,3,
        54,27,0,444,446,3,168,84,0,445,447,3,158,79,0,446,445,1,0,0,0,446,
        447,1,0,0,0,447,449,1,0,0,0,448,450,3,56,28,0,449,448,1,0,0,0,449,
        450,1,0,0,0,450,452,1,0,0,0,451,453,3,58,29,0,452,451,1,0,0,0,452,
        453,1,0,0,0,453,53,1,0,0,0,454,455,7,0,0,0,455,55,1,0,0,0,456,457,
        5,47,0,0,457,458,5,23,0,0,458,459,3,160,80,0,459,57,1,0,0,0,460,
        464,5,6,0,0,461,463,3,60,30,0,462,461,1,0,0,0,463,466,1,0,0,0,464,
        462,1,0,0,0,464,465,1,0,0,0,465,467,1,0,0,0,466,464,1,0,0,0,467,
        468,5,7,0,0,468,59,1,0,0,0,469,480,3,6,3,0,470,481,3,62,31,0,471,
        472,5,48,0,0,472,481,3,162,81,0,473,474,5,49,0,0,474,481,3,162,81,
        0,475,476,5,50,0,0,476,481,3,162,81,0,477,478,5,51,0,0,478,481,3,
        162,81,0,479,481,3,110,55,0,480,470,1,0,0,0,480,471,1,0,0,0,480,
        473,1,0,0,0,480,475,1,0,0,0,480,477,1,0,0,0,480,479,1,0,0,0,481,
        61,1,0,0,0,482,483,5,52,0,0,483,484,3,168,84,0,484,486,5,4,0,0,485,
        487,3,64,32,0,486,485,1,0,0,0,486,487,1,0,0,0,487,488,1,0,0,0,488,
        491,5,5,0,0,489,490,5,13,0,0,490,492,3,50,25,0,491,489,1,0,0,0,491,
        492,1,0,0,0,492,494,1,0,0,0,493,495,3,158,79,0,494,493,1,0,0,0,494,
        495,1,0,0,0,495,499,1,0,0,0,496,498,3,110,55,0,497,496,1,0,0,0,498,
        501,1,0,0,0,499,497,1,0,0,0,499,500,1,0,0,0,500,63,1,0,0,0,501,499,
        1,0,0,0,502,507,3,66,33,0,503,504,5,2,0,0,504,506,3,66,33,0,505,
        503,1,0,0,0,506,509,1,0,0,0,507,505,1,0,0,0,507,508,1,0,0,0,508,
        65,1,0,0,0,509,507,1,0,0,0,510,511,3,168,84,0,511,512,5,8,0,0,512,
        513,3,50,25,0,513,67,1,0,0,0,514,515,5,53,0,0,515,516,3,168,84,0,
        516,519,3,70,35,0,517,518,5,54,0,0,518,520,5,135,0,0,519,517,1,0,
        0,0,519,520,1,0,0,0,520,521,1,0,0,0,521,527,5,6,0,0,522,523,3,6,
        3,0,523,524,3,72,36,0,524,526,1,0,0,0,525,522,1,0,0,0,526,529,1,
        0,0,0,527,525,1,0,0,0,527,528,1,0,0,0,528,530,1,0,0,0,529,527,1,
        0,0,0,530,531,5,7,0,0,531,69,1,0,0,0,532,533,7,1,0,0,533,71,1,0,
        0,0,534,536,5,59,0,0,535,537,3,168,84,0,536,535,1,0,0,0,536,537,
        1,0,0,0,537,538,1,0,0,0,538,539,3,74,37,0,539,540,5,14,0,0,540,542,
        3,160,80,0,541,543,3,76,38,0,542,541,1,0,0,0,542,543,1,0,0,0,543,
        73,1,0,0,0,544,545,5,131,0,0,545,549,5,135,0,0,546,547,7,2,0,0,547,
        549,5,135,0,0,548,544,1,0,0,0,548,546,1,0,0,0,549,75,1,0,0,0,550,
        554,5,6,0,0,551,553,3,78,39,0,552,551,1,0,0,0,553,556,1,0,0,0,554,
        552,1,0,0,0,554,555,1,0,0,0,555,557,1,0,0,0,556,554,1,0,0,0,557,
        558,5,7,0,0,558,77,1,0,0,0,559,560,5,65,0,0,560,594,3,50,25,0,561,
        562,5,66,0,0,562,563,3,168,84,0,563,564,5,8,0,0,564,567,3,50,25,
        0,565,566,5,47,0,0,566,568,3,80,40,0,567,565,1,0,0,0,567,568,1,0,
        0,0,568,594,1,0,0,0,569,570,5,67,0,0,570,572,5,134,0,0,571,573,3,
        50,25,0,572,571,1,0,0,0,572,573,1,0,0,0,573,594,1,0,0,0,574,575,
        5,68,0,0,575,588,3,168,84,0,576,577,5,69,0,0,577,578,5,12,0,0,578,
        583,3,168,84,0,579,580,5,2,0,0,580,582,3,168,84,0,581,579,1,0,0,
        0,582,585,1,0,0,0,583,581,1,0,0,0,583,584,1,0,0,0,584,586,1,0,0,
        0,585,583,1,0,0,0,586,587,5,3,0,0,587,589,1,0,0,0,588,576,1,0,0,
        0,588,589,1,0,0,0,589,594,1,0,0,0,590,591,5,70,0,0,591,594,5,135,
        0,0,592,594,3,110,55,0,593,559,1,0,0,0,593,561,1,0,0,0,593,569,1,
        0,0,0,593,574,1,0,0,0,593,590,1,0,0,0,593,592,1,0,0,0,594,79,1,0,
        0,0,595,599,5,71,0,0,596,599,5,60,0,0,597,599,3,168,84,0,598,595,
        1,0,0,0,598,596,1,0,0,0,598,597,1,0,0,0,599,81,1,0,0,0,600,601,5,
        72,0,0,601,602,3,168,84,0,602,603,5,73,0,0,603,605,3,168,84,0,604,
        606,3,158,79,0,605,604,1,0,0,0,605,606,1,0,0,0,606,83,1,0,0,0,607,
        608,5,74,0,0,608,611,3,168,84,0,609,610,5,75,0,0,610,612,3,160,80,
        0,611,609,1,0,0,0,611,612,1,0,0,0,612,614,1,0,0,0,613,615,3,158,
        79,0,614,613,1,0,0,0,614,615,1,0,0,0,615,617,1,0,0,0,616,618,3,38,
        19,0,617,616,1,0,0,0,617,618,1,0,0,0,618,85,1,0,0,0,619,620,5,76,
        0,0,620,621,3,160,80,0,621,622,5,14,0,0,622,626,3,160,80,0,623,625,
        3,110,55,0,624,623,1,0,0,0,625,628,1,0,0,0,626,624,1,0,0,0,626,627,
        1,0,0,0,627,87,1,0,0,0,628,626,1,0,0,0,629,630,5,77,0,0,630,631,
        3,168,84,0,631,632,5,78,0,0,632,633,5,135,0,0,633,634,5,14,0,0,634,
        638,3,160,80,0,635,637,3,110,55,0,636,635,1,0,0,0,637,640,1,0,0,
        0,638,636,1,0,0,0,638,639,1,0,0,0,639,89,1,0,0,0,640,638,1,0,0,0,
        641,642,5,79,0,0,642,643,3,168,84,0,643,644,3,92,46,0,644,91,1,0,
        0,0,645,649,5,6,0,0,646,648,3,94,47,0,647,646,1,0,0,0,648,651,1,
        0,0,0,649,647,1,0,0,0,649,650,1,0,0,0,650,652,1,0,0,0,651,649,1,
        0,0,0,652,653,5,7,0,0,653,93,1,0,0,0,654,655,3,6,3,0,655,656,3,96,
        48,0,656,95,1,0,0,0,657,706,3,110,55,0,658,659,5,80,0,0,659,706,
        3,160,80,0,660,661,5,25,0,0,661,706,3,160,80,0,662,665,5,81,0,0,
        663,666,5,49,0,0,664,666,3,168,84,0,665,663,1,0,0,0,665,664,1,0,
        0,0,666,706,1,0,0,0,667,668,5,82,0,0,668,669,3,168,84,0,669,670,
        5,8,0,0,670,671,3,100,50,0,671,706,1,0,0,0,672,706,3,102,51,0,673,
        674,5,83,0,0,674,675,5,135,0,0,675,681,3,92,46,0,676,679,5,84,0,
        0,677,680,3,98,49,0,678,680,3,92,46,0,679,677,1,0,0,0,679,678,1,
        0,0,0,680,682,1,0,0,0,681,676,1,0,0,0,681,682,1,0,0,0,682,706,1,
        0,0,0,683,684,5,85,0,0,684,706,3,92,46,0,685,686,5,86,0,0,686,687,
        5,135,0,0,687,706,3,92,46,0,688,689,5,87,0,0,689,692,3,160,80,0,
        690,691,5,88,0,0,691,693,5,135,0,0,692,690,1,0,0,0,692,693,1,0,0,
        0,693,706,1,0,0,0,694,696,5,89,0,0,695,697,5,134,0,0,696,695,1,0,
        0,0,696,697,1,0,0,0,697,699,1,0,0,0,698,700,5,135,0,0,699,698,1,
        0,0,0,699,700,1,0,0,0,700,706,1,0,0,0,701,703,5,90,0,0,702,704,3,
        50,25,0,703,702,1,0,0,0,703,704,1,0,0,0,704,706,1,0,0,0,705,657,
        1,0,0,0,705,658,1,0,0,0,705,660,1,0,0,0,705,662,1,0,0,0,705,667,
        1,0,0,0,705,672,1,0,0,0,705,673,1,0,0,0,705,683,1,0,0,0,705,685,
        1,0,0,0,705,688,1,0,0,0,705,694,1,0,0,0,705,701,1,0,0,0,706,97,1,
        0,0,0,707,708,5,83,0,0,708,709,5,135,0,0,709,715,3,92,46,0,710,713,
        5,84,0,0,711,714,3,98,49,0,712,714,3,92,46,0,713,711,1,0,0,0,713,
        712,1,0,0,0,714,716,1,0,0,0,715,710,1,0,0,0,715,716,1,0,0,0,716,
        99,1,0,0,0,717,721,3,102,51,0,718,721,3,160,80,0,719,721,5,135,0,
        0,720,717,1,0,0,0,720,718,1,0,0,0,720,719,1,0,0,0,721,101,1,0,0,
        0,722,723,5,91,0,0,723,724,3,160,80,0,724,103,1,0,0,0,725,726,5,
        92,0,0,726,727,3,168,84,0,727,728,5,73,0,0,728,731,3,168,84,0,729,
        730,5,93,0,0,730,732,3,168,84,0,731,729,1,0,0,0,731,732,1,0,0,0,
        732,734,1,0,0,0,733,735,3,28,14,0,734,733,1,0,0,0,734,735,1,0,0,
        0,735,744,1,0,0,0,736,740,5,6,0,0,737,739,3,106,53,0,738,737,1,0,
        0,0,739,742,1,0,0,0,740,738,1,0,0,0,740,741,1,0,0,0,741,743,1,0,
        0,0,742,740,1,0,0,0,743,745,5,7,0,0,744,736,1,0,0,0,744,745,1,0,
        0,0,745,105,1,0,0,0,746,751,3,6,3,0,747,748,5,36,0,0,748,752,3,162,
        81,0,749,752,3,108,54,0,750,752,3,52,26,0,751,747,1,0,0,0,751,749,
        1,0,0,0,751,750,1,0,0,0,752,107,1,0,0,0,753,754,5,94,0,0,754,755,
        5,135,0,0,755,756,5,14,0,0,756,759,3,160,80,0,757,758,5,43,0,0,758,
        760,3,160,80,0,759,757,1,0,0,0,759,760,1,0,0,0,760,109,1,0,0,0,761,
        762,7,3,0,0,762,767,3,112,56,0,763,764,5,2,0,0,764,766,3,112,56,
        0,765,763,1,0,0,0,766,769,1,0,0,0,767,765,1,0,0,0,767,768,1,0,0,
        0,768,111,1,0,0,0,769,767,1,0,0,0,770,773,5,135,0,0,771,773,3,160,
        80,0,772,770,1,0,0,0,772,771,1,0,0,0,773,113,1,0,0,0,774,775,5,97,
        0,0,775,778,3,168,84,0,776,777,5,98,0,0,777,779,3,168,84,0,778,776,
        1,0,0,0,778,779,1,0,0,0,779,782,1,0,0,0,780,781,5,99,0,0,781,783,
        5,135,0,0,782,780,1,0,0,0,782,783,1,0,0,0,783,788,1,0,0,0,784,785,
        5,100,0,0,785,786,3,168,84,0,786,787,5,135,0,0,787,789,1,0,0,0,788,
        784,1,0,0,0,788,789,1,0,0,0,789,790,1,0,0,0,790,794,5,6,0,0,791,
        793,3,116,58,0,792,791,1,0,0,0,793,796,1,0,0,0,794,792,1,0,0,0,794,
        795,1,0,0,0,795,797,1,0,0,0,796,794,1,0,0,0,797,798,5,7,0,0,798,
        115,1,0,0,0,799,803,3,6,3,0,800,804,3,118,59,0,801,804,3,130,65,
        0,802,804,3,122,61,0,803,800,1,0,0,0,803,801,1,0,0,0,803,802,1,0,
        0,0,804,117,1,0,0,0,805,806,3,120,60,0,806,809,3,168,84,0,807,808,
        5,8,0,0,808,810,3,124,62,0,809,807,1,0,0,0,809,810,1,0,0,0,810,812,
        1,0,0,0,811,813,3,158,79,0,812,811,1,0,0,0,812,813,1,0,0,0,813,814,
        1,0,0,0,814,818,5,6,0,0,815,817,3,116,58,0,816,815,1,0,0,0,817,820,
        1,0,0,0,818,816,1,0,0,0,818,819,1,0,0,0,819,821,1,0,0,0,820,818,
        1,0,0,0,821,822,5,7,0,0,822,119,1,0,0,0,823,824,7,4,0,0,824,121,
        1,0,0,0,825,826,3,168,84,0,826,827,5,8,0,0,827,831,3,124,62,0,828,
        830,3,126,63,0,829,828,1,0,0,0,830,833,1,0,0,0,831,829,1,0,0,0,831,
        832,1,0,0,0,832,835,1,0,0,0,833,831,1,0,0,0,834,836,3,158,79,0,835,
        834,1,0,0,0,835,836,1,0,0,0,836,845,1,0,0,0,837,841,5,6,0,0,838,
        840,3,128,64,0,839,838,1,0,0,0,840,843,1,0,0,0,841,839,1,0,0,0,841,
        842,1,0,0,0,842,844,1,0,0,0,843,841,1,0,0,0,844,846,5,7,0,0,845,
        837,1,0,0,0,845,846,1,0,0,0,846,123,1,0,0,0,847,848,3,160,80,0,848,
        125,1,0,0,0,849,850,5,105,0,0,850,858,3,160,80,0,851,852,5,106,0,
        0,852,858,3,162,81,0,853,854,5,107,0,0,854,858,3,162,81,0,855,856,
        5,108,0,0,856,858,5,134,0,0,857,849,1,0,0,0,857,851,1,0,0,0,857,
        853,1,0,0,0,857,855,1,0,0,0,858,127,1,0,0,0,859,860,3,168,84,0,860,
        861,5,15,0,0,861,862,3,166,83,0,862,129,1,0,0,0,863,866,3,160,80,
        0,864,865,5,13,0,0,865,867,3,160,80,0,866,864,1,0,0,0,867,868,1,
        0,0,0,868,866,1,0,0,0,868,869,1,0,0,0,869,871,1,0,0,0,870,872,5,
        135,0,0,871,870,1,0,0,0,871,872,1,0,0,0,872,131,1,0,0,0,873,874,
        5,109,0,0,874,877,3,168,84,0,875,876,5,110,0,0,876,878,3,168,84,
        0,877,875,1,0,0,0,877,878,1,0,0,0,878,879,1,0,0,0,879,883,5,6,0,
        0,880,882,3,134,67,0,881,880,1,0,0,0,882,885,1,0,0,0,883,881,1,0,
        0,0,883,884,1,0,0,0,884,886,1,0,0,0,885,883,1,0,0,0,886,887,5,7,
        0,0,887,133,1,0,0,0,888,889,3,136,68,0,889,890,3,138,69,0,890,892,
        3,140,70,0,891,893,3,146,73,0,892,891,1,0,0,0,892,893,1,0,0,0,893,
        135,1,0,0,0,894,895,5,111,0,0,895,901,3,148,74,0,896,897,5,112,0,
        0,897,898,3,168,84,0,898,899,5,15,0,0,899,900,3,166,83,0,900,902,
        1,0,0,0,901,896,1,0,0,0,901,902,1,0,0,0,902,907,1,0,0,0,903,904,
        3,148,74,0,904,905,3,160,80,0,905,907,1,0,0,0,906,894,1,0,0,0,906,
        903,1,0,0,0,907,137,1,0,0,0,908,910,5,113,0,0,909,911,5,114,0,0,
        910,909,1,0,0,0,910,911,1,0,0,0,911,914,1,0,0,0,912,914,5,115,0,
        0,913,908,1,0,0,0,913,912,1,0,0,0,914,139,1,0,0,0,915,916,5,116,
        0,0,916,917,5,76,0,0,917,927,3,136,68,0,918,919,5,117,0,0,919,927,
        3,142,71,0,920,921,5,24,0,0,921,927,5,135,0,0,922,923,5,118,0,0,
        923,924,5,47,0,0,924,925,5,23,0,0,925,927,3,160,80,0,926,915,1,0,
        0,0,926,918,1,0,0,0,926,920,1,0,0,0,926,922,1,0,0,0,927,141,1,0,
        0,0,928,934,5,95,0,0,929,934,5,96,0,0,930,934,5,21,0,0,931,934,3,
        144,72,0,932,934,3,168,84,0,933,928,1,0,0,0,933,929,1,0,0,0,933,
        930,1,0,0,0,933,931,1,0,0,0,933,932,1,0,0,0,934,143,1,0,0,0,935,
        936,5,129,0,0,936,145,1,0,0,0,937,938,5,119,0,0,938,939,5,75,0,0,
        939,940,3,148,74,0,940,147,1,0,0,0,941,942,7,5,0,0,942,149,1,0,0,
        0,943,944,5,120,0,0,944,945,3,168,84,0,945,946,5,73,0,0,946,949,
        3,152,76,0,947,948,5,121,0,0,948,950,3,160,80,0,949,947,1,0,0,0,
        949,950,1,0,0,0,950,953,1,0,0,0,951,952,5,122,0,0,952,954,3,168,
        84,0,953,951,1,0,0,0,953,954,1,0,0,0,954,963,1,0,0,0,955,959,5,6,
        0,0,956,958,3,154,77,0,957,956,1,0,0,0,958,961,1,0,0,0,959,957,1,
        0,0,0,959,960,1,0,0,0,960,962,1,0,0,0,961,959,1,0,0,0,962,964,5,
        7,0,0,963,955,1,0,0,0,963,964,1,0,0,0,964,151,1,0,0,0,965,968,3,
        168,84,0,966,967,5,16,0,0,967,969,3,168,84,0,968,966,1,0,0,0,968,
        969,1,0,0,0,969,153,1,0,0,0,970,971,5,123,0,0,971,993,5,135,0,0,
        972,973,5,124,0,0,973,978,3,156,78,0,974,975,5,2,0,0,975,977,3,156,
        78,0,976,974,1,0,0,0,977,980,1,0,0,0,978,976,1,0,0,0,978,979,1,0,
        0,0,979,993,1,0,0,0,980,978,1,0,0,0,981,982,5,125,0,0,982,987,3,
        156,78,0,983,984,5,2,0,0,984,986,3,156,78,0,985,983,1,0,0,0,986,
        989,1,0,0,0,987,985,1,0,0,0,987,988,1,0,0,0,988,993,1,0,0,0,989,
        987,1,0,0,0,990,991,5,126,0,0,991,993,3,168,84,0,992,970,1,0,0,0,
        992,972,1,0,0,0,992,981,1,0,0,0,992,990,1,0,0,0,993,155,1,0,0,0,
        994,1003,5,17,0,0,995,996,5,111,0,0,996,1003,3,148,74,0,997,1000,
        3,160,80,0,998,999,5,16,0,0,999,1001,5,17,0,0,1000,998,1,0,0,0,1000,
        1001,1,0,0,0,1001,1003,1,0,0,0,1002,994,1,0,0,0,1002,995,1,0,0,0,
        1002,997,1,0,0,0,1003,157,1,0,0,0,1004,1005,5,18,0,0,1005,1006,5,
        135,0,0,1006,159,1,0,0,0,1007,1012,3,168,84,0,1008,1009,5,16,0,0,
        1009,1011,3,168,84,0,1010,1008,1,0,0,0,1011,1014,1,0,0,0,1012,1010,
        1,0,0,0,1012,1013,1,0,0,0,1013,161,1,0,0,0,1014,1012,1,0,0,0,1015,
        1020,3,160,80,0,1016,1017,5,2,0,0,1017,1019,3,160,80,0,1018,1016,
        1,0,0,0,1019,1022,1,0,0,0,1020,1018,1,0,0,0,1020,1021,1,0,0,0,1021,
        163,1,0,0,0,1022,1020,1,0,0,0,1023,1028,3,166,83,0,1024,1025,5,2,
        0,0,1025,1027,3,166,83,0,1026,1024,1,0,0,0,1027,1030,1,0,0,0,1028,
        1026,1,0,0,0,1028,1029,1,0,0,0,1029,165,1,0,0,0,1030,1028,1,0,0,
        0,1031,1036,5,135,0,0,1032,1036,5,134,0,0,1033,1036,5,132,0,0,1034,
        1036,3,168,84,0,1035,1031,1,0,0,0,1035,1032,1,0,0,0,1035,1033,1,
        0,0,0,1035,1034,1,0,0,0,1036,167,1,0,0,0,1037,1038,7,6,0,0,1038,
        169,1,0,0,0,128,173,179,188,202,207,213,222,230,233,241,252,262,
        265,270,275,283,287,293,299,304,310,331,336,339,344,347,352,355,
        361,369,377,381,386,389,394,402,406,419,431,436,439,441,446,449,
        452,464,480,486,491,494,499,507,519,527,536,542,548,554,567,572,
        583,588,593,598,605,611,614,617,626,638,649,665,679,681,692,696,
        699,703,705,713,715,720,731,734,740,744,751,759,767,772,778,782,
        788,794,803,809,812,818,831,835,841,845,857,868,871,877,883,892,
        901,906,910,913,926,933,949,953,959,963,968,978,987,992,1000,1002,
        1012,1020,1028,1035
    ];

    private static __ATN: antlr.ATN;
    public static get _ATN(): antlr.ATN {
        if (!PlantaParser.__ATN) {
            PlantaParser.__ATN = new antlr.ATNDeserializer().deserialize(PlantaParser._serializedATN);
        }

        return PlantaParser.__ATN;
    }


    private static readonly vocabulary = new antlr.Vocabulary(PlantaParser.literalNames, PlantaParser.symbolicNames, []);

    public override get vocabulary(): antlr.Vocabulary {
        return PlantaParser.vocabulary;
    }

    private static readonly decisionsToDFA = PlantaParser._ATN.decisionToState.map( (ds: antlr.DecisionState, index: number) => new antlr.DFA(ds, index) );
}

export class FileContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EOF(): antlr.TerminalNode {
        return this.getToken(PlantaParser.EOF, 0)!;
    }
    public useDecl(): UseDeclContext[];
    public useDecl(i: number): UseDeclContext | null;
    public useDecl(i?: number): UseDeclContext[] | UseDeclContext | null {
        if (i === undefined) {
            return this.getRuleContexts(UseDeclContext);
        }

        return this.getRuleContext(i, UseDeclContext);
    }
    public topDecl(): TopDeclContext[];
    public topDecl(i: number): TopDeclContext | null;
    public topDecl(i?: number): TopDeclContext[] | TopDeclContext | null {
        if (i === undefined) {
            return this.getRuleContexts(TopDeclContext);
        }

        return this.getRuleContext(i, TopDeclContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_file;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterFile) {
             listener.enterFile(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitFile) {
             listener.exitFile(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitFile) {
            return visitor.visitFile(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class UseDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public USE(): antlr.TerminalNode {
        return this.getToken(PlantaParser.USE, 0)!;
    }
    public qualifiedName(): QualifiedNameContext {
        return this.getRuleContext(0, QualifiedNameContext)!;
    }
    public AS(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.AS, 0);
    }
    public name(): NameContext | null {
        return this.getRuleContext(0, NameContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_useDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterUseDecl) {
             listener.enterUseDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitUseDecl) {
             listener.exitUseDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitUseDecl) {
            return visitor.visitUseDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TopDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public meta(): MetaContext {
        return this.getRuleContext(0, MetaContext)!;
    }
    public systemDecl(): SystemDeclContext | null {
        return this.getRuleContext(0, SystemDeclContext);
    }
    public layerDecl(): LayerDeclContext | null {
        return this.getRuleContext(0, LayerDeclContext);
    }
    public actorDecl(): ActorDeclContext | null {
        return this.getRuleContext(0, ActorDeclContext);
    }
    public externalDecl(): ExternalDeclContext | null {
        return this.getRuleContext(0, ExternalDeclContext);
    }
    public contextDecl(): ContextDeclContext | null {
        return this.getRuleContext(0, ContextDeclContext);
    }
    public appDecl(): AppDeclContext | null {
        return this.getRuleContext(0, AppDeclContext);
    }
    public requirementDecl(): RequirementDeclContext | null {
        return this.getRuleContext(0, RequirementDeclContext);
    }
    public decisionDecl(): DecisionDeclContext | null {
        return this.getRuleContext(0, DecisionDeclContext);
    }
    public deploymentDecl(): DeploymentDeclContext | null {
        return this.getRuleContext(0, DeploymentDeclContext);
    }
    public ruleDecl(): RuleDeclContext | null {
        return this.getRuleContext(0, RuleDeclContext);
    }
    public viewDecl(): ViewDeclContext | null {
        return this.getRuleContext(0, ViewDeclContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_topDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterTopDecl) {
             listener.enterTopDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitTopDecl) {
             listener.exitTopDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitTopDecl) {
            return visitor.visitTopDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class MetaContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public DOC_COMMENT(): antlr.TerminalNode[];
    public DOC_COMMENT(i: number): antlr.TerminalNode | null;
    public DOC_COMMENT(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PlantaParser.DOC_COMMENT);
    	} else {
    		return this.getToken(PlantaParser.DOC_COMMENT, i);
    	}
    }
    public annotation(): AnnotationContext[];
    public annotation(i: number): AnnotationContext | null;
    public annotation(i?: number): AnnotationContext[] | AnnotationContext | null {
        if (i === undefined) {
            return this.getRuleContexts(AnnotationContext);
        }

        return this.getRuleContext(i, AnnotationContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_meta;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterMeta) {
             listener.enterMeta(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitMeta) {
             listener.exitMeta(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitMeta) {
            return visitor.visitMeta(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class AnnotationContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public annotationItem(): AnnotationItemContext[];
    public annotationItem(i: number): AnnotationItemContext | null;
    public annotationItem(i?: number): AnnotationItemContext[] | AnnotationItemContext | null {
        if (i === undefined) {
            return this.getRuleContexts(AnnotationItemContext);
        }

        return this.getRuleContext(i, AnnotationItemContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_annotation;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterAnnotation) {
             listener.enterAnnotation(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitAnnotation) {
             listener.exitAnnotation(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitAnnotation) {
            return visitor.visitAnnotation(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class AnnotationItemContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public name(): NameContext {
        return this.getRuleContext(0, NameContext)!;
    }
    public literalList(): LiteralListContext | null {
        return this.getRuleContext(0, LiteralListContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_annotationItem;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterAnnotationItem) {
             listener.enterAnnotationItem(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitAnnotationItem) {
             listener.exitAnnotationItem(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitAnnotationItem) {
            return visitor.visitAnnotationItem(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SystemDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public SYSTEM(): antlr.TerminalNode {
        return this.getToken(PlantaParser.SYSTEM, 0)!;
    }
    public name(): NameContext {
        return this.getRuleContext(0, NameContext)!;
    }
    public systemItem(): SystemItemContext[];
    public systemItem(i: number): SystemItemContext | null;
    public systemItem(i?: number): SystemItemContext[] | SystemItemContext | null {
        if (i === undefined) {
            return this.getRuleContexts(SystemItemContext);
        }

        return this.getRuleContext(i, SystemItemContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_systemDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterSystemDecl) {
             listener.enterSystemDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitSystemDecl) {
             listener.exitSystemDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitSystemDecl) {
            return visitor.visitSystemDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SystemItemContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public DESCRIPTION(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.DESCRIPTION, 0);
    }
    public STRING(): antlr.TerminalNode {
        return this.getToken(PlantaParser.STRING, 0)!;
    }
    public OWNER(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.OWNER, 0);
    }
    public VERSION(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.VERSION, 0);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_systemItem;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterSystemItem) {
             listener.enterSystemItem(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitSystemItem) {
             listener.exitSystemItem(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitSystemItem) {
            return visitor.visitSystemItem(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class LayerDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LAYER(): antlr.TerminalNode {
        return this.getToken(PlantaParser.LAYER, 0)!;
    }
    public name(): NameContext {
        return this.getRuleContext(0, NameContext)!;
    }
    public MATCH(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.MATCH, 0);
    }
    public STRING(): antlr.TerminalNode[];
    public STRING(i: number): antlr.TerminalNode | null;
    public STRING(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PlantaParser.STRING);
    	} else {
    		return this.getToken(PlantaParser.STRING, i);
    	}
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_layerDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterLayerDecl) {
             listener.enterLayerDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitLayerDecl) {
             listener.exitLayerDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitLayerDecl) {
            return visitor.visitLayerDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ActorDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ACTOR(): antlr.TerminalNode {
        return this.getToken(PlantaParser.ACTOR, 0)!;
    }
    public name(): NameContext {
        return this.getRuleContext(0, NameContext)!;
    }
    public STRING(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.STRING, 0);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_actorDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterActorDecl) {
             listener.enterActorDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitActorDecl) {
             listener.exitActorDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitActorDecl) {
            return visitor.visitActorDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ExternalDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EXTERNAL(): antlr.TerminalNode {
        return this.getToken(PlantaParser.EXTERNAL, 0)!;
    }
    public name(): NameContext {
        return this.getRuleContext(0, NameContext)!;
    }
    public STRING(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.STRING, 0);
    }
    public meta(): MetaContext[];
    public meta(i: number): MetaContext | null;
    public meta(i?: number): MetaContext[] | MetaContext | null {
        if (i === undefined) {
            return this.getRuleContexts(MetaContext);
        }

        return this.getRuleContext(i, MetaContext);
    }
    public opDecl(): OpDeclContext[];
    public opDecl(i: number): OpDeclContext | null;
    public opDecl(i?: number): OpDeclContext[] | OpDeclContext | null {
        if (i === undefined) {
            return this.getRuleContexts(OpDeclContext);
        }

        return this.getRuleContext(i, OpDeclContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_externalDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterExternalDecl) {
             listener.enterExternalDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitExternalDecl) {
             listener.exitExternalDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitExternalDecl) {
            return visitor.visitExternalDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class RequirementDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public REQUIREMENT(): antlr.TerminalNode {
        return this.getToken(PlantaParser.REQUIREMENT, 0)!;
    }
    public name(): NameContext {
        return this.getRuleContext(0, NameContext)!;
    }
    public anchor(): AnchorContext {
        return this.getRuleContext(0, AnchorContext)!;
    }
    public STRING(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.STRING, 0);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_requirementDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterRequirementDecl) {
             listener.enterRequirementDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitRequirementDecl) {
             listener.exitRequirementDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitRequirementDecl) {
            return visitor.visitRequirementDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DecisionDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public DECISION(): antlr.TerminalNode {
        return this.getToken(PlantaParser.DECISION, 0)!;
    }
    public name(): NameContext {
        return this.getRuleContext(0, NameContext)!;
    }
    public anchor(): AnchorContext {
        return this.getRuleContext(0, AnchorContext)!;
    }
    public STRING(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.STRING, 0);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_decisionDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterDecisionDecl) {
             listener.enterDecisionDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitDecisionDecl) {
             listener.exitDecisionDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitDecisionDecl) {
            return visitor.visitDecisionDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ContextDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public CONTEXT(): antlr.TerminalNode {
        return this.getToken(PlantaParser.CONTEXT, 0)!;
    }
    public name(): NameContext {
        return this.getRuleContext(0, NameContext)!;
    }
    public rootClause(): RootClauseContext | null {
        return this.getRuleContext(0, RootClauseContext);
    }
    public contextMember(): ContextMemberContext[];
    public contextMember(i: number): ContextMemberContext | null;
    public contextMember(i?: number): ContextMemberContext[] | ContextMemberContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ContextMemberContext);
        }

        return this.getRuleContext(i, ContextMemberContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_contextDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterContextDecl) {
             listener.enterContextDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitContextDecl) {
             listener.exitContextDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitContextDecl) {
            return visitor.visitContextDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class RootClauseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ROOT(): antlr.TerminalNode {
        return this.getToken(PlantaParser.ROOT, 0)!;
    }
    public STRING(): antlr.TerminalNode {
        return this.getToken(PlantaParser.STRING, 0)!;
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_rootClause;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterRootClause) {
             listener.enterRootClause(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitRootClause) {
             listener.exitRootClause(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitRootClause) {
            return visitor.visitRootClause(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ContextMemberContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public meta(): MetaContext {
        return this.getRuleContext(0, MetaContext)!;
    }
    public entityDecl(): EntityDeclContext | null {
        return this.getRuleContext(0, EntityDeclContext);
    }
    public valueDecl(): ValueDeclContext | null {
        return this.getRuleContext(0, ValueDeclContext);
    }
    public dtoDecl(): DtoDeclContext | null {
        return this.getRuleContext(0, DtoDeclContext);
    }
    public enumDecl(): EnumDeclContext | null {
        return this.getRuleContext(0, EnumDeclContext);
    }
    public aggregateDecl(): AggregateDeclContext | null {
        return this.getRuleContext(0, AggregateDeclContext);
    }
    public componentDecl(): ComponentDeclContext | null {
        return this.getRuleContext(0, ComponentDeclContext);
    }
    public apiDecl(): ApiDeclContext | null {
        return this.getRuleContext(0, ApiDeclContext);
    }
    public channelDecl(): ChannelDeclContext | null {
        return this.getRuleContext(0, ChannelDeclContext);
    }
    public eventDecl(): EventDeclContext | null {
        return this.getRuleContext(0, EventDeclContext);
    }
    public handlerDecl(): HandlerDeclContext | null {
        return this.getRuleContext(0, HandlerDeclContext);
    }
    public jobDecl(): JobDeclContext | null {
        return this.getRuleContext(0, JobDeclContext);
    }
    public processDecl(): ProcessDeclContext | null {
        return this.getRuleContext(0, ProcessDeclContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_contextMember;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterContextMember) {
             listener.enterContextMember(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitContextMember) {
             listener.exitContextMember(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitContextMember) {
            return visitor.visitContextMember(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class EntityDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ENTITY(): antlr.TerminalNode {
        return this.getToken(PlantaParser.ENTITY, 0)!;
    }
    public name(): NameContext {
        return this.getRuleContext(0, NameContext)!;
    }
    public anchor(): AnchorContext | null {
        return this.getRuleContext(0, AnchorContext);
    }
    public fieldBlock(): FieldBlockContext | null {
        return this.getRuleContext(0, FieldBlockContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_entityDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterEntityDecl) {
             listener.enterEntityDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitEntityDecl) {
             listener.exitEntityDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitEntityDecl) {
            return visitor.visitEntityDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ValueDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public VALUE(): antlr.TerminalNode {
        return this.getToken(PlantaParser.VALUE, 0)!;
    }
    public name(): NameContext {
        return this.getRuleContext(0, NameContext)!;
    }
    public anchor(): AnchorContext | null {
        return this.getRuleContext(0, AnchorContext);
    }
    public fieldBlock(): FieldBlockContext | null {
        return this.getRuleContext(0, FieldBlockContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_valueDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterValueDecl) {
             listener.enterValueDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitValueDecl) {
             listener.exitValueDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitValueDecl) {
            return visitor.visitValueDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DtoDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public DTO(): antlr.TerminalNode {
        return this.getToken(PlantaParser.DTO, 0)!;
    }
    public name(): NameContext {
        return this.getRuleContext(0, NameContext)!;
    }
    public anchor(): AnchorContext | null {
        return this.getRuleContext(0, AnchorContext);
    }
    public fieldBlock(): FieldBlockContext | null {
        return this.getRuleContext(0, FieldBlockContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_dtoDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterDtoDecl) {
             listener.enterDtoDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitDtoDecl) {
             listener.exitDtoDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitDtoDecl) {
            return visitor.visitDtoDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FieldBlockContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public fieldBlockItem(): FieldBlockItemContext[];
    public fieldBlockItem(i: number): FieldBlockItemContext | null;
    public fieldBlockItem(i?: number): FieldBlockItemContext[] | FieldBlockItemContext | null {
        if (i === undefined) {
            return this.getRuleContexts(FieldBlockItemContext);
        }

        return this.getRuleContext(i, FieldBlockItemContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_fieldBlock;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterFieldBlock) {
             listener.enterFieldBlock(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitFieldBlock) {
             listener.exitFieldBlock(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitFieldBlock) {
            return visitor.visitFieldBlock(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FieldBlockItemContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public meta(): MetaContext {
        return this.getRuleContext(0, MetaContext)!;
    }
    public fieldDecl(): FieldDeclContext | null {
        return this.getRuleContext(0, FieldDeclContext);
    }
    public traceClause(): TraceClauseContext | null {
        return this.getRuleContext(0, TraceClauseContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_fieldBlockItem;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterFieldBlockItem) {
             listener.enterFieldBlockItem(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitFieldBlockItem) {
             listener.exitFieldBlockItem(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitFieldBlockItem) {
            return visitor.visitFieldBlockItem(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FieldDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public name(): NameContext {
        return this.getRuleContext(0, NameContext)!;
    }
    public typeRef(): TypeRefContext {
        return this.getRuleContext(0, TypeRefContext)!;
    }
    public fieldModifier(): FieldModifierContext[];
    public fieldModifier(i: number): FieldModifierContext | null;
    public fieldModifier(i?: number): FieldModifierContext[] | FieldModifierContext | null {
        if (i === undefined) {
            return this.getRuleContexts(FieldModifierContext);
        }

        return this.getRuleContext(i, FieldModifierContext);
    }
    public anchor(): AnchorContext | null {
        return this.getRuleContext(0, AnchorContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_fieldDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterFieldDecl) {
             listener.enterFieldDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitFieldDecl) {
             listener.exitFieldDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitFieldDecl) {
            return visitor.visitFieldDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FieldModifierContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public name(): NameContext {
        return this.getRuleContext(0, NameContext)!;
    }
    public literalList(): LiteralListContext | null {
        return this.getRuleContext(0, LiteralListContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_fieldModifier;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterFieldModifier) {
             listener.enterFieldModifier(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitFieldModifier) {
             listener.exitFieldModifier(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitFieldModifier) {
            return visitor.visitFieldModifier(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class EnumDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ENUM(): antlr.TerminalNode {
        return this.getToken(PlantaParser.ENUM, 0)!;
    }
    public name(): NameContext[];
    public name(i: number): NameContext | null;
    public name(i?: number): NameContext[] | NameContext | null {
        if (i === undefined) {
            return this.getRuleContexts(NameContext);
        }

        return this.getRuleContext(i, NameContext);
    }
    public anchor(): AnchorContext | null {
        return this.getRuleContext(0, AnchorContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_enumDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterEnumDecl) {
             listener.enterEnumDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitEnumDecl) {
             listener.exitEnumDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitEnumDecl) {
            return visitor.visitEnumDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class AggregateDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public AGGREGATE(): antlr.TerminalNode {
        return this.getToken(PlantaParser.AGGREGATE, 0)!;
    }
    public name(): NameContext {
        return this.getRuleContext(0, NameContext)!;
    }
    public ROOT(): antlr.TerminalNode {
        return this.getToken(PlantaParser.ROOT, 0)!;
    }
    public qualifiedName(): QualifiedNameContext {
        return this.getRuleContext(0, QualifiedNameContext)!;
    }
    public CONTAINS(): antlr.TerminalNode[];
    public CONTAINS(i: number): antlr.TerminalNode | null;
    public CONTAINS(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PlantaParser.CONTAINS);
    	} else {
    		return this.getToken(PlantaParser.CONTAINS, i);
    	}
    }
    public qualifiedNameList(): QualifiedNameListContext[];
    public qualifiedNameList(i: number): QualifiedNameListContext | null;
    public qualifiedNameList(i?: number): QualifiedNameListContext[] | QualifiedNameListContext | null {
        if (i === undefined) {
            return this.getRuleContexts(QualifiedNameListContext);
        }

        return this.getRuleContext(i, QualifiedNameListContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_aggregateDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterAggregateDecl) {
             listener.enterAggregateDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitAggregateDecl) {
             listener.exitAggregateDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitAggregateDecl) {
            return visitor.visitAggregateDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TypeRefContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public MAP(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.MAP, 0);
    }
    public typeRef(): TypeRefContext[];
    public typeRef(i: number): TypeRefContext | null;
    public typeRef(i?: number): TypeRefContext[] | TypeRefContext | null {
        if (i === undefined) {
            return this.getRuleContexts(TypeRefContext);
        }

        return this.getRuleContext(i, TypeRefContext);
    }
    public qualifiedName(): QualifiedNameContext | null {
        return this.getRuleContext(0, QualifiedNameContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_typeRef;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterTypeRef) {
             listener.enterTypeRef(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitTypeRef) {
             listener.exitTypeRef(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitTypeRef) {
            return visitor.visitTypeRef(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ComponentDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public componentKind(): ComponentKindContext {
        return this.getRuleContext(0, ComponentKindContext)!;
    }
    public name(): NameContext {
        return this.getRuleContext(0, NameContext)!;
    }
    public anchor(): AnchorContext | null {
        return this.getRuleContext(0, AnchorContext);
    }
    public layerClause(): LayerClauseContext | null {
        return this.getRuleContext(0, LayerClauseContext);
    }
    public componentBody(): ComponentBodyContext | null {
        return this.getRuleContext(0, ComponentBodyContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_componentDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterComponentDecl) {
             listener.enterComponentDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitComponentDecl) {
             listener.exitComponentDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitComponentDecl) {
            return visitor.visitComponentDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ComponentKindContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public SERVICE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.SERVICE, 0);
    }
    public CONTROLLER(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.CONTROLLER, 0);
    }
    public REPOSITORY(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.REPOSITORY, 0);
    }
    public GATEWAY(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.GATEWAY, 0);
    }
    public MIDDLEWARE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.MIDDLEWARE, 0);
    }
    public GUARD(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.GUARD, 0);
    }
    public COMPONENT(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.COMPONENT, 0);
    }
    public PAGE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.PAGE, 0);
    }
    public STORE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.STORE, 0);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_componentKind;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterComponentKind) {
             listener.enterComponentKind(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitComponentKind) {
             listener.exitComponentKind(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitComponentKind) {
            return visitor.visitComponentKind(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class LayerClauseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public IN(): antlr.TerminalNode {
        return this.getToken(PlantaParser.IN, 0)!;
    }
    public LAYER(): antlr.TerminalNode {
        return this.getToken(PlantaParser.LAYER, 0)!;
    }
    public qualifiedName(): QualifiedNameContext {
        return this.getRuleContext(0, QualifiedNameContext)!;
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_layerClause;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterLayerClause) {
             listener.enterLayerClause(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitLayerClause) {
             listener.exitLayerClause(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitLayerClause) {
            return visitor.visitLayerClause(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ComponentBodyContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public componentItem(): ComponentItemContext[];
    public componentItem(i: number): ComponentItemContext | null;
    public componentItem(i?: number): ComponentItemContext[] | ComponentItemContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ComponentItemContext);
        }

        return this.getRuleContext(i, ComponentItemContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_componentBody;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterComponentBody) {
             listener.enterComponentBody(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitComponentBody) {
             listener.exitComponentBody(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitComponentBody) {
            return visitor.visitComponentBody(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ComponentItemContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public meta(): MetaContext {
        return this.getRuleContext(0, MetaContext)!;
    }
    public opDecl(): OpDeclContext | null {
        return this.getRuleContext(0, OpDeclContext);
    }
    public USES(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.USES, 0);
    }
    public qualifiedNameList(): QualifiedNameListContext | null {
        return this.getRuleContext(0, QualifiedNameListContext);
    }
    public CALLS(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.CALLS, 0);
    }
    public RENDERS(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.RENDERS, 0);
    }
    public IMPLEMENTS(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.IMPLEMENTS, 0);
    }
    public traceClause(): TraceClauseContext | null {
        return this.getRuleContext(0, TraceClauseContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_componentItem;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterComponentItem) {
             listener.enterComponentItem(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitComponentItem) {
             listener.exitComponentItem(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitComponentItem) {
            return visitor.visitComponentItem(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class OpDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public OP(): antlr.TerminalNode {
        return this.getToken(PlantaParser.OP, 0)!;
    }
    public name(): NameContext {
        return this.getRuleContext(0, NameContext)!;
    }
    public paramList(): ParamListContext | null {
        return this.getRuleContext(0, ParamListContext);
    }
    public typeRef(): TypeRefContext | null {
        return this.getRuleContext(0, TypeRefContext);
    }
    public anchor(): AnchorContext | null {
        return this.getRuleContext(0, AnchorContext);
    }
    public traceClause(): TraceClauseContext[];
    public traceClause(i: number): TraceClauseContext | null;
    public traceClause(i?: number): TraceClauseContext[] | TraceClauseContext | null {
        if (i === undefined) {
            return this.getRuleContexts(TraceClauseContext);
        }

        return this.getRuleContext(i, TraceClauseContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_opDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterOpDecl) {
             listener.enterOpDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitOpDecl) {
             listener.exitOpDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitOpDecl) {
            return visitor.visitOpDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ParamListContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public param(): ParamContext[];
    public param(i: number): ParamContext | null;
    public param(i?: number): ParamContext[] | ParamContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ParamContext);
        }

        return this.getRuleContext(i, ParamContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_paramList;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterParamList) {
             listener.enterParamList(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitParamList) {
             listener.exitParamList(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitParamList) {
            return visitor.visitParamList(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ParamContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public name(): NameContext {
        return this.getRuleContext(0, NameContext)!;
    }
    public typeRef(): TypeRefContext {
        return this.getRuleContext(0, TypeRefContext)!;
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_param;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterParam) {
             listener.enterParam(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitParam) {
             listener.exitParam(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitParam) {
            return visitor.visitParam(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ApiDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public API(): antlr.TerminalNode {
        return this.getToken(PlantaParser.API, 0)!;
    }
    public name(): NameContext {
        return this.getRuleContext(0, NameContext)!;
    }
    public protocol(): ProtocolContext {
        return this.getRuleContext(0, ProtocolContext)!;
    }
    public BASE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.BASE, 0);
    }
    public STRING(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.STRING, 0);
    }
    public meta(): MetaContext[];
    public meta(i: number): MetaContext | null;
    public meta(i?: number): MetaContext[] | MetaContext | null {
        if (i === undefined) {
            return this.getRuleContexts(MetaContext);
        }

        return this.getRuleContext(i, MetaContext);
    }
    public endpointDecl(): EndpointDeclContext[];
    public endpointDecl(i: number): EndpointDeclContext | null;
    public endpointDecl(i?: number): EndpointDeclContext[] | EndpointDeclContext | null {
        if (i === undefined) {
            return this.getRuleContexts(EndpointDeclContext);
        }

        return this.getRuleContext(i, EndpointDeclContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_apiDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterApiDecl) {
             listener.enterApiDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitApiDecl) {
             listener.exitApiDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitApiDecl) {
            return visitor.visitApiDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ProtocolContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public HTTP(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.HTTP, 0);
    }
    public GRAPHQL(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.GRAPHQL, 0);
    }
    public GRPC(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.GRPC, 0);
    }
    public WEBSOCKET(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.WEBSOCKET, 0);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_protocol;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterProtocol) {
             listener.enterProtocol(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitProtocol) {
             listener.exitProtocol(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitProtocol) {
            return visitor.visitProtocol(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class EndpointDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ENDPOINT(): antlr.TerminalNode {
        return this.getToken(PlantaParser.ENDPOINT, 0)!;
    }
    public operationSig(): OperationSigContext {
        return this.getRuleContext(0, OperationSigContext)!;
    }
    public qualifiedName(): QualifiedNameContext {
        return this.getRuleContext(0, QualifiedNameContext)!;
    }
    public name(): NameContext | null {
        return this.getRuleContext(0, NameContext);
    }
    public endpointBody(): EndpointBodyContext | null {
        return this.getRuleContext(0, EndpointBodyContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_endpointDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterEndpointDecl) {
             listener.enterEndpointDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitEndpointDecl) {
             listener.exitEndpointDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitEndpointDecl) {
            return visitor.visitEndpointDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class OperationSigContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public HTTP_METHOD(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.HTTP_METHOD, 0);
    }
    public STRING(): antlr.TerminalNode {
        return this.getToken(PlantaParser.STRING, 0)!;
    }
    public QUERY(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.QUERY, 0);
    }
    public MUTATION(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.MUTATION, 0);
    }
    public SUBSCRIPTION(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.SUBSCRIPTION, 0);
    }
    public RPC(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.RPC, 0);
    }
    public MESSAGE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.MESSAGE, 0);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_operationSig;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterOperationSig) {
             listener.enterOperationSig(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitOperationSig) {
             listener.exitOperationSig(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitOperationSig) {
            return visitor.visitOperationSig(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class EndpointBodyContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public endpointItem(): EndpointItemContext[];
    public endpointItem(i: number): EndpointItemContext | null;
    public endpointItem(i?: number): EndpointItemContext[] | EndpointItemContext | null {
        if (i === undefined) {
            return this.getRuleContexts(EndpointItemContext);
        }

        return this.getRuleContext(i, EndpointItemContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_endpointBody;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterEndpointBody) {
             listener.enterEndpointBody(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitEndpointBody) {
             listener.exitEndpointBody(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitEndpointBody) {
            return visitor.visitEndpointBody(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class EndpointItemContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public BODY(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.BODY, 0);
    }
    public typeRef(): TypeRefContext | null {
        return this.getRuleContext(0, TypeRefContext);
    }
    public PARAM(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.PARAM, 0);
    }
    public name(): NameContext[];
    public name(i: number): NameContext | null;
    public name(i?: number): NameContext[] | NameContext | null {
        if (i === undefined) {
            return this.getRuleContexts(NameContext);
        }

        return this.getRuleContext(i, NameContext);
    }
    public IN(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.IN, 0);
    }
    public paramLocation(): ParamLocationContext | null {
        return this.getRuleContext(0, ParamLocationContext);
    }
    public RETURNS(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.RETURNS, 0);
    }
    public NUMBER(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.NUMBER, 0);
    }
    public AUTH(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.AUTH, 0);
    }
    public ROLES(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.ROLES, 0);
    }
    public RATE_LIMIT(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.RATE_LIMIT, 0);
    }
    public STRING(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.STRING, 0);
    }
    public traceClause(): TraceClauseContext | null {
        return this.getRuleContext(0, TraceClauseContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_endpointItem;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterEndpointItem) {
             listener.enterEndpointItem(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitEndpointItem) {
             listener.exitEndpointItem(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitEndpointItem) {
            return visitor.visitEndpointItem(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ParamLocationContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public PATH(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.PATH, 0);
    }
    public QUERY(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.QUERY, 0);
    }
    public name(): NameContext | null {
        return this.getRuleContext(0, NameContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_paramLocation;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterParamLocation) {
             listener.enterParamLocation(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitParamLocation) {
             listener.exitParamLocation(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitParamLocation) {
            return visitor.visitParamLocation(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ChannelDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public CHANNEL(): antlr.TerminalNode {
        return this.getToken(PlantaParser.CHANNEL, 0)!;
    }
    public name(): NameContext[];
    public name(i: number): NameContext | null;
    public name(i?: number): NameContext[] | NameContext | null {
        if (i === undefined) {
            return this.getRuleContexts(NameContext);
        }

        return this.getRuleContext(i, NameContext);
    }
    public KIND(): antlr.TerminalNode {
        return this.getToken(PlantaParser.KIND, 0)!;
    }
    public anchor(): AnchorContext | null {
        return this.getRuleContext(0, AnchorContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_channelDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterChannelDecl) {
             listener.enterChannelDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitChannelDecl) {
             listener.exitChannelDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitChannelDecl) {
            return visitor.visitChannelDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class EventDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EVENT(): antlr.TerminalNode {
        return this.getToken(PlantaParser.EVENT, 0)!;
    }
    public name(): NameContext {
        return this.getRuleContext(0, NameContext)!;
    }
    public VIA(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.VIA, 0);
    }
    public qualifiedName(): QualifiedNameContext | null {
        return this.getRuleContext(0, QualifiedNameContext);
    }
    public anchor(): AnchorContext | null {
        return this.getRuleContext(0, AnchorContext);
    }
    public fieldBlock(): FieldBlockContext | null {
        return this.getRuleContext(0, FieldBlockContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_eventDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterEventDecl) {
             listener.enterEventDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitEventDecl) {
             listener.exitEventDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitEventDecl) {
            return visitor.visitEventDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class HandlerDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ON(): antlr.TerminalNode {
        return this.getToken(PlantaParser.ON, 0)!;
    }
    public qualifiedName(): QualifiedNameContext[];
    public qualifiedName(i: number): QualifiedNameContext | null;
    public qualifiedName(i?: number): QualifiedNameContext[] | QualifiedNameContext | null {
        if (i === undefined) {
            return this.getRuleContexts(QualifiedNameContext);
        }

        return this.getRuleContext(i, QualifiedNameContext);
    }
    public traceClause(): TraceClauseContext[];
    public traceClause(i: number): TraceClauseContext | null;
    public traceClause(i?: number): TraceClauseContext[] | TraceClauseContext | null {
        if (i === undefined) {
            return this.getRuleContexts(TraceClauseContext);
        }

        return this.getRuleContext(i, TraceClauseContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_handlerDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterHandlerDecl) {
             listener.enterHandlerDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitHandlerDecl) {
             listener.exitHandlerDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitHandlerDecl) {
            return visitor.visitHandlerDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class JobDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public JOB(): antlr.TerminalNode {
        return this.getToken(PlantaParser.JOB, 0)!;
    }
    public name(): NameContext {
        return this.getRuleContext(0, NameContext)!;
    }
    public CRON(): antlr.TerminalNode {
        return this.getToken(PlantaParser.CRON, 0)!;
    }
    public STRING(): antlr.TerminalNode {
        return this.getToken(PlantaParser.STRING, 0)!;
    }
    public qualifiedName(): QualifiedNameContext {
        return this.getRuleContext(0, QualifiedNameContext)!;
    }
    public traceClause(): TraceClauseContext[];
    public traceClause(i: number): TraceClauseContext | null;
    public traceClause(i?: number): TraceClauseContext[] | TraceClauseContext | null {
        if (i === undefined) {
            return this.getRuleContexts(TraceClauseContext);
        }

        return this.getRuleContext(i, TraceClauseContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_jobDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterJobDecl) {
             listener.enterJobDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitJobDecl) {
             listener.exitJobDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitJobDecl) {
            return visitor.visitJobDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ProcessDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public PROCESS(): antlr.TerminalNode {
        return this.getToken(PlantaParser.PROCESS, 0)!;
    }
    public name(): NameContext {
        return this.getRuleContext(0, NameContext)!;
    }
    public processBlock(): ProcessBlockContext {
        return this.getRuleContext(0, ProcessBlockContext)!;
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_processDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterProcessDecl) {
             listener.enterProcessDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitProcessDecl) {
             listener.exitProcessDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitProcessDecl) {
            return visitor.visitProcessDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ProcessBlockContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public processItem(): ProcessItemContext[];
    public processItem(i: number): ProcessItemContext | null;
    public processItem(i?: number): ProcessItemContext[] | ProcessItemContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ProcessItemContext);
        }

        return this.getRuleContext(i, ProcessItemContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_processBlock;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterProcessBlock) {
             listener.enterProcessBlock(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitProcessBlock) {
             listener.exitProcessBlock(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitProcessBlock) {
            return visitor.visitProcessBlock(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ProcessItemContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public meta(): MetaContext {
        return this.getRuleContext(0, MetaContext)!;
    }
    public processStmt(): ProcessStmtContext {
        return this.getRuleContext(0, ProcessStmtContext)!;
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_processItem;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterProcessItem) {
             listener.enterProcessItem(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitProcessItem) {
             listener.exitProcessItem(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitProcessItem) {
            return visitor.visitProcessItem(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ProcessStmtContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_processStmt;
    }
    public override copyFrom(ctx: ProcessStmtContext): void {
        super.copyFrom(ctx);
    }
}
export class ProcTraceContext extends ProcessStmtContext {
    public constructor(ctx: ProcessStmtContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public traceClause(): TraceClauseContext {
        return this.getRuleContext(0, TraceClauseContext)!;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterProcTrace) {
             listener.enterProcTrace(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitProcTrace) {
             listener.exitProcTrace(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitProcTrace) {
            return visitor.visitProcTrace(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class ProcTriggerContext extends ProcessStmtContext {
    public constructor(ctx: ProcessStmtContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public TRIGGER(): antlr.TerminalNode {
        return this.getToken(PlantaParser.TRIGGER, 0)!;
    }
    public qualifiedName(): QualifiedNameContext {
        return this.getRuleContext(0, QualifiedNameContext)!;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterProcTrigger) {
             listener.enterProcTrigger(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitProcTrigger) {
             listener.exitProcTrigger(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitProcTrigger) {
            return visitor.visitProcTrigger(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class ProcActorContext extends ProcessStmtContext {
    public constructor(ctx: ProcessStmtContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public ACTOR(): antlr.TerminalNode {
        return this.getToken(PlantaParser.ACTOR, 0)!;
    }
    public qualifiedName(): QualifiedNameContext {
        return this.getRuleContext(0, QualifiedNameContext)!;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterProcActor) {
             listener.enterProcActor(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitProcActor) {
             listener.exitProcActor(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitProcActor) {
            return visitor.visitProcActor(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class ProcVerifyContext extends ProcessStmtContext {
    public constructor(ctx: ProcessStmtContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public VERIFY(): antlr.TerminalNode {
        return this.getToken(PlantaParser.VERIFY, 0)!;
    }
    public CALLS(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.CALLS, 0);
    }
    public name(): NameContext | null {
        return this.getRuleContext(0, NameContext);
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterProcVerify) {
             listener.enterProcVerify(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitProcVerify) {
             listener.exitProcVerify(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitProcVerify) {
            return visitor.visitProcVerify(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class ProcStepContext extends ProcessStmtContext {
    public constructor(ctx: ProcessStmtContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public STEP(): antlr.TerminalNode {
        return this.getToken(PlantaParser.STEP, 0)!;
    }
    public name(): NameContext {
        return this.getRuleContext(0, NameContext)!;
    }
    public stepTarget(): StepTargetContext {
        return this.getRuleContext(0, StepTargetContext)!;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterProcStep) {
             listener.enterProcStep(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitProcStep) {
             listener.exitProcStep(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitProcStep) {
            return visitor.visitProcStep(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class ProcEmitContext extends ProcessStmtContext {
    public constructor(ctx: ProcessStmtContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public emitStmt(): EmitStmtContext {
        return this.getRuleContext(0, EmitStmtContext)!;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterProcEmit) {
             listener.enterProcEmit(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitProcEmit) {
             listener.exitProcEmit(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitProcEmit) {
            return visitor.visitProcEmit(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class ProcIfContext extends ProcessStmtContext {
    public constructor(ctx: ProcessStmtContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public IF(): antlr.TerminalNode {
        return this.getToken(PlantaParser.IF, 0)!;
    }
    public STRING(): antlr.TerminalNode {
        return this.getToken(PlantaParser.STRING, 0)!;
    }
    public processBlock(): ProcessBlockContext[];
    public processBlock(i: number): ProcessBlockContext | null;
    public processBlock(i?: number): ProcessBlockContext[] | ProcessBlockContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ProcessBlockContext);
        }

        return this.getRuleContext(i, ProcessBlockContext);
    }
    public ELSE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.ELSE, 0);
    }
    public ifTail(): IfTailContext | null {
        return this.getRuleContext(0, IfTailContext);
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterProcIf) {
             listener.enterProcIf(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitProcIf) {
             listener.exitProcIf(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitProcIf) {
            return visitor.visitProcIf(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class ProcParallelContext extends ProcessStmtContext {
    public constructor(ctx: ProcessStmtContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public PARALLEL(): antlr.TerminalNode {
        return this.getToken(PlantaParser.PARALLEL, 0)!;
    }
    public processBlock(): ProcessBlockContext {
        return this.getRuleContext(0, ProcessBlockContext)!;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterProcParallel) {
             listener.enterProcParallel(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitProcParallel) {
             listener.exitProcParallel(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitProcParallel) {
            return visitor.visitProcParallel(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class ProcForeachContext extends ProcessStmtContext {
    public constructor(ctx: ProcessStmtContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public FOREACH(): antlr.TerminalNode {
        return this.getToken(PlantaParser.FOREACH, 0)!;
    }
    public STRING(): antlr.TerminalNode {
        return this.getToken(PlantaParser.STRING, 0)!;
    }
    public processBlock(): ProcessBlockContext {
        return this.getRuleContext(0, ProcessBlockContext)!;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterProcForeach) {
             listener.enterProcForeach(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitProcForeach) {
             listener.exitProcForeach(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitProcForeach) {
            return visitor.visitProcForeach(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class ProcWaitContext extends ProcessStmtContext {
    public constructor(ctx: ProcessStmtContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public WAIT(): antlr.TerminalNode {
        return this.getToken(PlantaParser.WAIT, 0)!;
    }
    public qualifiedName(): QualifiedNameContext {
        return this.getRuleContext(0, QualifiedNameContext)!;
    }
    public TIMEOUT(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.TIMEOUT, 0);
    }
    public STRING(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.STRING, 0);
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterProcWait) {
             listener.enterProcWait(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitProcWait) {
             listener.exitProcWait(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitProcWait) {
            return visitor.visitProcWait(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class ProcFailContext extends ProcessStmtContext {
    public constructor(ctx: ProcessStmtContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public FAIL(): antlr.TerminalNode {
        return this.getToken(PlantaParser.FAIL, 0)!;
    }
    public NUMBER(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.NUMBER, 0);
    }
    public STRING(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.STRING, 0);
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterProcFail) {
             listener.enterProcFail(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitProcFail) {
             listener.exitProcFail(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitProcFail) {
            return visitor.visitProcFail(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class ProcReturnContext extends ProcessStmtContext {
    public constructor(ctx: ProcessStmtContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public RETURN(): antlr.TerminalNode {
        return this.getToken(PlantaParser.RETURN, 0)!;
    }
    public typeRef(): TypeRefContext | null {
        return this.getRuleContext(0, TypeRefContext);
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterProcReturn) {
             listener.enterProcReturn(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitProcReturn) {
             listener.exitProcReturn(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitProcReturn) {
            return visitor.visitProcReturn(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class IfTailContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public IF(): antlr.TerminalNode {
        return this.getToken(PlantaParser.IF, 0)!;
    }
    public STRING(): antlr.TerminalNode {
        return this.getToken(PlantaParser.STRING, 0)!;
    }
    public processBlock(): ProcessBlockContext[];
    public processBlock(i: number): ProcessBlockContext | null;
    public processBlock(i?: number): ProcessBlockContext[] | ProcessBlockContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ProcessBlockContext);
        }

        return this.getRuleContext(i, ProcessBlockContext);
    }
    public ELSE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.ELSE, 0);
    }
    public ifTail(): IfTailContext | null {
        return this.getRuleContext(0, IfTailContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_ifTail;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterIfTail) {
             listener.enterIfTail(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitIfTail) {
             listener.exitIfTail(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitIfTail) {
            return visitor.visitIfTail(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class StepTargetContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public emitStmt(): EmitStmtContext | null {
        return this.getRuleContext(0, EmitStmtContext);
    }
    public qualifiedName(): QualifiedNameContext | null {
        return this.getRuleContext(0, QualifiedNameContext);
    }
    public STRING(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.STRING, 0);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_stepTarget;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterStepTarget) {
             listener.enterStepTarget(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitStepTarget) {
             listener.exitStepTarget(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitStepTarget) {
            return visitor.visitStepTarget(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class EmitStmtContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EMIT(): antlr.TerminalNode {
        return this.getToken(PlantaParser.EMIT, 0)!;
    }
    public qualifiedName(): QualifiedNameContext {
        return this.getRuleContext(0, QualifiedNameContext)!;
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_emitStmt;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterEmitStmt) {
             listener.enterEmitStmt(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitEmitStmt) {
             listener.exitEmitStmt(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitEmitStmt) {
            return visitor.visitEmitStmt(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class AppDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public APP(): antlr.TerminalNode {
        return this.getToken(PlantaParser.APP, 0)!;
    }
    public name(): NameContext[];
    public name(i: number): NameContext | null;
    public name(i?: number): NameContext[] | NameContext | null {
        if (i === undefined) {
            return this.getRuleContexts(NameContext);
        }

        return this.getRuleContext(i, NameContext);
    }
    public KIND(): antlr.TerminalNode {
        return this.getToken(PlantaParser.KIND, 0)!;
    }
    public FRAMEWORK(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.FRAMEWORK, 0);
    }
    public rootClause(): RootClauseContext | null {
        return this.getRuleContext(0, RootClauseContext);
    }
    public appItem(): AppItemContext[];
    public appItem(i: number): AppItemContext | null;
    public appItem(i?: number): AppItemContext[] | AppItemContext | null {
        if (i === undefined) {
            return this.getRuleContexts(AppItemContext);
        }

        return this.getRuleContext(i, AppItemContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_appDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterAppDecl) {
             listener.enterAppDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitAppDecl) {
             listener.exitAppDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitAppDecl) {
            return visitor.visitAppDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class AppItemContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public meta(): MetaContext {
        return this.getRuleContext(0, MetaContext)!;
    }
    public CONTAINS(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.CONTAINS, 0);
    }
    public qualifiedNameList(): QualifiedNameListContext | null {
        return this.getRuleContext(0, QualifiedNameListContext);
    }
    public routeDecl(): RouteDeclContext | null {
        return this.getRuleContext(0, RouteDeclContext);
    }
    public componentDecl(): ComponentDeclContext | null {
        return this.getRuleContext(0, ComponentDeclContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_appItem;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterAppItem) {
             listener.enterAppItem(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitAppItem) {
             listener.exitAppItem(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitAppItem) {
            return visitor.visitAppItem(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class RouteDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ROUTE(): antlr.TerminalNode {
        return this.getToken(PlantaParser.ROUTE, 0)!;
    }
    public STRING(): antlr.TerminalNode {
        return this.getToken(PlantaParser.STRING, 0)!;
    }
    public qualifiedName(): QualifiedNameContext[];
    public qualifiedName(i: number): QualifiedNameContext | null;
    public qualifiedName(i?: number): QualifiedNameContext[] | QualifiedNameContext | null {
        if (i === undefined) {
            return this.getRuleContexts(QualifiedNameContext);
        }

        return this.getRuleContext(i, QualifiedNameContext);
    }
    public GUARD(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.GUARD, 0);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_routeDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterRouteDecl) {
             listener.enterRouteDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitRouteDecl) {
             listener.exitRouteDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitRouteDecl) {
            return visitor.visitRouteDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TraceClauseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public traceRef(): TraceRefContext[];
    public traceRef(i: number): TraceRefContext | null;
    public traceRef(i?: number): TraceRefContext[] | TraceRefContext | null {
        if (i === undefined) {
            return this.getRuleContexts(TraceRefContext);
        }

        return this.getRuleContext(i, TraceRefContext);
    }
    public JUSTIFIED_BY(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.JUSTIFIED_BY, 0);
    }
    public DECIDED_BY(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.DECIDED_BY, 0);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_traceClause;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterTraceClause) {
             listener.enterTraceClause(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitTraceClause) {
             listener.exitTraceClause(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitTraceClause) {
            return visitor.visitTraceClause(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TraceRefContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public STRING(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.STRING, 0);
    }
    public qualifiedName(): QualifiedNameContext | null {
        return this.getRuleContext(0, QualifiedNameContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_traceRef;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterTraceRef) {
             listener.enterTraceRef(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitTraceRef) {
             listener.exitTraceRef(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitTraceRef) {
            return visitor.visitTraceRef(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DeploymentDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public DEPLOYMENT(): antlr.TerminalNode {
        return this.getToken(PlantaParser.DEPLOYMENT, 0)!;
    }
    public name(): NameContext[];
    public name(i: number): NameContext | null;
    public name(i?: number): NameContext[] | NameContext | null {
        if (i === undefined) {
            return this.getRuleContexts(NameContext);
        }

        return this.getRuleContext(i, NameContext);
    }
    public PROVIDER(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.PROVIDER, 0);
    }
    public REGION(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.REGION, 0);
    }
    public STRING(): antlr.TerminalNode[];
    public STRING(i: number): antlr.TerminalNode | null;
    public STRING(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PlantaParser.STRING);
    	} else {
    		return this.getToken(PlantaParser.STRING, i);
    	}
    }
    public SOURCE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.SOURCE, 0);
    }
    public deployItem(): DeployItemContext[];
    public deployItem(i: number): DeployItemContext | null;
    public deployItem(i?: number): DeployItemContext[] | DeployItemContext | null {
        if (i === undefined) {
            return this.getRuleContexts(DeployItemContext);
        }

        return this.getRuleContext(i, DeployItemContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_deploymentDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterDeploymentDecl) {
             listener.enterDeploymentDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitDeploymentDecl) {
             listener.exitDeploymentDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitDeploymentDecl) {
            return visitor.visitDeploymentDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DeployItemContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public meta(): MetaContext {
        return this.getRuleContext(0, MetaContext)!;
    }
    public groupDecl(): GroupDeclContext | null {
        return this.getRuleContext(0, GroupDeclContext);
    }
    public connection(): ConnectionContext | null {
        return this.getRuleContext(0, ConnectionContext);
    }
    public nodeDecl(): NodeDeclContext | null {
        return this.getRuleContext(0, NodeDeclContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_deployItem;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterDeployItem) {
             listener.enterDeployItem(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitDeployItem) {
             listener.exitDeployItem(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitDeployItem) {
            return visitor.visitDeployItem(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class GroupDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public groupKind(): GroupKindContext {
        return this.getRuleContext(0, GroupKindContext)!;
    }
    public name(): NameContext {
        return this.getRuleContext(0, NameContext)!;
    }
    public resourceType(): ResourceTypeContext | null {
        return this.getRuleContext(0, ResourceTypeContext);
    }
    public anchor(): AnchorContext | null {
        return this.getRuleContext(0, AnchorContext);
    }
    public deployItem(): DeployItemContext[];
    public deployItem(i: number): DeployItemContext | null;
    public deployItem(i?: number): DeployItemContext[] | DeployItemContext | null {
        if (i === undefined) {
            return this.getRuleContexts(DeployItemContext);
        }

        return this.getRuleContext(i, DeployItemContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_groupDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterGroupDecl) {
             listener.enterGroupDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitGroupDecl) {
             listener.exitGroupDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitGroupDecl) {
            return visitor.visitGroupDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class GroupKindContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public NETWORK(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.NETWORK, 0);
    }
    public ZONE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.ZONE, 0);
    }
    public CLUSTER(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.CLUSTER, 0);
    }
    public GROUP(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.GROUP, 0);
    }
    public REGION(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.REGION, 0);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_groupKind;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterGroupKind) {
             listener.enterGroupKind(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitGroupKind) {
             listener.exitGroupKind(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitGroupKind) {
            return visitor.visitGroupKind(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class NodeDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public name(): NameContext {
        return this.getRuleContext(0, NameContext)!;
    }
    public resourceType(): ResourceTypeContext {
        return this.getRuleContext(0, ResourceTypeContext)!;
    }
    public nodeClause(): NodeClauseContext[];
    public nodeClause(i: number): NodeClauseContext | null;
    public nodeClause(i?: number): NodeClauseContext[] | NodeClauseContext | null {
        if (i === undefined) {
            return this.getRuleContexts(NodeClauseContext);
        }

        return this.getRuleContext(i, NodeClauseContext);
    }
    public anchor(): AnchorContext | null {
        return this.getRuleContext(0, AnchorContext);
    }
    public nodeProp(): NodePropContext[];
    public nodeProp(i: number): NodePropContext | null;
    public nodeProp(i?: number): NodePropContext[] | NodePropContext | null {
        if (i === undefined) {
            return this.getRuleContexts(NodePropContext);
        }

        return this.getRuleContext(i, NodePropContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_nodeDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterNodeDecl) {
             listener.enterNodeDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitNodeDecl) {
             listener.exitNodeDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitNodeDecl) {
            return visitor.visitNodeDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ResourceTypeContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public qualifiedName(): QualifiedNameContext {
        return this.getRuleContext(0, QualifiedNameContext)!;
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_resourceType;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterResourceType) {
             listener.enterResourceType(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitResourceType) {
             listener.exitResourceType(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitResourceType) {
            return visitor.visitResourceType(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class NodeClauseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public RUNS(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.RUNS, 0);
    }
    public qualifiedName(): QualifiedNameContext | null {
        return this.getRuleContext(0, QualifiedNameContext);
    }
    public STORES(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.STORES, 0);
    }
    public qualifiedNameList(): QualifiedNameListContext | null {
        return this.getRuleContext(0, QualifiedNameListContext);
    }
    public CARRIES(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.CARRIES, 0);
    }
    public REPLICAS(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.REPLICAS, 0);
    }
    public NUMBER(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.NUMBER, 0);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_nodeClause;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterNodeClause) {
             listener.enterNodeClause(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitNodeClause) {
             listener.exitNodeClause(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitNodeClause) {
            return visitor.visitNodeClause(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class NodePropContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public name(): NameContext {
        return this.getRuleContext(0, NameContext)!;
    }
    public literal(): LiteralContext {
        return this.getRuleContext(0, LiteralContext)!;
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_nodeProp;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterNodeProp) {
             listener.enterNodeProp(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitNodeProp) {
             listener.exitNodeProp(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitNodeProp) {
            return visitor.visitNodeProp(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ConnectionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public qualifiedName(): QualifiedNameContext[];
    public qualifiedName(i: number): QualifiedNameContext | null;
    public qualifiedName(i?: number): QualifiedNameContext[] | QualifiedNameContext | null {
        if (i === undefined) {
            return this.getRuleContexts(QualifiedNameContext);
        }

        return this.getRuleContext(i, QualifiedNameContext);
    }
    public STRING(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.STRING, 0);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_connection;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterConnection) {
             listener.enterConnection(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitConnection) {
             listener.exitConnection(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitConnection) {
            return visitor.visitConnection(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class RuleDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public RULE(): antlr.TerminalNode {
        return this.getToken(PlantaParser.RULE, 0)!;
    }
    public name(): NameContext[];
    public name(i: number): NameContext | null;
    public name(i?: number): NameContext[] | NameContext | null {
        if (i === undefined) {
            return this.getRuleContexts(NameContext);
        }

        return this.getRuleContext(i, NameContext);
    }
    public SEVERITY(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.SEVERITY, 0);
    }
    public ruleStmt(): RuleStmtContext[];
    public ruleStmt(i: number): RuleStmtContext | null;
    public ruleStmt(i?: number): RuleStmtContext[] | RuleStmtContext | null {
        if (i === undefined) {
            return this.getRuleContexts(RuleStmtContext);
        }

        return this.getRuleContext(i, RuleStmtContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_ruleDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterRuleDecl) {
             listener.enterRuleDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitRuleDecl) {
             listener.exitRuleDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitRuleDecl) {
            return visitor.visitRuleDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class RuleStmtContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public subject(): SubjectContext {
        return this.getRuleContext(0, SubjectContext)!;
    }
    public modality(): ModalityContext {
        return this.getRuleContext(0, ModalityContext)!;
    }
    public predicate(): PredicateContext {
        return this.getRuleContext(0, PredicateContext)!;
    }
    public exception(): ExceptionContext | null {
        return this.getRuleContext(0, ExceptionContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_ruleStmt;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterRuleStmt) {
             listener.enterRuleStmt(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitRuleStmt) {
             listener.exitRuleStmt(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitRuleStmt) {
            return visitor.visitRuleStmt(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SubjectContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EVERY(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.EVERY, 0);
    }
    public elementKind(): ElementKindContext {
        return this.getRuleContext(0, ElementKindContext)!;
    }
    public WHERE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.WHERE, 0);
    }
    public name(): NameContext | null {
        return this.getRuleContext(0, NameContext);
    }
    public literal(): LiteralContext | null {
        return this.getRuleContext(0, LiteralContext);
    }
    public qualifiedName(): QualifiedNameContext | null {
        return this.getRuleContext(0, QualifiedNameContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_subject;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterSubject) {
             listener.enterSubject(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitSubject) {
             listener.exitSubject(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitSubject) {
            return visitor.visitSubject(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ModalityContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public MUST(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.MUST, 0);
    }
    public NOT(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.NOT, 0);
    }
    public MAY(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.MAY, 0);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_modality;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterModality) {
             listener.enterModality(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitModality) {
             listener.exitModality(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitModality) {
            return visitor.visitModality(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class PredicateContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public DEPEND(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.DEPEND, 0);
    }
    public ON(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.ON, 0);
    }
    public subject(): SubjectContext | null {
        return this.getRuleContext(0, SubjectContext);
    }
    public HAVE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.HAVE, 0);
    }
    public property(): PropertyContext | null {
        return this.getRuleContext(0, PropertyContext);
    }
    public MATCH(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.MATCH, 0);
    }
    public STRING(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.STRING, 0);
    }
    public BE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.BE, 0);
    }
    public IN(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.IN, 0);
    }
    public LAYER(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.LAYER, 0);
    }
    public qualifiedName(): QualifiedNameContext | null {
        return this.getRuleContext(0, QualifiedNameContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_predicate;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterPredicate) {
             listener.enterPredicate(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitPredicate) {
             listener.exitPredicate(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitPredicate) {
            return visitor.visitPredicate(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class PropertyContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public JUSTIFIED_BY(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.JUSTIFIED_BY, 0);
    }
    public DECIDED_BY(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.DECIDED_BY, 0);
    }
    public OWNER(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.OWNER, 0);
    }
    public anchorWord(): AnchorWordContext | null {
        return this.getRuleContext(0, AnchorWordContext);
    }
    public name(): NameContext | null {
        return this.getRuleContext(0, NameContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_property;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterProperty) {
             listener.enterProperty(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitProperty) {
             listener.exitProperty(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitProperty) {
            return visitor.visitProperty(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class AnchorWordContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ANCHOR_KW(): antlr.TerminalNode {
        return this.getToken(PlantaParser.ANCHOR_KW, 0)!;
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_anchorWord;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterAnchorWord) {
             listener.enterAnchorWord(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitAnchorWord) {
             listener.exitAnchorWord(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitAnchorWord) {
            return visitor.visitAnchorWord(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ExceptionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EXCEPT(): antlr.TerminalNode {
        return this.getToken(PlantaParser.EXCEPT, 0)!;
    }
    public VIA(): antlr.TerminalNode {
        return this.getToken(PlantaParser.VIA, 0)!;
    }
    public elementKind(): ElementKindContext {
        return this.getRuleContext(0, ElementKindContext)!;
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_exception;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterException) {
             listener.enterException(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitException) {
             listener.exitException(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitException) {
            return visitor.visitException(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ElementKindContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ENTITY(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.ENTITY, 0);
    }
    public VALUE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.VALUE, 0);
    }
    public DTO(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.DTO, 0);
    }
    public ENUM(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.ENUM, 0);
    }
    public AGGREGATE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.AGGREGATE, 0);
    }
    public SERVICE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.SERVICE, 0);
    }
    public CONTROLLER(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.CONTROLLER, 0);
    }
    public REPOSITORY(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.REPOSITORY, 0);
    }
    public GATEWAY(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.GATEWAY, 0);
    }
    public MIDDLEWARE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.MIDDLEWARE, 0);
    }
    public GUARD(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.GUARD, 0);
    }
    public COMPONENT(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.COMPONENT, 0);
    }
    public PAGE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.PAGE, 0);
    }
    public STORE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.STORE, 0);
    }
    public OP(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.OP, 0);
    }
    public API(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.API, 0);
    }
    public ENDPOINT(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.ENDPOINT, 0);
    }
    public CHANNEL(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.CHANNEL, 0);
    }
    public EVENT(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.EVENT, 0);
    }
    public HANDLER_KW(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.HANDLER_KW, 0);
    }
    public JOB(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.JOB, 0);
    }
    public PROCESS(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.PROCESS, 0);
    }
    public CONTEXT(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.CONTEXT, 0);
    }
    public APP(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.APP, 0);
    }
    public LAYER(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.LAYER, 0);
    }
    public REQUIREMENT(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.REQUIREMENT, 0);
    }
    public DECISION(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.DECISION, 0);
    }
    public ACTOR(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.ACTOR, 0);
    }
    public EXTERNAL(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.EXTERNAL, 0);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_elementKind;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterElementKind) {
             listener.enterElementKind(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitElementKind) {
             listener.exitElementKind(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitElementKind) {
            return visitor.visitElementKind(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ViewDeclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public VIEW(): antlr.TerminalNode {
        return this.getToken(PlantaParser.VIEW, 0)!;
    }
    public name(): NameContext[];
    public name(i: number): NameContext | null;
    public name(i?: number): NameContext[] | NameContext | null {
        if (i === undefined) {
            return this.getRuleContexts(NameContext);
        }

        return this.getRuleContext(i, NameContext);
    }
    public KIND(): antlr.TerminalNode {
        return this.getToken(PlantaParser.KIND, 0)!;
    }
    public viewKind(): ViewKindContext {
        return this.getRuleContext(0, ViewKindContext)!;
    }
    public OF(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.OF, 0);
    }
    public qualifiedName(): QualifiedNameContext | null {
        return this.getRuleContext(0, QualifiedNameContext);
    }
    public STYLE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.STYLE, 0);
    }
    public viewItem(): ViewItemContext[];
    public viewItem(i: number): ViewItemContext | null;
    public viewItem(i?: number): ViewItemContext[] | ViewItemContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ViewItemContext);
        }

        return this.getRuleContext(i, ViewItemContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_viewDecl;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterViewDecl) {
             listener.enterViewDecl(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitViewDecl) {
             listener.exitViewDecl(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitViewDecl) {
            return visitor.visitViewDecl(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ViewKindContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public name(): NameContext[];
    public name(i: number): NameContext | null;
    public name(i?: number): NameContext[] | NameContext | null {
        if (i === undefined) {
            return this.getRuleContexts(NameContext);
        }

        return this.getRuleContext(i, NameContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_viewKind;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterViewKind) {
             listener.enterViewKind(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitViewKind) {
             listener.exitViewKind(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitViewKind) {
            return visitor.visitViewKind(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ViewItemContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public TITLE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.TITLE, 0);
    }
    public STRING(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.STRING, 0);
    }
    public INCLUDE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.INCLUDE, 0);
    }
    public viewSelector(): ViewSelectorContext[];
    public viewSelector(i: number): ViewSelectorContext | null;
    public viewSelector(i?: number): ViewSelectorContext[] | ViewSelectorContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ViewSelectorContext);
        }

        return this.getRuleContext(i, ViewSelectorContext);
    }
    public EXCLUDE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.EXCLUDE, 0);
    }
    public LAYOUT(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.LAYOUT, 0);
    }
    public name(): NameContext | null {
        return this.getRuleContext(0, NameContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_viewItem;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterViewItem) {
             listener.enterViewItem(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitViewItem) {
             listener.exitViewItem(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitViewItem) {
            return visitor.visitViewItem(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ViewSelectorContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EVERY(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.EVERY, 0);
    }
    public elementKind(): ElementKindContext | null {
        return this.getRuleContext(0, ElementKindContext);
    }
    public qualifiedName(): QualifiedNameContext | null {
        return this.getRuleContext(0, QualifiedNameContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_viewSelector;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterViewSelector) {
             listener.enterViewSelector(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitViewSelector) {
             listener.exitViewSelector(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitViewSelector) {
            return visitor.visitViewSelector(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class AnchorContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public STRING(): antlr.TerminalNode {
        return this.getToken(PlantaParser.STRING, 0)!;
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_anchor;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterAnchor) {
             listener.enterAnchor(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitAnchor) {
             listener.exitAnchor(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitAnchor) {
            return visitor.visitAnchor(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class QualifiedNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public name(): NameContext[];
    public name(i: number): NameContext | null;
    public name(i?: number): NameContext[] | NameContext | null {
        if (i === undefined) {
            return this.getRuleContexts(NameContext);
        }

        return this.getRuleContext(i, NameContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_qualifiedName;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterQualifiedName) {
             listener.enterQualifiedName(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitQualifiedName) {
             listener.exitQualifiedName(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitQualifiedName) {
            return visitor.visitQualifiedName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class QualifiedNameListContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public qualifiedName(): QualifiedNameContext[];
    public qualifiedName(i: number): QualifiedNameContext | null;
    public qualifiedName(i?: number): QualifiedNameContext[] | QualifiedNameContext | null {
        if (i === undefined) {
            return this.getRuleContexts(QualifiedNameContext);
        }

        return this.getRuleContext(i, QualifiedNameContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_qualifiedNameList;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterQualifiedNameList) {
             listener.enterQualifiedNameList(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitQualifiedNameList) {
             listener.exitQualifiedNameList(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitQualifiedNameList) {
            return visitor.visitQualifiedNameList(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class LiteralListContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public literal(): LiteralContext[];
    public literal(i: number): LiteralContext | null;
    public literal(i?: number): LiteralContext[] | LiteralContext | null {
        if (i === undefined) {
            return this.getRuleContexts(LiteralContext);
        }

        return this.getRuleContext(i, LiteralContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_literalList;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterLiteralList) {
             listener.enterLiteralList(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitLiteralList) {
             listener.exitLiteralList(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitLiteralList) {
            return visitor.visitLiteralList(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class LiteralContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public STRING(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.STRING, 0);
    }
    public NUMBER(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.NUMBER, 0);
    }
    public BOOL(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.BOOL, 0);
    }
    public name(): NameContext | null {
        return this.getRuleContext(0, NameContext);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_literal;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterLiteral) {
             listener.enterLiteral(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitLiteral) {
             listener.exitLiteral(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitLiteral) {
            return visitor.visitLiteral(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class NameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ID(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.ID, 0);
    }
    public SYSTEM(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.SYSTEM, 0);
    }
    public DESCRIPTION(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.DESCRIPTION, 0);
    }
    public OWNER(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.OWNER, 0);
    }
    public VERSION(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.VERSION, 0);
    }
    public LAYER(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.LAYER, 0);
    }
    public MATCH(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.MATCH, 0);
    }
    public ACTOR(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.ACTOR, 0);
    }
    public EXTERNAL(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.EXTERNAL, 0);
    }
    public REQUIREMENT(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.REQUIREMENT, 0);
    }
    public DECISION(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.DECISION, 0);
    }
    public CONTEXT(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.CONTEXT, 0);
    }
    public ROOT(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.ROOT, 0);
    }
    public ENTITY(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.ENTITY, 0);
    }
    public VALUE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.VALUE, 0);
    }
    public DTO(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.DTO, 0);
    }
    public ENUM(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.ENUM, 0);
    }
    public AGGREGATE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.AGGREGATE, 0);
    }
    public CONTAINS(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.CONTAINS, 0);
    }
    public MAP(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.MAP, 0);
    }
    public SERVICE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.SERVICE, 0);
    }
    public CONTROLLER(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.CONTROLLER, 0);
    }
    public REPOSITORY(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.REPOSITORY, 0);
    }
    public GATEWAY(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.GATEWAY, 0);
    }
    public MIDDLEWARE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.MIDDLEWARE, 0);
    }
    public GUARD(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.GUARD, 0);
    }
    public COMPONENT(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.COMPONENT, 0);
    }
    public PAGE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.PAGE, 0);
    }
    public STORE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.STORE, 0);
    }
    public IN(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.IN, 0);
    }
    public USES(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.USES, 0);
    }
    public CALLS(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.CALLS, 0);
    }
    public RENDERS(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.RENDERS, 0);
    }
    public IMPLEMENTS(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.IMPLEMENTS, 0);
    }
    public OP(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.OP, 0);
    }
    public API(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.API, 0);
    }
    public BASE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.BASE, 0);
    }
    public HTTP(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.HTTP, 0);
    }
    public GRAPHQL(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.GRAPHQL, 0);
    }
    public GRPC(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.GRPC, 0);
    }
    public WEBSOCKET(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.WEBSOCKET, 0);
    }
    public ENDPOINT(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.ENDPOINT, 0);
    }
    public QUERY(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.QUERY, 0);
    }
    public MUTATION(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.MUTATION, 0);
    }
    public SUBSCRIPTION(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.SUBSCRIPTION, 0);
    }
    public RPC(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.RPC, 0);
    }
    public MESSAGE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.MESSAGE, 0);
    }
    public BODY(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.BODY, 0);
    }
    public PARAM(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.PARAM, 0);
    }
    public RETURNS(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.RETURNS, 0);
    }
    public AUTH(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.AUTH, 0);
    }
    public ROLES(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.ROLES, 0);
    }
    public RATE_LIMIT(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.RATE_LIMIT, 0);
    }
    public PATH(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.PATH, 0);
    }
    public CHANNEL(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.CHANNEL, 0);
    }
    public KIND(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.KIND, 0);
    }
    public EVENT(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.EVENT, 0);
    }
    public VIA(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.VIA, 0);
    }
    public ON(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.ON, 0);
    }
    public JOB(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.JOB, 0);
    }
    public CRON(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.CRON, 0);
    }
    public PROCESS(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.PROCESS, 0);
    }
    public TRIGGER(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.TRIGGER, 0);
    }
    public VERIFY(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.VERIFY, 0);
    }
    public STEP(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.STEP, 0);
    }
    public IF(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.IF, 0);
    }
    public ELSE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.ELSE, 0);
    }
    public PARALLEL(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.PARALLEL, 0);
    }
    public FOREACH(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.FOREACH, 0);
    }
    public WAIT(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.WAIT, 0);
    }
    public TIMEOUT(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.TIMEOUT, 0);
    }
    public FAIL(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.FAIL, 0);
    }
    public RETURN(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.RETURN, 0);
    }
    public EMIT(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.EMIT, 0);
    }
    public APP(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.APP, 0);
    }
    public FRAMEWORK(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.FRAMEWORK, 0);
    }
    public ROUTE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.ROUTE, 0);
    }
    public DEPLOYMENT(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.DEPLOYMENT, 0);
    }
    public PROVIDER(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.PROVIDER, 0);
    }
    public REGION(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.REGION, 0);
    }
    public SOURCE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.SOURCE, 0);
    }
    public NETWORK(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.NETWORK, 0);
    }
    public ZONE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.ZONE, 0);
    }
    public CLUSTER(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.CLUSTER, 0);
    }
    public GROUP(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.GROUP, 0);
    }
    public RUNS(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.RUNS, 0);
    }
    public STORES(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.STORES, 0);
    }
    public CARRIES(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.CARRIES, 0);
    }
    public REPLICAS(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.REPLICAS, 0);
    }
    public RULE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.RULE, 0);
    }
    public SEVERITY(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.SEVERITY, 0);
    }
    public EVERY(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.EVERY, 0);
    }
    public WHERE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.WHERE, 0);
    }
    public MUST(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.MUST, 0);
    }
    public NOT(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.NOT, 0);
    }
    public MAY(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.MAY, 0);
    }
    public DEPEND(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.DEPEND, 0);
    }
    public HAVE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.HAVE, 0);
    }
    public BE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.BE, 0);
    }
    public EXCEPT(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.EXCEPT, 0);
    }
    public VIEW(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.VIEW, 0);
    }
    public OF(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.OF, 0);
    }
    public STYLE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.STYLE, 0);
    }
    public TITLE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.TITLE, 0);
    }
    public INCLUDE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.INCLUDE, 0);
    }
    public EXCLUDE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.EXCLUDE, 0);
    }
    public LAYOUT(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.LAYOUT, 0);
    }
    public USE(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.USE, 0);
    }
    public AS(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.AS, 0);
    }
    public ANCHOR_KW(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.ANCHOR_KW, 0);
    }
    public HANDLER_KW(): antlr.TerminalNode | null {
        return this.getToken(PlantaParser.HANDLER_KW, 0);
    }
    public override get ruleIndex(): number {
        return PlantaParser.RULE_name;
    }
    public override enterRule(listener: PlantaListener): void {
        if(listener.enterName) {
             listener.enterName(this);
        }
    }
    public override exitRule(listener: PlantaListener): void {
        if(listener.exitName) {
             listener.exitName(this);
        }
    }
    public override accept<Result>(visitor: PlantaVisitor<Result>): Result | null {
        if (visitor.visitName) {
            return visitor.visitName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
