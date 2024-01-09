import { ModelModifier, FocusMode as StandardFocusMode, OpType as StandardOpType } from '@blink-mind/core';
import { Button, Classes, MenuDivider, MenuItem, Popover } from '@blueprintjs/core';
import "@blueprintjs/core/lib/css/blueprint.css";
import { Map as ImmutableMap, fromJS } from 'immutable';
import React, { useEffect, useState } from 'react';
import { SearchPanel } from '../../component/searchPanel';
import '../../icon/index.css';
import { nonEmpty } from '../../utils';
import { retrieveResultFromNextNode } from "../../utils/retrieveResultFromNextNode";
import { FocusMode, JUPYTER_BASE_URL, JUPYTER_CLIENT_ENDPOINT, JUPYTER_CLIENT_TYPE, JUPYTER_ROOT_FOLDER, OpType } from './constant';
import { getDialog } from './dialog';
import { JupyterClient } from './jupyter';
import { log } from './logger';
import { trimWordStart } from './stringUtils';
import { generateRandomPath, getJupyterNotebookPath, getOrphanJupyterNotes, hasJupyterNotebookAttached } from './utils';
import { expiryCache } from '../../utils/expiryCache';
import { MindMapToaster } from '../../component/toaster';

let jupyterClient = new JupyterClient(JUPYTER_CLIENT_ENDPOINT, {
    jupyterBaseUrl: JUPYTER_BASE_URL,
    rootFolder: JUPYTER_ROOT_FOLDER,
    clientType: JUPYTER_CLIENT_TYPE
});

const getNotesWithCache = expiryCache(jupyterClient.getNotes, jupyterClient);

const setOrphanJupyterNotes = (model) => async (setOrphans, setAllNotes) => {
    const allNotes = await getNotesWithCache();
    const orphan = getOrphanJupyterNotes({ allNotes, model })
    setOrphans(orphan)
    if (nonEmpty(setAllNotes))
    {
        setAllNotes(allNotes)
    }
}

const JupyterPopover = React.memo((props) => {
    console.log("rendered")
    const { setOrphanJupyterNotes, maxItemToShow } = props;

    const [orphans, setOrphans] = useState([]);
    const [allNotes, setAllNotes] = useState([]);

    useEffect(() => {
        setOrphanJupyterNotes(setOrphans, setAllNotes)
    }, [setOrphanJupyterNotes])

    const getTitlesToShow = (maxItemToShow) => {
        const sortedOrphans = orphans.sort(note => note.title).map(note => note.title)
        const len = sortedOrphans.length
        if (len <= maxItemToShow) return sortedOrphans;
        const head = maxItemToShow - 1
        const tail = maxItemToShow - head
        return [].concat(
            sortedOrphans.slice(0, head),
            '...',
            sortedOrphans.slice(len - tail)
        )
    }

    const getPopoverContent = () => (
        <div>
            <ul>
                {
                    getTitlesToShow(maxItemToShow).map(title => <li key={title}>{title}</li>)
                }
            </ul>
            <Button className={Classes.POPOVER_DISMISS} text="Dismiss" />
        </div>
    )

    const popoverProps = {
        // style: { height: "40px" },
        interactionKind: "click",
        popoverClassName: Classes.POPOVER_CONTENT_SIZING,
        placement: "bottom",
        children: <Button
            intent="primary"
            text={`${orphans.length}/${allNotes.length} jupyter notes`}
        />,
        content: getPopoverContent()
    }
    return <Popover {...popoverProps} />;
})

const JupyterIcon = () => {
    return <div className="icon-jupyter" />
}

export const openJupyterNotebookLink = (path) => {
    const url = jupyterClient.getActualUrl(path)
    log(`Opening ${url}`)
    window.open(url, '_blank', 'noreferrer');
}

