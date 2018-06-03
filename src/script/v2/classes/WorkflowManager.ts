import * as _ from "lodash";
import * as mongoose from "mongoose";
import { Document, Schema } from "mongoose";
import { Observable } from "rx";
import { UpdateResponse } from "./Constants";
import { Tutor, UserManager } from "./UserManager";

/**
 * Define enum for status available in workflow node
 * 
 * @export
 * @enum {number}
 */
export enum Status {
    NONE = "none",
    NOTE = "note",
    TODO = "todo",
    IN_PROGRESS = "inprogress",
    ASSIGN = "assign",
    DONE = "done",
    COMPLETE = "complete"
}

/**
 * Decalre interface for node
 * 
 * @export
 * @interface NodeInterface
 * @extends {Document}
 */
interface NodeInterface extends Document {
    header: Boolean,
    timestamp: Date,
    createdBy: Number
}

/**
 * Decalre interface for header node
 * 
 * @export
 * @interface HeaderInterface
 * @extends {Node}
 */
interface HeaderInterface extends NodeInterface {
    title: String,
    tag: String
}

/**
 * Decalre interface for body node
 * 
 * @export
 * @interface BodyNode
 * @extends {Node}
 */
interface BodyInterface extends NodeInterface {
    duedate?: Date,
    status: String,
    owner: Number,
    subtitle: String,
    detail: String,
    parent?: mongoose.Types.ObjectId,
    ancestors?: mongoose.Types.ObjectId[]
}


interface NodeResponseInterface {
    nodeID: mongoose.Types.ObjectId
    title: string,
    timestamp: Date,
    createdBy: number,
    duedate?: Date,
    status: string,
    owner: number,
    subtitle: string,
    detail: string,
    parent?: mongoose.Types.ObjectId,
    ancestors?: mongoose.Types.ObjectId[],
    tag: string,
    childStatus: string,
    childOwner: number,
    childOwnerName: string,
    canDelete: Boolean
}

/**
 * Create mongoose schema
 */
let headerSchema = new Schema({
    header: {
        type: Boolean,
        default: true
    },
    timestamp: {
        type: Date,
        default: new Date()
    },
    createdBy: Number,
    title: String,
    tag: String
});

let nodeSchema = new Schema({
    header: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: new Date()
    },
    createdBy: Number,
    duedate: {
        type: Date,
        default: null
    },
    status: String,
    owner: Number,
    subtitle: String,
    detail: String,
    parent: {
        type: Schema.Types.ObjectId,
        default: null
    },
    ancestors: {
        type: [Schema.Types.ObjectId],
        default: []
    }
});

/**
 * Create model from schema
 */
let HeaderModel = mongoose.model<HeaderInterface>("Header", headerSchema, "workflow");
let NodeModel = mongoose.model<BodyInterface>("Node", nodeSchema, "workflow");

abstract class Node<T extends NodeInterface> {

    protected node: T

    constructor(node: T) {
        this.node = node;
    }

    getID(): mongoose.Types.ObjectId {
        return this.node._id;
    }

    getCreatedUser(): Observable<Tutor> {
        return UserManager.getTutorInfo(this.node.createdBy.valueOf());
    }

    getChild(): Observable<BodyNode[]> {
        return Observable.fromPromise(NodeModel.find({
            ancestors: this.getID()
        })).map(nodes => nodes.map(node => new BodyNode(node)));
    }

    getInterface(): T {
        return this.node;
    }

    getTimestamp(): Date {
        return this.getID().getTimestamp();
    }

    getTimestampString(): String {
        let time = this.getID().getTimestamp();
        let min = time.getMinutes() + "";
        if (min.length === 1) min = "0" + min;
        return time.getDate() + "/" + (time.getMonth() + 1) + "/" + time.getFullYear() + " " + time.getHours() + ":" + min;
    }

    getCreatedBy(): number {
        return this.node.createdBy.valueOf();
    }
}

export class HeaderNode extends Node<HeaderInterface> {

    constructor(header: HeaderInterface) {
        super(header);
    }

    getTitle(): string {
        return this.node.title.valueOf();
    }

    setTitle(title: string): Observable<HeaderNode> {
        return Observable.fromPromise(HeaderModel.findByIdAndUpdate(this.getID(), {
            $set: {
                title: title
            }
        })).map(header => new HeaderNode(header));
    }

    getTag(): string {
        try {
            return this.node.tag.valueOf();
        } catch (error) {
            return "other";
        }
    }
}

export class BodyNode extends Node<BodyInterface> {

