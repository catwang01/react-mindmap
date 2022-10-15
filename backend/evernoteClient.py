import os
import flask
from flask import Flask, request
from evernote.api.client import EvernoteClient
from evernote.edam.notestore import NoteStore

evernote_token = os.environ.get('EVERNOTE_TOKEN', None)
assert  evernote_token is not None, 'Please set token with "export EVERNOTE_TOKEN=<your_token>"'
# Set up the NoteStore client
client = EvernoteClient(token=evernote_token, china=True ,sandbox=False)
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

def helper(func):
    def wrapper(*args, **kwargs):
        app.logger.debug("request.form: %s", request.form)
        ret = func(*args, **kwargs)
        response, status_code = ret
        app.logger.debug("response.get_data(): %s", response.get_data())
        return ret
    return wrapper

@helper
@app.route('/getNotebooks', methods=['GET', 'POST'])
def getNotebooks():
    notestore = client.get_note_store()
    status_code = 200
    try:
        notebookList = notestore.listNotebooks()
    except Exception as e:
        response, status_code = flask.jsonify({
            'error': str(e)
        }), 400
    else:
        response = flask.jsonify({
            'notebooks': [extractNotebook(nb) for nb in notebookList]
        })
    response.headers.add('Access-Control-Allow-Origin', '*')
    app.logger.debug("response.get_data(): %s", response.get_data())
    return response, status_code

@app.route('/test')
def test():
    return "hello! this is test"

@helper
@app.route('/getNote', methods=['GET', 'POST'])
def getNote():
    notestore = client.get_note_store()
    guid = request.form.get('guid')
    status_code = 200
    if guid is None:
        response, status_code = flask.jsonify({'error': "Must provide a valid guid"}), 400
    else:
        withContent= request.form.get('withContent', True)
        withResourcesData = request.form.get('withResourcesData', False)
        try:
            note = notestore.getNote(guid, withContent, withResourcesData, False, False)
        except Exception as e:
            response = flask.jsonify({
                'error': str(e)
            })
        else:
            response = flask.jsonify({
                'note':  extractNote(note)   
            })
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response, status_code

@helper
@app.route('/findNotes', methods=['GET', 'POST'])
def findNotes():
    notestore = client.get_note_store()
    status_code = 200
    note_filter = NoteStore.NoteFilter()
    if request.form.get('filter_order', None):
        note_filter.order = int(request.form.get('filter_order'))
        note_filter.ascending = 0
    start = int(request.form.get('start', '0'))
    end =  int(request.form.get('end', '10'))
    try:
        notes = notestore.findNotes(note_filter, start, end).notes
    except Exception as e:
        response, status_code = flask.jsonify({ 'error': str(e) }), 400
    else:
        res = []
        for note in notes:
            res.append(extractNote(note))
        response = flask.jsonify({'notes': res})
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response, status_code

if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True, port=5001, threaded=True)