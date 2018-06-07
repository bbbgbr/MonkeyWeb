import { Router } from "express";
import { Observable } from "rx";
import { Status, WorkflowManager, BodyNode } from "./classes/WorkflowManager";
import { IOSNotificationManager } from "./classes/NotificationManager";
import * as _ from "lodash";

export const router = Router();

router.all("*", (req, res, next) => {
    let positionArray = ["tutor", "admin", "dev", "mel"];
    if (positionArray.indexOf(req.user.position) === -1) return res.render("404");
    next();
});

router.post("/createWorkflow", (req, res) => {
    let { title, subtitle, detail, tag, duedate } = req.body;
    if (!(title && subtitle && detail)) {
        return res.status(400).send({
            err: 0,
            msg: "Bad Request"
        });
    }
    if (duedate) {
        duedate = new Date(duedate);
    }
    WorkflowManager.create(req.user._id, title, subtitle, detail, tag, duedate)
        .subscribe(node => {
            return res.status(200).send(node.getInterface());
        });
});

router.post("/delete", (req, res) => {
    let { workflowID } = req.body;
    if (!workflowID) {
        return res.status(400).send({
            err: 0,
            msg: "Bad Request"
        });
    }
    WorkflowManager.getBodyNode(workflowID)
        .flatMap(node => node.getHeader())
        .flatMap(node => WorkflowManager.delete(node))
        .subscribe(_ => {
            return res.status(200).send({
                msg: "OK"
            });
        });
});

router.post("/editHeader", (req, res) => {
    let { workflowID, title } = req.body;
    if (!(workflowID && title)) {
        return res.status(400).send({
            err: 0,
            msg: "Bad Request"
        });
    }
    WorkflowManager.getHeaderNode(workflowID)
        .flatMap(header => header.setTitle(title))
        .subscribe(_ => {
            return res.status(200).send({
                msg: "OK"
            });
        });
});

router.post("/editNode", (req, res) => {
    let { workflowID, subtitle, duedate } = req.body;
    if (!(workflowID && (subtitle || duedate))) {
        return res.status(400).send({
            err: 0,
            msg: "Bad Request"
        });
    }

    if (duedate) {
        duedate = new Date(duedate);
    }

    if (subtitle && duedate) {
        WorkflowManager.getBodyNode(workflowID)
            .flatMap(node => node.setSubtitle(subtitle))
            .flatMap(node => node.setDuedate(duedate))
            .subscribe(_ => {
                return res.status(200).send({
                    msg: "OK"
                });
            });
    } else if (subtitle) {
        WorkflowManager.getBodyNode(workflowID)
            .flatMap(node => node.setSubtitle(subtitle))
            .subscribe(_ => {
                return res.status(200).send({
                    msg: "OK"
                });
            });
    } else {
        WorkflowManager.getBodyNode(workflowID)
            .flatMap(node => node.setDuedate(duedate))
            .subscribe(_ => {
                return res.status(200).send({
                    msg: "OK"
                });
            });
    }
});

router.post("/note", (req, res) => {
    let { workflowID } = req.body;
    if (!workflowID) {
        return res.status(400).send({
            err: 0,
            msg: "Bad Request"
        });
    }

    WorkflowManager.getBodyNode(workflowID)
        .flatMap(node => node.appendWithStatus(Status.NOTE))
        .subscribe(_ => {
            return res.status(200).send({
                msg: "OK"
            });
        });
});

router.post("/todo", (req, res) => {
    let { workflowID } = req.body;
    if (!workflowID) {
        return res.status(400).send({
            err: 0,
            msg: "Bad Request"
        });
    }

    WorkflowManager.getBodyNode(workflowID)
        .flatMap(node => node.appendWithStatus(Status.TODO))
        .subscribe(_ => {
            return res.status(200).send({
                msg: "OK"
            });
        });
});

router.post("/inProgress", (req, res) => {
    let { workflowID } = req.body;
    if (!workflowID) {
        return res.status(400).send({
            err: 0,
            msg: "OK"
        });
    }

    WorkflowManager.getBodyNode(workflowID)
        .flatMap(node => node.appendWithStatus(Status.IN_PROGRESS))
        .subscribe(_ => {
            return res.status(200).send({
                msg: "OK"
            });
        });
});

router.post("/assign", (req, res) => {
    let { workflowID, owner, subtitle, detail, duedate } = req.body;
    if (!(workflowID && owner)) {
        return res.status(400).send({
            err: 0,
            msg: "OK"
        });
    }
    if (duedate) duedate = new Date(duedate);

    WorkflowManager.getBodyNode(workflowID)
        .flatMap(node => node.appendWithStatus(Status.ASSIGN))
        .flatMap(node => WorkflowManager.getBodyNode(node.getID()))
        .flatMap(node => {
            let ancestors = node.getAncestorsID();
            ancestors.push(node.getID());
            return WorkflowManager.createBodyNode(
                Status.TODO,
                parseInt(owner),
                node.getCreatedBy(),
                duedate,
                subtitle,
                detail,
                node.getID(),
                ancestors
            );
        })
        .flatMap(() => IOSNotificationManager.getInstance().send(parseInt(owner), req.user.nicknameEn + " assign you a task."))
        .subscribe(result => {
            return res.status(200).send({
                msg: "OK"
            });
        });
});

router.post("/done", (req, res) => {
    let { workflowID } = req.body;
    if (!workflowID) {
        return res.status(400).send({
            err: 0,
            msg: "OK"
        });
    }

    WorkflowManager.getBodyNode(workflowID)
        .flatMap(node => node.appendWithStatus(Status.DONE))
        .flatMap(node => WorkflowManager.getBodyNode(node.getID()))
        .flatMap(node => node.getParentBranchNode().map(parent => ({ node, parent })))
        .flatMap(({ node, parent }) => {
            let ancestors = node.getAncestorsID();
            ancestors.push(node.getID());
            if (parent !== null) {
                return WorkflowManager.createBodyNode(
                    Status.TODO,
                    parent.getOwner(),
                    parent.getCreatedBy(),
                    parent.getDuedate(),
                    undefined,
                    undefined,
                    node.getID(),
                    ancestors
                )
                    .flatMap(parent => {
                        return IOSNotificationManager.getInstance().send(parent.getOwner(), req.user.nicknameEn + " has finished your task.")
                    });
            } else {
                return WorkflowManager.createBodyNode(
                    Status.COMPLETE,
                    node.getOwner(),
                    node.getCreatedBy(),
                    node.getDuedate(),
                    undefined,
                    undefined,
                    node.getID(),
                    ancestors
                );
            }
        }).subscribe(result => {
            return res.status(200).send({
                msg: "OK"
            });
        });
});

router.post("/list", (req, res) => {

    WorkflowManager.getUserNode(req.user._id)
        .subscribe(nodes => {
            return res.status(200).send({
                nodes: nodes
            });
        }, err => {
            return res.status(200).send({
                nodes: []
            });
        });
});

router.post("/test", (req, res) => {
    IOSNotificationManager.getInstance().send(99009, "Hello World").subscribe(result => {
        return res.status(200).send(result);
    });
});

router.post("/listNode", (req, res) => {
    WorkflowManager.getUserNode(parseInt(req.body.id))
        .subscribe(nodes => {
            return res.status(200).send({
                nodes: nodes
            });
        }, err => {
            return res.status(200).send({
                nodes: []
            });
        });
});