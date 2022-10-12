import os
import flask
from flask import Flask, request
from evernote.api.client import EvernoteClient
from evernote.edam.notestore import NoteStore

evernote_token = os.environ.get('EVERNOTE_TOKEN', None)
assert  evernote_token is not None, 'Please set token with "export EVERNOTE_TOKEN=<your_token>"'
# Set up the NoteStore client
client = EvernoteClient(token=evernote_token, china=True ,sandbox=False)
notestore = client.get_note_store()
app = Flask(__name__)

def extractNote(note):
    return {
            'guid': note.guid,
            'title': note.title,
            'content': note.content,
            'updated': note.updated,
            'deleted': note.deleted,
            'notebookGuid': note.notebookGuid,
    }

def extractNotebook(notebook):
    return {
        'name': notebook.name,
        'guid': notebook.guid,
    }

@app.route('/getNotebooks', methods=['GET', 'POST'])
def getNotebooks():
    notebookList = notestore.listNotebooks()
    response = flask.jsonify({
        'notebooks': [extractNotebook(nb) for nb in notebookList]
    })
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/test')
def test():
    return "hello! this is test"

@app.route('/getNote', methods=['GET', 'POST'])
def getNote():
    guid = request.form.get('guid')
    if guid is None:
        return flask.jsonify({'error': "Must provide a valid guid"}), 400
    withContent= request.form.get('withContent', True)
    withResourcesData = request.form.get('withResourcesData', False)
    note = notestore.getNote(guid, withContent, withResourcesData, False, False)
    print(note)
    response = flask.jsonify({
        'note':  extractNote(note)   
    })
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/findNotes', methods=['GET', 'POST'])
def findNotes():
    print(request.form)
    note_filter = NoteStore.NoteFilter()
    if request.form.get('filter_order', None):
        note_filter.order = int(request.form.get('filter_order'))
        note_filter.ascending = 0
    print("note_filter:", note_filter)
    notes = notestore.findNotes(note_filter, 
                                int(request.form.get('start', '0')), 
                                int(request.form.get('offset', '10'))).notes
    print(notes)
    res = []
    for note in notes:
        res.append(extractNote(note))
    response = flask.jsonify({'notes': res})
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True, port=5001, threaded=True)