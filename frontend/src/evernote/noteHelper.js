import EvernoteClient from "./client";

const evernoteCient = new EvernoteClient(
  (process.env.NODE_ENV === 'production' ?  window.__env__?.REACT_APP_EVERNOTE_SERVER_HOST : process.env.REACT_APP_EVERNOTE_SERVER_HOST ) ?? 'localhost', 
  (process.env.NODE_ENV === 'production' ?  window.__env__?.REACT_APP_EVERNOTE_SERVER_PORT : process.env.REACT_APP_EVERNOTE_SERVER_PORT ) ?? 5000
);

export const getLasteNotes = (start, offset, sync=true, successCallback=null, failCallback=null) => {
    const results = evernoteCient.getAllNoteList({start, offset, filter_order: 2}, sync, successCallback, failCallback);
    if (!sync) return;
    let notes;
    if (results.hasOwnProperty('error')) {
      notes = []
    } else {
      notes = results.notes
    }
    return notes;
}

export const getAllNotes = (start, offset, sync=true, successCallback=null, failCallback=null) => {
    const results = evernoteCient.getAllNoteList({ start, offset }, sync, successCallback, failCallback);
    if (!sync) return;
    let notes;
    if (results.hasOwnProperty('error')) {
      notes = []
    } else {
      notes = results.notes
    }
    return notes;
  }

export const getNotebookList = (sync=true, successCallback=null, failCallback=null) => {
    const results = evernoteCient.getNotebookList({}, sync, successCallback, failCallback);
    if (!sync) return;
    let notebooks;
    if (results.hasOwnProperty('error')) {
      notebooks = []
    } else {
      notebooks = results.notebooks
    }
    return notebooks;
  }

export const mergeNotes = (oldNotes, newNotes) => {
    let noteDict = new Map();
    for(var note of [...oldNotes, ...newNotes])
    {
        var guid = note.guid
        if (!noteDict.has(guid) || ((noteDict.get(guid)?.updated ?? new Date(null)) >= (note?.updated ?? new Date(null)))) 
        {
            noteDict.set(guid, note);
        }
    }
    return [...noteDict.values()]
}