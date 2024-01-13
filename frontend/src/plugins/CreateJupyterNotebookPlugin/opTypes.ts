import {
    setAllJupyterNotebooks,
    deleteAssociatedJupyterNote,
    deleteAssociatedJupyterNoteRecursive,
    associateJupyterNotebook
} from "./ModelModifier";

export const OpType = {
    ASSOCIATE_JUPYTER_NOTE: "ASSOCIATE_JUPYTER_NOTE",
    DELETE_ASSOCIATED_JUPYTER_NOTE: "DELETE_ASSOCIATED_JUPYTER_NOTE",
    DELETE_ASSOCIATED_JUPYTER_NOTE_RECURISVE: "DELETE_ASSOCIATED_JUPYTER_NOTE_RECURISVE",
    SET_ALL_JUPYTER_NOTEBOOKS: "SET_ALL_JUPYTER_NOTEBOOKS",
}

export const OpTypeMapping = [
    [
        OpType.ASSOCIATE_JUPYTER_NOTE, associateJupyterNotebook
    ],
    [
        OpType.DELETE_ASSOCIATED_JUPYTER_NOTE, deleteAssociatedJupyterNote
    ],
    [
        OpType.SET_ALL_JUPYTER_NOTEBOOKS, setAllJupyterNotebooks
    ],
    [
        OpType.DELETE_ASSOCIATED_JUPYTER_NOTE_RECURISVE, deleteAssociatedJupyterNoteRecursive
    ]
];