
import { AbstractParseTreeVisitor } from "antlr4ng";


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
 * This interface defines a complete generic visitor for a parse tree produced
 * by `PlantaParser`.
 *
 * @param <Result> The return type of the visit operation. Use `void` for
 * operations with no return type.
 */
export class PlantaVisitor<Result> extends AbstractParseTreeVisitor<Result> {
    /**
     * Visit a parse tree produced by `PlantaParser.file`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFile?: (ctx: FileContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.useDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitUseDecl?: (ctx: UseDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.topDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTopDecl?: (ctx: TopDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.meta`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitMeta?: (ctx: MetaContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.annotation`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAnnotation?: (ctx: AnnotationContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.annotationItem`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAnnotationItem?: (ctx: AnnotationItemContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.systemDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSystemDecl?: (ctx: SystemDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.systemItem`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSystemItem?: (ctx: SystemItemContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.layerDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLayerDecl?: (ctx: LayerDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.actorDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitActorDecl?: (ctx: ActorDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.externalDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitExternalDecl?: (ctx: ExternalDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.requirementDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRequirementDecl?: (ctx: RequirementDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.decisionDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDecisionDecl?: (ctx: DecisionDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.contextDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitContextDecl?: (ctx: ContextDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.rootClause`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRootClause?: (ctx: RootClauseContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.contextMember`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitContextMember?: (ctx: ContextMemberContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.entityDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitEntityDecl?: (ctx: EntityDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.valueDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitValueDecl?: (ctx: ValueDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.dtoDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDtoDecl?: (ctx: DtoDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.fieldBlock`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFieldBlock?: (ctx: FieldBlockContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.fieldBlockItem`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFieldBlockItem?: (ctx: FieldBlockItemContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.fieldDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFieldDecl?: (ctx: FieldDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.fieldModifier`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFieldModifier?: (ctx: FieldModifierContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.enumDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitEnumDecl?: (ctx: EnumDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.aggregateDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAggregateDecl?: (ctx: AggregateDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.typeRef`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTypeRef?: (ctx: TypeRefContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.componentDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitComponentDecl?: (ctx: ComponentDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.componentKind`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitComponentKind?: (ctx: ComponentKindContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.layerClause`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLayerClause?: (ctx: LayerClauseContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.componentBody`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitComponentBody?: (ctx: ComponentBodyContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.componentItem`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitComponentItem?: (ctx: ComponentItemContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.opDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitOpDecl?: (ctx: OpDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.paramList`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitParamList?: (ctx: ParamListContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.param`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitParam?: (ctx: ParamContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.apiDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitApiDecl?: (ctx: ApiDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.protocol`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitProtocol?: (ctx: ProtocolContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.endpointDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitEndpointDecl?: (ctx: EndpointDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.operationSig`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitOperationSig?: (ctx: OperationSigContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.endpointBody`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitEndpointBody?: (ctx: EndpointBodyContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.endpointItem`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitEndpointItem?: (ctx: EndpointItemContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.paramLocation`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitParamLocation?: (ctx: ParamLocationContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.channelDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitChannelDecl?: (ctx: ChannelDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.eventDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitEventDecl?: (ctx: EventDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.handlerDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitHandlerDecl?: (ctx: HandlerDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.jobDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitJobDecl?: (ctx: JobDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.processDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitProcessDecl?: (ctx: ProcessDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.processBlock`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitProcessBlock?: (ctx: ProcessBlockContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.processItem`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitProcessItem?: (ctx: ProcessItemContext) => Result;
    /**
     * Visit a parse tree produced by the `procTrace`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitProcTrace?: (ctx: ProcTraceContext) => Result;
    /**
     * Visit a parse tree produced by the `procTrigger`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitProcTrigger?: (ctx: ProcTriggerContext) => Result;
    /**
     * Visit a parse tree produced by the `procActor`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitProcActor?: (ctx: ProcActorContext) => Result;
    /**
     * Visit a parse tree produced by the `procVerify`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitProcVerify?: (ctx: ProcVerifyContext) => Result;
    /**
     * Visit a parse tree produced by the `procStep`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitProcStep?: (ctx: ProcStepContext) => Result;
    /**
     * Visit a parse tree produced by the `procEmit`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitProcEmit?: (ctx: ProcEmitContext) => Result;
    /**
     * Visit a parse tree produced by the `procIf`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitProcIf?: (ctx: ProcIfContext) => Result;
    /**
     * Visit a parse tree produced by the `procParallel`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitProcParallel?: (ctx: ProcParallelContext) => Result;
    /**
     * Visit a parse tree produced by the `procForeach`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitProcForeach?: (ctx: ProcForeachContext) => Result;
    /**
     * Visit a parse tree produced by the `procWait`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitProcWait?: (ctx: ProcWaitContext) => Result;
    /**
     * Visit a parse tree produced by the `procFail`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitProcFail?: (ctx: ProcFailContext) => Result;
    /**
     * Visit a parse tree produced by the `procReturn`
     * labeled alternative in `PlantaParser.processStmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitProcReturn?: (ctx: ProcReturnContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.ifTail`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitIfTail?: (ctx: IfTailContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.stepTarget`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitStepTarget?: (ctx: StepTargetContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.emitStmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitEmitStmt?: (ctx: EmitStmtContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.appDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAppDecl?: (ctx: AppDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.appItem`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAppItem?: (ctx: AppItemContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.routeDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRouteDecl?: (ctx: RouteDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.traceClause`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTraceClause?: (ctx: TraceClauseContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.traceRef`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTraceRef?: (ctx: TraceRefContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.deploymentDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDeploymentDecl?: (ctx: DeploymentDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.deployItem`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDeployItem?: (ctx: DeployItemContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.groupDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGroupDecl?: (ctx: GroupDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.groupKind`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGroupKind?: (ctx: GroupKindContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.nodeDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitNodeDecl?: (ctx: NodeDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.resourceType`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitResourceType?: (ctx: ResourceTypeContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.nodeClause`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitNodeClause?: (ctx: NodeClauseContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.nodeProp`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitNodeProp?: (ctx: NodePropContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.connection`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitConnection?: (ctx: ConnectionContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.ruleDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRuleDecl?: (ctx: RuleDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.ruleStmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRuleStmt?: (ctx: RuleStmtContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.subject`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSubject?: (ctx: SubjectContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.modality`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitModality?: (ctx: ModalityContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.predicate`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPredicate?: (ctx: PredicateContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.property`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitProperty?: (ctx: PropertyContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.anchorWord`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAnchorWord?: (ctx: AnchorWordContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.exception`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitException?: (ctx: ExceptionContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.elementKind`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitElementKind?: (ctx: ElementKindContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.viewDecl`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitViewDecl?: (ctx: ViewDeclContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.viewKind`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitViewKind?: (ctx: ViewKindContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.viewItem`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitViewItem?: (ctx: ViewItemContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.viewSelector`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitViewSelector?: (ctx: ViewSelectorContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.anchor`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAnchor?: (ctx: AnchorContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.qualifiedName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitQualifiedName?: (ctx: QualifiedNameContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.qualifiedNameList`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitQualifiedNameList?: (ctx: QualifiedNameListContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.literalList`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLiteralList?: (ctx: LiteralListContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.literal`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLiteral?: (ctx: LiteralContext) => Result;
    /**
     * Visit a parse tree produced by `PlantaParser.name`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitName?: (ctx: NameContext) => Result;
}