export const openJupyterNotebookFromTopic = (props) => {
    const jupyter_notebook_path = getJupyterNotebookPath(props)
    if (jupyter_notebook_path) {
        openJupyterNotebookLink(jupyter_notebook_path)
    }
    else {
        alert("No jupyter notebook is attachd");
    }
}

const renderModalRemovingJuyterNotebook = (props) => {
    const { controller } = props;
    const onClickYes = () => {
        controller.run("operation", {
            ...props,
            opArray: [
                {
                    opType: OpType.DELETE_ASSOCIATED_JUPYTER_NOTE
                },
                {
                    opType: StandardOpType.SET_FOCUS_MODE,
                    focusMode: FocusMode.NOTIFY_REMOVED_JUPYTER_NOTEBOOK
                }
            ]
        })
    }

    const onClickNo = () => {
        controller.run('operation', {
            ...props,
            opType: StandardOpType.SET_FOCUS_MODE,
            focusMode: StandardFocusMode.NORMAL
        })
    }

    return getDialog(
        {
            key: "renderModalRemovingJuyterNotebook",
            title: "Do you want to remove the attached jupyter note?",
            buttons: [
                <Button onClick={onClickYes}>Yes</Button>,
                <Button onClick={onClickNo}>No</Button>
            ]
        }
    );
}


const renderModalNotifyRemovedJupyterNoteBook = (props) => {
    const { controller } = props;
    const onClickYes = () => {
        controller.run("operation", {
            ...props,
            opArray: [
                {
                    opType: OpType.DELETE_ASSOCIATED_JUPYTER_NOTE
                },
                {
                    opType: StandardOpType.SET_FOCUS_MODE,
                    focusMode: StandardFocusMode.NORMAL
                }
            ]
        })
    }
    return getDialog(
        {
            key: "renderModalNotifyRemovedJupyterNote",
            title: "The jupyter note has been remove!",
            buttons: [<Button onClick={onClickYes}>Yes</Button>]
        }
    )
}

const renderModalConfirmCreateJupyterNotebook = (props) => {
    const { controller } = props;
    const onClickYes = () => createJupyterNote(props);
    const onClickNo = () => {
        controller.run('operation', {
            ...props,
            opType: StandardOpType.SET_FOCUS_MODE,
            focusMode: StandardFocusMode.NORMAL
        })
    }

    return getDialog({
        key: "renderModalConfirmCreateJupyterNotebook",
        title: "Associated note is detected",
        content: "An evernote note is detected to be associated with the topic. Do you want to create it?",
        buttons: [
            <Button onClick={onClickYes}>Yes</Button>,
            <Button onClick={onClickNo}>No</Button>
        ]
    });
}

const focusModeCallbacks = new Map([
    [FocusMode.REMOVING_JUPYTER_NOTEBOOK, renderModalRemovingJuyterNotebook],
    [FocusMode.NOTIFY_REMOVED_JUPYTER_NOTEBOOK, renderModalNotifyRemovedJupyterNoteBook],
    [FocusMode.CONFIRM_CREATE_JUPYTER_NOTEBOOK, renderModalConfirmCreateJupyterNotebook],
])

export const createJupyterNote = (props) => {
    const { controller, topicKey } = props;
    const title = controller.run('getTopicTitle', props)
    log("Creating jupyter notebook with title: ", title)
    const jupyter_notebook_path = generateRandomPath();
    jupyterClient.createNote(jupyter_notebook_path, title)
        .then(response => {
            controller.run("operation", {
                ...props,
                topicKey,
                jupyter_notebook_path: jupyter_notebook_path,
                // hack: if no use controller.currentModel, the topic may not correctly be focused
                model: controller.currentModel,
                opType: OpType.ASSOCIATE_JUPYTER_NOTE,
                callback: () => openJupyterNotebookLink(jupyter_notebook_path)
            })
            if (controller.currentModel.focusMode === FocusMode.CONFIRM_CREATE_JUPYTER_NOTEBOOK) {
                controller.run("operation", {
                    ...props,
                    model: controller.currentModel,
                    opType: StandardOpType.SET_FOCUS_MODE,
                    focusMode: StandardFocusMode.NORMAL
                });
            }
            MindMapToaster.show({ "message": "Note is created!" });
        }
        ).catch(error => {
            MindMapToaster.show({ "message": `Failed to create note! Error message: ${error.message}` });
        });
}