    constructor(body: BodyInterface) {
        super(body);
    }

    getDuedate(): Date {
        return this.node.duedate;
    }

    setDuedate(date: Date): Observable<BodyNode> {
        return this.edit({
            duedate: date
        });
    }

    getStatus(): string {
        return this.node.status.valueOf();
    }

    setStatus(status: string): Observable<BodyNode> {
        return this.edit({
            status: status
        });
    }

    getOwner(): number {
        return this.node.owner.valueOf();
    }

    setOwner(owner: number): Observable<BodyNode> {
        return this.edit({
            owner: owner
        });
    }

    getSubtitle(): string {
        return this.node.subtitle.valueOf();
    }

    setSubtitle(subtitle: string): Observable<BodyNode> {
        return this.edit({
            subtitle: subtitle
        });
    }

    getDetail(): string {
        return this.node.detail.valueOf();
    }

    setDetail(detail: string): Observable<BodyNode> {
        return this.edit({
            detail: detail
        });
    }

    getParentID(): mongoose.Types.ObjectId {
        return this.node.parent;
    }

    getParent(): Observable<BodyNode> | Observable<null> {
        return this.isParentHeader().flatMap(isHeader => {
            if (isHeader) {
                return null;
            } else {
                return Observable.fromPromise(NodeModel.findById(this.getParentID()))
                    .map(parent => new BodyNode(parent));
            }
        });
    }

    setParent(parentNode: BodyNode): Observable<BodyNode> {
        let ancestors = parentNode.getAncestorsID();
        ancestors.push(parentNode.getID());
        this.node.ancestors = ancestors;
        return this.edit({
            parent: parentNode.getID(),
            ancestors: ancestors
        });
    }

    getAncestorsID(): mongoose.Types.ObjectId[] {
        return this.node.ancestors;
    }

    getHeaderID(): mongoose.Types.ObjectId {
        return this.node.ancestors[0];
    }

    getHeader(): Observable<HeaderNode> {
        return Observable.fromPromise(HeaderModel.findById(this.getHeaderID()))
            .map(header => new HeaderNode(header));
    }

    getOwnerDetail(): Observable<Tutor> {
        return UserManager.getTutorInfo(this.getOwner());
    }

    appendWithStatus(status: string): Observable<BodyNode> {
        return WorkflowManager.clone(this).flatMap(newNode => {
            return newNode.setStatus(status);
        }).flatMap(newNode => {
            return newNode.setParent(this);
        });
    }

    private edit(value: any): Observable<BodyNode> {
        return Observable.fromPromise(NodeModel.findByIdAndUpdate(this.getID(), {
            $set: value
        })).map(node => new BodyNode(node));
    }

    isParentHeader(): Observable<boolean> {
        return Observable.fromPromise(NodeModel.findById(this.getID()))
            .map(parent => parent.header.valueOf());
    }

    getTree(): Observable<BodyNode[]> {
        return this.getHeader().flatMap(header => header.getChild());
    }

    getParentTree(): Observable<BodyNode[]> {
        return this.getTree()
            .map(bodynodes => _.dropRightWhile(bodynodes, o => o.getID().equals(this.getID())));
    }

    getParentBranchNode(): Observable<BodyNode> {
        return this.getParentTree().map(bodynodes => {
            let order: Number[] = [];
            _.forEach(bodynodes, node => {
                let id = node.getOwner();
                if (_.indexOf(order, id) === -1) {
                    order.push(id);
                }
            });

            let returnNode: BodyNode = null;
            let parentIndex = _.indexOf(order, this.getOwner()) - 1;
            if (parentIndex < 0) return null;
            let parentID = order[parentIndex];
            _.forEachRight(bodynodes, node => {
                if (node.getOwner() === parentID && returnNode == null) {
                    returnNode = node;
                }
            });
            return returnNode;
        });
    }

}

/**
 * Class provide method for handle all workflow database operation
 * 
 * @export
 * @class WorkflowManager
 */
export class WorkflowManager {

