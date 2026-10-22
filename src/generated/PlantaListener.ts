
import { ErrorNode, ParseTreeListener, ParserRuleContext, TerminalNode } from "antlr4ng";


import { FileContext } from "./PlantaParser.js";
import { UseDeclContext } from "./PlantaParser.js";
import { TopDeclContext } from "./PlantaParser.js";
import { MetaContext } from "./PlantaParser.js";
import { AnnotationContext } from "./PlantaParser.js";
import { AnnotationItemContext } from "./PlantaParser.js";
import { SystemDeclContext } from "./PlantaParser.js";
import { SystemItemContext } from "./PlantaParser.js";
import { LayerDeclContext } from "./PlantaParser.js";
import { ActorDeclContext } from "./PlantaParser.js";
import { ExternalDeclContext } from "./PlantaParser.js";
import { RequirementDeclContext } from "./PlantaParser.js";
import { DecisionDeclContext } from "./PlantaParser.js";
import { ContextDeclContext } from "./PlantaParser.js";
import { RootClauseContext } from "./PlantaParser.js";
import { ContextMemberContext } from "./PlantaParser.js";
import { EntityDeclContext } from "./PlantaParser.js";
import { ValueDeclContext } from "./PlantaParser.js";
import { DtoDeclContext } from "./PlantaParser.js";
import { FieldBlockContext } from "./PlantaParser.js";
import { FieldBlockItemContext } from "./PlantaParser.js";
import { FieldDeclContext } from "./PlantaParser.js";
import { FieldModifierContext } from "./PlantaParser.js";
import { EnumDeclContext } from "./PlantaParser.js";
import { AggregateDeclContext } from "./PlantaParser.js";
import { TypeRefContext } from "./PlantaParser.js";
import { ComponentDeclContext } from "./PlantaParser.js";
import { ComponentKindContext } from "./PlantaParser.js";
import { LayerClauseContext } from "./PlantaParser.js";
import { ComponentBodyContext } from "./PlantaParser.js";
import { ComponentItemContext } from "./PlantaParser.js";
import { OpDeclContext } from "./PlantaParser.js";
import { ParamListContext } from "./PlantaParser.js";
import { ParamContext } from "./PlantaParser.js";
import { ApiDeclContext } from "./PlantaParser.js";
import { ProtocolContext } from "./PlantaParser.js";
import { EndpointDeclContext } from "./PlantaParser.js";
import { OperationSigContext } from "./PlantaParser.js";
import { EndpointBodyContext } from "./PlantaParser.js";
import { EndpointItemContext } from "./PlantaParser.js";
import { ParamLocationContext } from "./PlantaParser.js";
import { ChannelDeclContext } from "./PlantaParser.js";
import { EventDeclContext } from "./PlantaParser.js";
import { HandlerDeclContext } from "./PlantaParser.js";
import { JobDeclContext } from "./PlantaParser.js";
import { ProcessDeclContext } from "./PlantaParser.js";
import { ProcessBlockContext } from "./PlantaParser.js";
import { ProcessItemContext } from "./PlantaParser.js";
import { ProcTraceContext } from "./PlantaParser.js";
import { ProcTriggerContext } from "./PlantaParser.js";
import { ProcActorContext } from "./PlantaParser.js";
import { ProcVerifyContext } from "./PlantaParser.js";
import { ProcStepContext } from "./PlantaParser.js";
import { ProcEmitContext } from "./PlantaParser.js";
import { ProcIfContext } from "./PlantaParser.js";
import { ProcParallelContext } from "./PlantaParser.js";
import { ProcForeachContext } from "./PlantaParser.js";
import { ProcWaitContext } from "./PlantaParser.js";
import { ProcFailContext } from "./PlantaParser.js";
import { ProcReturnContext } from "./PlantaParser.js";
import { IfTailContext } from "./PlantaParser.js";
import { StepTargetContext } from "./PlantaParser.js";
import { EmitStmtContext } from "./PlantaParser.js";
import { AppDeclContext } from "./PlantaParser.js";
import { AppItemContext } from "./PlantaParser.js";
import { RouteDeclContext } from "./PlantaParser.js";
import { TraceClauseContext } from "./PlantaParser.js";
import { TraceRefContext } from "./PlantaParser.js";
import { DeploymentDeclContext } from "./PlantaParser.js";
import { DeployItemContext } from "./PlantaParser.js";
import { GroupDeclContext } from "./PlantaParser.js";
import { GroupKindContext } from "./PlantaParser.js";
import { NodeDeclContext } from "./PlantaParser.js";
import { ResourceTypeContext } from "./PlantaParser.js";
import { NodeClauseContext } from "./PlantaParser.js";
import { NodePropContext } from "./PlantaParser.js";
import { ConnectionContext } from "./PlantaParser.js";
import { RuleDeclContext } from "./PlantaParser.js";
import { RuleStmtContext } from "./PlantaParser.js";
import { SubjectContext } from "./PlantaParser.js";
import { ModalityContext } from "./PlantaParser.js";
import { PredicateContext } from "./PlantaParser.js";
import { PropertyContext } from "./PlantaParser.js";
import { AnchorWordContext } from "./PlantaParser.js";
import { ExceptionContext } from "./PlantaParser.js";
import { ElementKindContext } from "./PlantaParser.js";
import { ViewDeclContext } from "./PlantaParser.js";
import { ViewKindContext } from "./PlantaParser.js";
import { ViewItemContext } from "./PlantaParser.js";
import { ViewSelectorContext } from "./PlantaParser.js";
import { AnchorContext } from "./PlantaParser.js";
import { QualifiedNameContext } from "./PlantaParser.js";
import { QualifiedNameListContext } from "./PlantaParser.js";
import { LiteralListContext } from "./PlantaParser.js";
import { LiteralContext } from "./PlantaParser.js";
import { NameContext } from "./PlantaParser.js";