export const createJupyterNoteWithPrecheck = (props) => {
    const { controller, topicKey } = props;
    const model = controller.currentModel;
    MindMapToaster.show({ "message": "Creating jupyter notebook..." });
    if (model.getIn(["extData", "jupyter", topicKey])) {
        MindMapToaster.show({ "message": "Can't create jupyter note on a topic which already associates a jupyter note!" });
        return
    }
    if (model.getIn(["extData", "evernote", topicKey])) {
        controller.run('operation', {
            ...props,
            opType: StandardOpType.SET_FOCUS_MODE,
            focusMode: FocusMode.CONFIRM_CREATE_JUPYTER_NOTEBOOK
        })
        return
    }
    createJupyterNote(props)
}

export const associateJupyterNote = (props) => {
    const { controller, topicKey } = props;
    const model = controller.currentModel;
    log("associate note is invoked");
    if (model.getIn(["extData", "jupyter", topicKey])) {
        alert("Can't associate jupyter note on a topic which already associates a jupyter note!");
        return;
    }
    controller.run('operation', {
        ...props,
        model,
        opType: StandardOpType.SET_FOCUS_MODE,
        focusMode: FocusMode.ASSOCIATE_JUPYTER_NOTEBOOK
    });
}

export function CreateJupyterNotebookPlugin() {
    let popOver = null;
    const getPopOver = (model) => {
        const popoverProps = {
            setOrphanJupyterNotes: setOrphanJupyterNotes(model),
            maxItemToShow: 10,
        }
        if (popOver === null)
        {
            popOver = <JupyterPopover key="jupyter-popover" {...popoverProps} />;
        }
        return popOver;
    }

    let searchWord;
    const setSearchWorld = s => {
        searchWord = s;
    };
    return {
        getOpMap: function (props, next) {
            const opMap = next();
            opMap.set(OpType.ASSOCIATE_JUPYTER_NOTE, ({ model, topicKey, jupyter_notebook_path }) => {
                const final_jupyter_notebook_path = trimWordStart(jupyter_notebook_path, JUPYTER_ROOT_FOLDER + '/') ?? generateRandomPath();
                const modelWithJupyterNotebookPath = model.setIn(
                    ["extData", "jupyter", topicKey ?? model.focusKey, "path"],
                    final_jupyter_notebook_path
                )
                const newModel = ModelModifier.setFocusMode({
                    model: modelWithJupyterNotebookPath,
                    focusMode: StandardFocusMode.NORMAL
                });
                return newModel;
            });
            opMap.set(OpType.DELETE_ASSOCIATED_JUPYTER_NOTE, ({ model, topicKey }) => {
                const newModel = model.deleteIn(['extData', 'jupyter', topicKey ?? model.focusKey]);
                return newModel;
            });

            return opMap;
        },
        renderTopicContentOthers: function (props, next) {
            const { topicKey, model } = props;
            const jupyterData = model.getIn(['extData', 'jupyter'], new ImmutableMap());
            const res = next();
            return <>
                {res}
                {jupyterData.get(topicKey) && <div onClick={() => openJupyterNotebookFromTopic(props)} > <JupyterIcon /></div>}
            </>
        },
        customizeTopicContextMenu: function (props, next) {
            log("customizeTopicContextMenu")
            log("parameters: ", props)

            const { topicKey, model } = props;

            const onClickCreateNoteItem = () => createJupyterNoteWithPrecheck(props)

            const onClickAssociateNoteItem = () => associateJupyterNote(props)

            const onClickOpenJupyterNoteItem = () => openJupyterNotebookFromTopic(props)

            const onClickRemoveJupyterNoteItem = () => {
                const { controller } = props;
                controller.run('operation', {
                    ...props,
                    opType: StandardOpType.SET_FOCUS_MODE,
                    // hack: if no use controller.currentModel, the topic may not correctly be focused
                    model: controller.currentModel,
                    focusMode: FocusMode.REMOVING_JUPYTER_NOTEBOOK,
                })
            }

            const createJupyterNoteItem = <MenuItem
                icon={<JupyterIcon />}
                key={"create note"}
                text={"Create jupyter note"}
                // labelElement={<kbd>{ "Ctrl + a" }</kbd>}
                onClick={onClickCreateNoteItem}
            />
            const associateJupyterNoteItem = <MenuItem
                icon={<JupyterIcon />}
                key={"associate note"}
                text={"Associate jupyter note"}
                // labelElement={<kbd>{ "Ctrl + a" }</kbd>}
                onClick={onClickAssociateNoteItem}
            />

            const openJupyterNoteItem = <MenuItem
                icon={<JupyterIcon />}
                key={"open jupyter note"}
                text={"Open jupyter note"}
                // labelElement={<kbd>{ "Ctrl + a" }</kbd>}
                onClick={onClickOpenJupyterNoteItem}
            />

            const removeJupyterNoteItem = <MenuItem
                icon={<JupyterIcon />}
                key={"remove jupyter note"}
                text={"Remove jupyter note"}
                // labelElement={<kbd>{ "Ctrl + a" }</kbd>}
                onClick={onClickRemoveJupyterNoteItem}
            />

            const associatedWithJupyterNote = hasJupyterNotebookAttached({ model, topicKey });

            return <>
                {next()}
                {<MenuDivider />}
                {!associatedWithJupyterNote && createJupyterNoteItem}
                {!associatedWithJupyterNote && associateJupyterNoteItem}
                {associatedWithJupyterNote && openJupyterNoteItem}
                {associatedWithJupyterNote && removeJupyterNoteItem}
            </>;
        },

        renderDiagramCustomize(props, next) {
            const res = next();
            const { model, controller } = props;
            if (model.focusMode === FocusMode.ASSOCIATE_JUPYTER_NOTEBOOK) {
                const associateJupyterNote = (item, e) => {
                    const jupyter_notebook_path = item.path;
                    controller.run("operation", {
                        ...props,
                        topicKey: model.topicKey,
                        jupyter_notebook_path,
                        model: controller.currentModel,
                        opType: OpType.ASSOCIATE_JUPYTER_NOTE
                    })
                }

                const searchPanelProps = {
                    key: 'search-panel',
                    ...props,
                    setSearchWorld,
                    getAllSections: setOrphanJupyterNotes(model),
                    onItemSelect: associateJupyterNote,
                    matchKey: 'title'
                };
                res.push(<SearchPanel {...searchPanelProps} />);
            }
            return res;
        },

        renderLeftBottomCorner: (props, next) => {
            const { model } = props;
            const res = retrieveResultFromNextNode(next);
            if (model && model?.extData?.has('jupyter'))
            {
                res.push(getPopOver(model))
            }
            return res;
        },

        renderModal: (props, next) => {
            const { model: { focusMode } } = props;
            const res = next();
            if (!focusModeCallbacks.has(focusMode))
                return res;

            const newRes = focusModeCallbacks.get(focusMode)(props)

            return res === null ? [newRes] : [...res, newRes]
        },

        getAllowUndo(props, next) {
            const res = next();
            if (!res)
                return false;
            const { model } = props;
            if (FocusMode.hasOwnProperty(model.focusMode))
                return false;
            return res;
        },

        deserializeExtData: (props, next) => {
            const extData = next();
            let newExtData = extData;
            const jupyterData = extData.get('jupyter')
            if (jupyterData)
                newExtData = extData.set('jupyter', fromJS(jupyterData));
            return newExtData;
        }
    }
}