    /**
     * This method create header and body node
     * 
     * @static
     * @param {number} userID id of creater of workflow
     * @param {string} title title of the workflow
     * @param {string} subtitle subtitle of the workflow
     * @param {string} [detail] detail of the workflow put in body node
     * @param {string} [tag] tag of the workflow put in body node
     * @param {Date} [duedate] duedate of the workflow in body node
     * @returns {Observable<BodyNode>} the body node after appened to the header node
     * @memberof WorkflowManager
     */
    static create(userID: number,
        title: string,
        subtitle: string,
        detail?: string,
        tag?: string,
        duedate?: Date): Observable<BodyNode> {
        let workflowTag: string;
        let workflowDuedate: Date;

        if (tag) workflowTag = tag;
        else workflowTag = "Other";

        if (duedate) workflowDuedate = duedate;
        else workflowDuedate = null;

        let header = new HeaderModel({
            createdBy: userID,
            title: title,
            tag: tag
        });
        return Observable.fromPromise(header.save()).flatMap(header => {
            return this.createBodyNode(Status.NOTE,
                userID,
                userID,
                workflowDuedate,
                subtitle,
                detail,
                header._id,
                [header._id]);
        });
    }

    /**
     * Delete the entrie workflow of the input header node
     * 
     * @static
     * @param {HeaderNode} header header of workflow to be delete
     * @returns {Observable<UpdateResponse[]>} Result of deleted workflow
     * @memberof WorkflowManager
     */
    static delete(header: HeaderNode): Observable<UpdateResponse[]> {
        return Observable.zip(
            Observable.fromPromise(HeaderModel.deleteOne({
                _id: header.getID()
            })),
            Observable.fromPromise(NodeModel.deleteMany({
                ancestors: header.getID()
            }))
        );
    }

    /**
     * Get header node of the input id
     * 
     * @static
     * @param {(mongoose.Types.ObjectId | string)} nodeID header node id
     * @returns {Observable<HeaderNode>} header node object
     * @memberof WorkflowManager
     */
    static getHeaderNode(nodeID: mongoose.Types.ObjectId | string): Observable<HeaderNode> {
        if (typeof nodeID === "string") nodeID = new mongoose.Types.ObjectId(nodeID);
        return Observable.fromPromise(HeaderModel.findById(nodeID))
            .map(node => new HeaderNode(node));
    }

    /**
     * Get body node of the input id
     * 
     * @static
     * @param {(mongoose.Types.ObjectId | string)} nodeID body node id
     * @returns {Observable<BodyNode>} body node object
     * @memberof WorkflowManager
     */
    static getBodyNode(nodeID: mongoose.Types.ObjectId | string): Observable<BodyNode> {
        if (typeof nodeID === "string") nodeID = new mongoose.Types.ObjectId(nodeID);
        return Observable.fromPromise(NodeModel.findById(nodeID))
            .map(node => new BodyNode(node));
    }

    /**
     * Create new body node and return that node
     * 
     * @static
     * @param {string} status status of the body node
     * @param {number} owner user id of the owner of the node
     * @param {number} createdBy user id of the one who create this node
     * @param {Date} duedate duedate of the node, undefine if not specify
     * @param {string} subtitle subtitle of the node, undefine if not specify
     * @param {string} detail detail of the node, undefine if not spectfy
     * @param {mongoose.Types.ObjectId} parent object id of the parent node
     * @param {mongoose.Types.ObjectId[]} ancestors array of object id of all parent node
     * @returns {Observable<BodyNode>} 
     * @memberof WorkflowManager
     */
    static createBodyNode(status: string, owner: number, createdBy: number, duedate: Date, subtitle: string, detail: string,
        parent: mongoose.Types.ObjectId, ancestors: mongoose.Types.ObjectId[]): Observable<BodyNode> {
        let node = new NodeModel({
            status: status,
            owner: owner,
            createdBy: createdBy,
            duedate: duedate,
            subtitle: subtitle,
            detail: detail,
            parent: parent,
            ancestors: ancestors
        });
        return Observable.fromPromise(node.save())
            .map(node => new BodyNode(node));
    }

    /**
     * Clone the node object
     * 
     * @static
     * @param {BodyNode} node original node
     * @returns {Observable<BodyNode>} cloned node
     * @memberof WorkflowManager
     */
    static clone(node: BodyNode): Observable<BodyNode> {
        return this.createBodyNode(node.getStatus(),
            node.getOwner(),
            node.getCreatedBy(),
            node.getDuedate(),
            undefined,
            undefined,
            node.getParentID(),
            node.getAncestorsID());
    }