/**
 * This interface defines a complete listener for a parse tree produced by
 * `PlantaParser`.
 */
export class PlantaListener implements ParseTreeListener {
    /**
     * Enter a parse tree produced by `PlantaParser.file`.
     * @param ctx the parse tree
     */
    enterFile?: (ctx: FileContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.file`.
     * @param ctx the parse tree
     */
    exitFile?: (ctx: FileContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.useDecl`.
     * @param ctx the parse tree
     */
    enterUseDecl?: (ctx: UseDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.useDecl`.
     * @param ctx the parse tree
     */
    exitUseDecl?: (ctx: UseDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.topDecl`.
     * @param ctx the parse tree
     */
    enterTopDecl?: (ctx: TopDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.topDecl`.
     * @param ctx the parse tree
     */
    exitTopDecl?: (ctx: TopDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.meta`.
     * @param ctx the parse tree
     */
    enterMeta?: (ctx: MetaContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.meta`.
     * @param ctx the parse tree
     */
    exitMeta?: (ctx: MetaContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.annotation`.
     * @param ctx the parse tree
     */
    enterAnnotation?: (ctx: AnnotationContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.annotation`.
     * @param ctx the parse tree
     */
    exitAnnotation?: (ctx: AnnotationContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.annotationItem`.
     * @param ctx the parse tree
     */
    enterAnnotationItem?: (ctx: AnnotationItemContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.annotationItem`.
     * @param ctx the parse tree
     */
    exitAnnotationItem?: (ctx: AnnotationItemContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.systemDecl`.
     * @param ctx the parse tree
     */
    enterSystemDecl?: (ctx: SystemDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.systemDecl`.
     * @param ctx the parse tree
     */
    exitSystemDecl?: (ctx: SystemDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.systemItem`.
     * @param ctx the parse tree
     */
    enterSystemItem?: (ctx: SystemItemContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.systemItem`.
     * @param ctx the parse tree
     */
    exitSystemItem?: (ctx: SystemItemContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.layerDecl`.
     * @param ctx the parse tree
     */
    enterLayerDecl?: (ctx: LayerDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.layerDecl`.
     * @param ctx the parse tree
     */
    exitLayerDecl?: (ctx: LayerDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.actorDecl`.
     * @param ctx the parse tree
     */
    enterActorDecl?: (ctx: ActorDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.actorDecl`.
     * @param ctx the parse tree
     */
    exitActorDecl?: (ctx: ActorDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.externalDecl`.
     * @param ctx the parse tree
     */
    enterExternalDecl?: (ctx: ExternalDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.externalDecl`.
     * @param ctx the parse tree
     */
    exitExternalDecl?: (ctx: ExternalDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.requirementDecl`.
     * @param ctx the parse tree
     */
    enterRequirementDecl?: (ctx: RequirementDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.requirementDecl`.
     * @param ctx the parse tree
     */
    exitRequirementDecl?: (ctx: RequirementDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.decisionDecl`.
     * @param ctx the parse tree
     */
    enterDecisionDecl?: (ctx: DecisionDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.decisionDecl`.
     * @param ctx the parse tree
     */
    exitDecisionDecl?: (ctx: DecisionDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.contextDecl`.
     * @param ctx the parse tree
     */
    enterContextDecl?: (ctx: ContextDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.contextDecl`.
     * @param ctx the parse tree
     */
    exitContextDecl?: (ctx: ContextDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.rootClause`.
     * @param ctx the parse tree
     */
    enterRootClause?: (ctx: RootClauseContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.rootClause`.
     * @param ctx the parse tree
     */
    exitRootClause?: (ctx: RootClauseContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.contextMember`.
     * @param ctx the parse tree
     */
    enterContextMember?: (ctx: ContextMemberContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.contextMember`.
     * @param ctx the parse tree
     */
    exitContextMember?: (ctx: ContextMemberContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.entityDecl`.
     * @param ctx the parse tree
     */
    enterEntityDecl?: (ctx: EntityDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.entityDecl`.
     * @param ctx the parse tree
     */
    exitEntityDecl?: (ctx: EntityDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.valueDecl`.
     * @param ctx the parse tree
     */
    enterValueDecl?: (ctx: ValueDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.valueDecl`.
     * @param ctx the parse tree
     */
    exitValueDecl?: (ctx: ValueDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.dtoDecl`.
     * @param ctx the parse tree
     */
    enterDtoDecl?: (ctx: DtoDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.dtoDecl`.
     * @param ctx the parse tree
     */
    exitDtoDecl?: (ctx: DtoDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.fieldBlock`.
     * @param ctx the parse tree
     */
    enterFieldBlock?: (ctx: FieldBlockContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.fieldBlock`.
     * @param ctx the parse tree
     */
    exitFieldBlock?: (ctx: FieldBlockContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.fieldBlockItem`.
     * @param ctx the parse tree
     */
    enterFieldBlockItem?: (ctx: FieldBlockItemContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.fieldBlockItem`.
     * @param ctx the parse tree
     */
    exitFieldBlockItem?: (ctx: FieldBlockItemContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.fieldDecl`.
     * @param ctx the parse tree
     */
    enterFieldDecl?: (ctx: FieldDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.fieldDecl`.
     * @param ctx the parse tree
     */
    exitFieldDecl?: (ctx: FieldDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.fieldModifier`.
     * @param ctx the parse tree
     */
    enterFieldModifier?: (ctx: FieldModifierContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.fieldModifier`.
     * @param ctx the parse tree
     */
    exitFieldModifier?: (ctx: FieldModifierContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.enumDecl`.
     * @param ctx the parse tree
     */
    enterEnumDecl?: (ctx: EnumDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.enumDecl`.
     * @param ctx the parse tree
     */
    exitEnumDecl?: (ctx: EnumDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.aggregateDecl`.
     * @param ctx the parse tree
     */
    enterAggregateDecl?: (ctx: AggregateDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.aggregateDecl`.
     * @param ctx the parse tree
     */
    exitAggregateDecl?: (ctx: AggregateDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.typeRef`.
     * @param ctx the parse tree
     */
    enterTypeRef?: (ctx: TypeRefContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.typeRef`.
     * @param ctx the parse tree
     */
    exitTypeRef?: (ctx: TypeRefContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.componentDecl`.
     * @param ctx the parse tree
     */
    enterComponentDecl?: (ctx: ComponentDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.componentDecl`.
     * @param ctx the parse tree
     */
    exitComponentDecl?: (ctx: ComponentDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.componentKind`.
     * @param ctx the parse tree
     */
    enterComponentKind?: (ctx: ComponentKindContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.componentKind`.
     * @param ctx the parse tree
     */
    exitComponentKind?: (ctx: ComponentKindContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.layerClause`.
     * @param ctx the parse tree
     */
    enterLayerClause?: (ctx: LayerClauseContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.layerClause`.
     * @param ctx the parse tree
     */
    exitLayerClause?: (ctx: LayerClauseContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.componentBody`.
     * @param ctx the parse tree
     */
    enterComponentBody?: (ctx: ComponentBodyContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.componentBody`.
     * @param ctx the parse tree
     */
    exitComponentBody?: (ctx: ComponentBodyContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.componentItem`.
     * @param ctx the parse tree
     */
    enterComponentItem?: (ctx: ComponentItemContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.componentItem`.
     * @param ctx the parse tree
     */
    exitComponentItem?: (ctx: ComponentItemContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.opDecl`.
     * @param ctx the parse tree
     */
    enterOpDecl?: (ctx: OpDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.opDecl`.
     * @param ctx the parse tree
     */
    exitOpDecl?: (ctx: OpDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.paramList`.
     * @param ctx the parse tree
     */
    enterParamList?: (ctx: ParamListContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.paramList`.
     * @param ctx the parse tree
     */
    exitParamList?: (ctx: ParamListContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.param`.
     * @param ctx the parse tree
     */
    enterParam?: (ctx: ParamContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.param`.
     * @param ctx the parse tree
     */
    exitParam?: (ctx: ParamContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.apiDecl`.
     * @param ctx the parse tree
     */
    enterApiDecl?: (ctx: ApiDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.apiDecl`.
     * @param ctx the parse tree
     */
    exitApiDecl?: (ctx: ApiDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.protocol`.
     * @param ctx the parse tree
     */
    enterProtocol?: (ctx: ProtocolContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.protocol`.
     * @param ctx the parse tree
     */
    exitProtocol?: (ctx: ProtocolContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.endpointDecl`.
     * @param ctx the parse tree
     */
    enterEndpointDecl?: (ctx: EndpointDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.endpointDecl`.
     * @param ctx the parse tree
     */
    exitEndpointDecl?: (ctx: EndpointDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.operationSig`.
     * @param ctx the parse tree
     */
    enterOperationSig?: (ctx: OperationSigContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.operationSig`.
     * @param ctx the parse tree
     */
    exitOperationSig?: (ctx: OperationSigContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.endpointBody`.
     * @param ctx the parse tree
     */
    enterEndpointBody?: (ctx: EndpointBodyContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.endpointBody`.
     * @param ctx the parse tree
     */
    exitEndpointBody?: (ctx: EndpointBodyContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.endpointItem`.
     * @param ctx the parse tree
     */
    enterEndpointItem?: (ctx: EndpointItemContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.endpointItem`.
     * @param ctx the parse tree
     */
    exitEndpointItem?: (ctx: EndpointItemContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.paramLocation`.
     * @param ctx the parse tree
     */
    enterParamLocation?: (ctx: ParamLocationContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.paramLocation`.
     * @param ctx the parse tree
     */
    exitParamLocation?: (ctx: ParamLocationContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.channelDecl`.
     * @param ctx the parse tree
     */
    enterChannelDecl?: (ctx: ChannelDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.channelDecl`.
     * @param ctx the parse tree
     */
    exitChannelDecl?: (ctx: ChannelDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.eventDecl`.
     * @param ctx the parse tree
     */
    enterEventDecl?: (ctx: EventDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.eventDecl`.
     * @param ctx the parse tree
     */
    exitEventDecl?: (ctx: EventDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.handlerDecl`.
     * @param ctx the parse tree
     */
    enterHandlerDecl?: (ctx: HandlerDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.handlerDecl`.
     * @param ctx the parse tree
     */
    exitHandlerDecl?: (ctx: HandlerDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.jobDecl`.
     * @param ctx the parse tree
     */
    enterJobDecl?: (ctx: JobDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.jobDecl`.
     * @param ctx the parse tree
     */
    exitJobDecl?: (ctx: JobDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.processDecl`.
     * @param ctx the parse tree
     */
    enterProcessDecl?: (ctx: ProcessDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.processDecl`.
     * @param ctx the parse tree
     */
    exitProcessDecl?: (ctx: ProcessDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.processBlock`.
     * @param ctx the parse tree
     */
    enterProcessBlock?: (ctx: ProcessBlockContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.processBlock`.
     * @param ctx the parse tree
     */
    exitProcessBlock?: (ctx: ProcessBlockContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.processItem`.
     * @param ctx the parse tree
     */
    enterProcessItem?: (ctx: ProcessItemContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.processItem`.
     * @param ctx the parse tree
     */
    exitProcessItem?: (ctx: ProcessItemContext) => void;
    /**
     * Enter a parse tree produced by the `procTrace`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     */
    enterProcTrace?: (ctx: ProcTraceContext) => void;
    /**
     * Exit a parse tree produced by the `procTrace`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     */
    exitProcTrace?: (ctx: ProcTraceContext) => void;
    /**
     * Enter a parse tree produced by the `procTrigger`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     */
    enterProcTrigger?: (ctx: ProcTriggerContext) => void;
    /**
     * Exit a parse tree produced by the `procTrigger`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     */
    exitProcTrigger?: (ctx: ProcTriggerContext) => void;
    /**
     * Enter a parse tree produced by the `procActor`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     */
    enterProcActor?: (ctx: ProcActorContext) => void;
    /**
     * Exit a parse tree produced by the `procActor`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     */
    exitProcActor?: (ctx: ProcActorContext) => void;
    /**
     * Enter a parse tree produced by the `procVerify`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     */
    enterProcVerify?: (ctx: ProcVerifyContext) => void;
    /**
     * Exit a parse tree produced by the `procVerify`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     */
    exitProcVerify?: (ctx: ProcVerifyContext) => void;
    /**
     * Enter a parse tree produced by the `procStep`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     */
    enterProcStep?: (ctx: ProcStepContext) => void;
    /**
     * Exit a parse tree produced by the `procStep`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     */
    exitProcStep?: (ctx: ProcStepContext) => void;
    /**
     * Enter a parse tree produced by the `procEmit`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     */
    enterProcEmit?: (ctx: ProcEmitContext) => void;
    /**
     * Exit a parse tree produced by the `procEmit`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     */
    exitProcEmit?: (ctx: ProcEmitContext) => void;
    /**
     * Enter a parse tree produced by the `procIf`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     */
    enterProcIf?: (ctx: ProcIfContext) => void;
    /**
     * Exit a parse tree produced by the `procIf`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     */
    exitProcIf?: (ctx: ProcIfContext) => void;
    /**
     * Enter a parse tree produced by the `procParallel`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     */
    enterProcParallel?: (ctx: ProcParallelContext) => void;
    /**
     * Exit a parse tree produced by the `procParallel`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     */
    exitProcParallel?: (ctx: ProcParallelContext) => void;
    /**
     * Enter a parse tree produced by the `procForeach`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     */
    enterProcForeach?: (ctx: ProcForeachContext) => void;
    /**
     * Exit a parse tree produced by the `procForeach`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     */
    exitProcForeach?: (ctx: ProcForeachContext) => void;
    /**
     * Enter a parse tree produced by the `procWait`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     */
    enterProcWait?: (ctx: ProcWaitContext) => void;
    /**
     * Exit a parse tree produced by the `procWait`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     */
    exitProcWait?: (ctx: ProcWaitContext) => void;
    /**
     * Enter a parse tree produced by the `procFail`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     */
    enterProcFail?: (ctx: ProcFailContext) => void;
    /**
     * Exit a parse tree produced by the `procFail`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     */
    exitProcFail?: (ctx: ProcFailContext) => void;
    /**
     * Enter a parse tree produced by the `procReturn`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     */
    enterProcReturn?: (ctx: ProcReturnContext) => void;
    /**
     * Exit a parse tree produced by the `procReturn`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     */
    exitProcReturn?: (ctx: ProcReturnContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.ifTail`.
     * @param ctx the parse tree
     */
    enterIfTail?: (ctx: IfTailContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.ifTail`.
     * @param ctx the parse tree
     */
    exitIfTail?: (ctx: IfTailContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.stepTarget`.
     * @param ctx the parse tree
     */
    enterStepTarget?: (ctx: StepTargetContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.stepTarget`.
     * @param ctx the parse tree
     */
    exitStepTarget?: (ctx: StepTargetContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.emitStmt`.
     * @param ctx the parse tree
     */
    enterEmitStmt?: (ctx: EmitStmtContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.emitStmt`.
     * @param ctx the parse tree
     */
    exitEmitStmt?: (ctx: EmitStmtContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.appDecl`.
     * @param ctx the parse tree
     */
    enterAppDecl?: (ctx: AppDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.appDecl`.
     * @param ctx the parse tree
     */
    exitAppDecl?: (ctx: AppDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.appItem`.
     * @param ctx the parse tree
     */
    enterAppItem?: (ctx: AppItemContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.appItem`.
     * @param ctx the parse tree
     */
    exitAppItem?: (ctx: AppItemContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.routeDecl`.
     * @param ctx the parse tree
     */
    enterRouteDecl?: (ctx: RouteDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.routeDecl`.
     * @param ctx the parse tree
     */
    exitRouteDecl?: (ctx: RouteDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.traceClause`.
     * @param ctx the parse tree
     */
    enterTraceClause?: (ctx: TraceClauseContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.traceClause`.
     * @param ctx the parse tree
     */
    exitTraceClause?: (ctx: TraceClauseContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.traceRef`.
     * @param ctx the parse tree
     */
    enterTraceRef?: (ctx: TraceRefContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.traceRef`.
     * @param ctx the parse tree
     */
    exitTraceRef?: (ctx: TraceRefContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.deploymentDecl`.
     * @param ctx the parse tree
     */
    enterDeploymentDecl?: (ctx: DeploymentDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.deploymentDecl`.
     * @param ctx the parse tree
     */
    exitDeploymentDecl?: (ctx: DeploymentDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.deployItem`.
     * @param ctx the parse tree
     */
    enterDeployItem?: (ctx: DeployItemContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.deployItem`.
     * @param ctx the parse tree
     */
    exitDeployItem?: (ctx: DeployItemContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.groupDecl`.
     * @param ctx the parse tree
     */
    enterGroupDecl?: (ctx: GroupDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.groupDecl`.
     * @param ctx the parse tree
     */
    exitGroupDecl?: (ctx: GroupDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.groupKind`.
     * @param ctx the parse tree
     */
    enterGroupKind?: (ctx: GroupKindContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.groupKind`.
     * @param ctx the parse tree
     */
    exitGroupKind?: (ctx: GroupKindContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.nodeDecl`.
     * @param ctx the parse tree
     */
    enterNodeDecl?: (ctx: NodeDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.nodeDecl`.
     * @param ctx the parse tree
     */
    exitNodeDecl?: (ctx: NodeDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.resourceType`.
     * @param ctx the parse tree
     */
    enterResourceType?: (ctx: ResourceTypeContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.resourceType`.
     * @param ctx the parse tree
     */
    exitResourceType?: (ctx: ResourceTypeContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.nodeClause`.
     * @param ctx the parse tree
     */
    enterNodeClause?: (ctx: NodeClauseContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.nodeClause`.
     * @param ctx the parse tree
     */
    exitNodeClause?: (ctx: NodeClauseContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.nodeProp`.
     * @param ctx the parse tree
     */
    enterNodeProp?: (ctx: NodePropContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.nodeProp`.
     * @param ctx the parse tree
     */
    exitNodeProp?: (ctx: NodePropContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.connection`.
     * @param ctx the parse tree
     */
    enterConnection?: (ctx: ConnectionContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.connection`.
     * @param ctx the parse tree
     */
    exitConnection?: (ctx: ConnectionContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.ruleDecl`.
     * @param ctx the parse tree
     */
    enterRuleDecl?: (ctx: RuleDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.ruleDecl`.
     * @param ctx the parse tree
     */
    exitRuleDecl?: (ctx: RuleDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.ruleStmt`.
     * @param ctx the parse tree
     */
    enterRuleStmt?: (ctx: RuleStmtContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.ruleStmt`.
     * @param ctx the parse tree
     */
    exitRuleStmt?: (ctx: RuleStmtContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.subject`.
     * @param ctx the parse tree
     */
    enterSubject?: (ctx: SubjectContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.subject`.
     * @param ctx the parse tree
     */
    exitSubject?: (ctx: SubjectContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.modality`.
     * @param ctx the parse tree
     */
    enterModality?: (ctx: ModalityContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.modality`.
     * @param ctx the parse tree
     */
    exitModality?: (ctx: ModalityContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.predicate`.
     * @param ctx the parse tree
     */
    enterPredicate?: (ctx: PredicateContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.predicate`.
     * @param ctx the parse tree
     */
    exitPredicate?: (ctx: PredicateContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.property`.
     * @param ctx the parse tree
     */
    enterProperty?: (ctx: PropertyContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.property`.
     * @param ctx the parse tree
     */
    exitProperty?: (ctx: PropertyContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.anchorWord`.
     * @param ctx the parse tree
     */
    enterAnchorWord?: (ctx: AnchorWordContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.anchorWord`.
     * @param ctx the parse tree
     */
    exitAnchorWord?: (ctx: AnchorWordContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.exception`.
     * @param ctx the parse tree
     */
    enterException?: (ctx: ExceptionContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.exception`.
     * @param ctx the parse tree
     */
    exitException?: (ctx: ExceptionContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.elementKind`.
     * @param ctx the parse tree
     */
    enterElementKind?: (ctx: ElementKindContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.elementKind`.
     * @param ctx the parse tree
     */
    exitElementKind?: (ctx: ElementKindContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.viewDecl`.
     * @param ctx the parse tree
     */
    enterViewDecl?: (ctx: ViewDeclContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.viewDecl`.
     * @param ctx the parse tree
     */
    exitViewDecl?: (ctx: ViewDeclContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.viewKind`.
     * @param ctx the parse tree
     */
    enterViewKind?: (ctx: ViewKindContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.viewKind`.
     * @param ctx the parse tree
     */
    exitViewKind?: (ctx: ViewKindContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.viewItem`.
     * @param ctx the parse tree
     */
    enterViewItem?: (ctx: ViewItemContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.viewItem`.
     * @param ctx the parse tree
     */
    exitViewItem?: (ctx: ViewItemContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.viewSelector`.
     * @param ctx the parse tree
     */
    enterViewSelector?: (ctx: ViewSelectorContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.viewSelector`.
     * @param ctx the parse tree
     */
    exitViewSelector?: (ctx: ViewSelectorContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.anchor`.
     * @param ctx the parse tree
     */
    enterAnchor?: (ctx: AnchorContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.anchor`.
     * @param ctx the parse tree
     */
    exitAnchor?: (ctx: AnchorContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.qualifiedName`.
     * @param ctx the parse tree
     */
    enterQualifiedName?: (ctx: QualifiedNameContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.qualifiedName`.
     * @param ctx the parse tree
     */
    exitQualifiedName?: (ctx: QualifiedNameContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.qualifiedNameList`.
     * @param ctx the parse tree
     */
    enterQualifiedNameList?: (ctx: QualifiedNameListContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.qualifiedNameList`.
     * @param ctx the parse tree
     */
    exitQualifiedNameList?: (ctx: QualifiedNameListContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.literalList`.
     * @param ctx the parse tree
     */
    enterLiteralList?: (ctx: LiteralListContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.literalList`.
     * @param ctx the parse tree
     */
    exitLiteralList?: (ctx: LiteralListContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.literal`.
     * @param ctx the parse tree
     */
    enterLiteral?: (ctx: LiteralContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.literal`.
     * @param ctx the parse tree
     */
    exitLiteral?: (ctx: LiteralContext) => void;
    /**
     * Enter a parse tree produced by `PlantaParser.name`.
     * @param ctx the parse tree
     */
    enterName?: (ctx: NameContext) => void;
    /**
     * Exit a parse tree produced by `PlantaParser.name`.
     * @param ctx the parse tree
     */
    exitName?: (ctx: NameContext) => void;

    visitTerminal(node: TerminalNode): void {}
    visitErrorNode(node: ErrorNode): void {}
    enterEveryRule(node: ParserRuleContext): void {}
    exitEveryRule(node: ParserRuleContext): void {}
}

