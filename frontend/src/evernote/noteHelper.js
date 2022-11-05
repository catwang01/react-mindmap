import EvernoteClient from "./client";

const evernoteCient = new EvernoteClient(
  (process.env.NODE_ENV === 'production' ?  window.__env__?.REACT_APP_EVERNOTE_SERVER_HOST : process.env.REACT_APP_EVERNOTE_SERVER_HOST ) ?? 'localhost', 
  (process.env.NODE_ENV === 'production' ?  window.__env__?.REACT_APP_EVERNOTE_SERVER_PORT : process.env.REACT_APP_EVERNOTE_SERVER_PORT ) ?? 5001
);

export const getDeleteNotes = (sync=true, successCallback=null, failCallback=null) => {
  return getLasteNotes(0, 1000, true, sync, successCallback, failCallback)
}

export const getLasteNotes = (start, offset, inactive=false, sync=true, successCallback=null, failCallback=null) => {
    const results = evernoteCient.getAllNoteList({start, offset, inactive, filter_order: 2}, sync, successCallback, failCallback);
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

export const removeDeletedNotes = (deleteNotes, notes) => {
  const noteDict = new Map(deleteNotes.map(note => [note.guid, note]));
  const removedNoteTitles = notes.filter(note => noteDict.has(note.guid)).map(note => note.title);
  console.log(`Removed ${removedNoteTitles.length} notes: ${removedNoteTitles.join(', ')}`);
  return notes.filter(note => !noteDict.has(note.guid));
}