    static getUserNode(userID: number): Observable<NodeResponseInterface[]> {
        return Observable.fromPromise(
            NodeModel.find({
                owner: userID
            })
        )
            .map(nodes => nodes.map(node => new BodyNode(node)))
            .flatMap(nodes => {
                if (nodes.length === 0) {
                    throw Observable.throw(new Error("EmptyArrayException"));
                }
                let groupNodes = _.groupBy(nodes, node => {
                    return node.getAncestorsID()[0];
                });
                let userNodes: BodyNode[] = [];
                _.forEach(groupNodes, nodes => {
                    userNodes.push(_.last(nodes));
                });
                return Observable.zip(
                    Observable.forkJoin(userNodes.map(node => node.getTree())),
                    Observable.forkJoin(userNodes.map(node => node.getHeader()))
                );
            })
            .flatMap(
                nodes => {
                    return Observable.forkJoin(nodes[0].map(node => {
                        return Observable.forkJoin(node.map(n => n.getOwnerDetail()))
                    })).map(o => ({ nodes, o }));
                }
            )
            .map(({ nodes, o }) => {
                let bodyNodes = nodes[0];
                let headerNodes = nodes[1];
                let response: NodeResponseInterface[] = [];
                for (let i = 0; i < bodyNodes.length; i++) {
                    const innerNodes = bodyNodes[i];
                    const innerTutors = o[i];
                    let tutorStack: number[] = [];
                    if (_.findIndex(innerNodes, node => ((node.getStatus() === Status.COMPLETE) && (node.getOwner() !== userID))) !== -1) continue;
                    let responseNode: NodeResponseInterface = {} as NodeResponseInterface;
                    responseNode.title = headerNodes[i].getTitle();
                    responseNode.tag = headerNodes[i].getTag();
                    responseNode.canDelete = innerNodes[0].getOwner() === userID;
                    let lastUserIndex = _.findLastIndex(innerNodes, node => node.getOwner() === userID);
                    let currentNode = innerNodes[lastUserIndex];

                    responseNode.nodeID = currentNode.getID();
                    responseNode.timestamp = currentNode.getTimestamp();
                    responseNode.createdBy = currentNode.getCreatedBy();
                    responseNode.duedate = currentNode.getDuedate();
                    responseNode.status = currentNode.getStatus();
                    responseNode.owner = currentNode.getOwner();
                    responseNode.parent = currentNode.getParentID();
                    responseNode.ancestors = currentNode.getAncestorsID();
                    responseNode.subtitle = "";
                    responseNode.detail = "";


                    for (let j = 0; j < innerNodes.length; j++) {
                        let user = innerNodes[j].getOwner();
                        if (tutorStack.indexOf(user) === -1) {
                            tutorStack.push(user);
                        }
                        responseNode.detail += "\n" + innerTutors[j].getNicknameEn() + " :: " + innerNodes[j].getStatus() + " # " + innerNodes[j].getTimestampString() + "\n";
                        try {
                            let subtitle = innerNodes[j].getSubtitle();
                            if (subtitle) {
                                responseNode.subtitle = subtitle;
                            }
                        } catch (_) { }
                        try {
                            responseNode.detail += innerNodes[j].getDetail() + "\n";
                        } catch (_) { }
                    }
                    // let parentIndex = _.findIndex(innerNodes, node => node.getID().equals(currentNode.getParentID()));

                    // if (parentIndex === -1) {
                    //     responseNode.subtitle = currentNode.getSubtitle();
                    //     responseNode.detail = currentNode.getDetail();
                    // }

                    // while (parentIndex !== -1) {
                    //     let parentNode = innerNodes[parentIndex];
                    //     try {
                    //         responseNode.subtitle = currentNode.getSubtitle() + "\n" + responseNode.subtitle;
                    //     } catch (_) { }
                    //     try {
                    //         responseNode.detail = currentNode.getDetail() + "\n" + responseNode.detail;
                    //     } catch (_) { }
                    //     parentIndex = _.findIndex(innerNodes, node => node.getID().equals(currentNode.getParentID()));
                    //     currentNode = parentNode;
                    //     parentNode = innerNodes[parentIndex];
                    // }

                    responseNode.childOwner = _.last(innerNodes).getOwner();
                    responseNode.childStatus = _.last(innerNodes).getStatus();

                    if (_.last(innerNodes).getStatus() === Status.COMPLETE) {
                        responseNode.childOwner = tutorStack.pop();
                    }
                    response.push(responseNode);
                }
                if (response.length === 0) {
                    throw Observable.throw(new Error("EmptyArrayException"));
                }
                return response;
            }).flatMap(responses => {
                return Observable.forkJoin(responses.map(response => UserManager.getTutorInfo(response.childOwner)))
                    .map(userInfo => ({ responses, userInfo }));
            }).map(({ responses, userInfo }) => {
                for (let i = 0; i < responses.length; i++) {
                    try {
                        responses[i].childOwnerName = userInfo[i].getNicknameEn();
                    } catch (error) { }
                }
                return responses;
            });
    }
}