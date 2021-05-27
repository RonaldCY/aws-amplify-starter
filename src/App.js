import { API, graphqlOperation } from 'aws-amplify';
import { withAuthenticator } from 'aws-amplify-react';
import { useEffect, useState } from 'react';
import { createNote, deleteNote, updateNote } from './graphql/mutations';
import { listNotes } from './graphql/queries';
import { onCreateNote, onDeleteNote, onUpdateNote } from './graphql/subscriptions';

function App() {
  const [id, setId] = useState(null);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);

  const handleChangeNote = event => setNote(event.target.value);

  const hasExistingNote = () => {
    if (id) {
      const isNote = notes.findIndex(note => note.id === id) > -1
      return isNote;
    }
    return false;
  }

  const handleAddNote = async event => {
    event.preventDefault();
    //check if we have an existing note, if so update it
    if (hasExistingNote()) {
      handleUpdateNote();
    } else {
      const input = { note };
      await API.graphql(graphqlOperation(createNote, { input }));
    }
  }

  const handleDeleteNote = async (noteId) => {
    if (noteId) {
      const input = { id: noteId };
      await API.graphql(graphqlOperation(deleteNote, { input }));
    }
  }

  const handleSetNote = ({ id, note }) => {
    setId(id);
    setNote(note);
  }

  const handleUpdateNote = async () => {
    const input = { id, note };
    const result = await API.graphql(graphqlOperation(updateNote, { input }));
    const updatedNote = result.data.updateNote;
    const index = notes.findIndex(note => note.id === updatedNote.id);
    setNotes([...notes.slice(0, index), updatedNote, ...notes.slice(index + 1)]);
  }


  useEffect(() => {
    getNotes().then(v => {
      if (v.length > 0) {
        const owner = v[0].owner;
        const createNoteListener = API.graphql(graphqlOperation(onCreateNote, { owner })).subscribe({
          next: noteData => {
            const newNote = noteData.value.data.onCreateNote;
            setNotes(prevNote => {
              const oldNotes = prevNote.filter(note => note.id !== newNote.id);
              return [...oldNotes, newNote]
            });
            setNote("");
          }
        });
        const deleteNoteListener = API.graphql(graphqlOperation(onDeleteNote, { owner })).subscribe({
          next: noteData => {
            const deletedNote = noteData.value.data.onDeleteNote;
            setNotes(prevNote => {
              return prevNote.filter(note => note.id !== deletedNote.id);
            });
            setNote("");
          }
        });
        const updateNoteListener = API.graphql(graphqlOperation(onUpdateNote, { owner })).subscribe({
          next: noteData => {
            const updatedNote = noteData.value.data.onUpdateNote;
            setNotes(prevNote => {
              const index = prevNote.findIndex(note => note.id === updatedNote.id);
              return ([...prevNote.slice(0, index), updatedNote, ...prevNote.slice(index + 1)]);
            });
            setNote("");
            setId("");
          }
        });

        return () => {
          createNoteListener.unsubscribe();
          deleteNoteListener.unsubscribe();
          updateNoteListener.unsubscribe();
        }

      }
    })
  }, []);

  const getNotes = async () => {
    const result = await API.graphql(graphqlOperation(listNotes));
    setNotes([...result.data.listNotes.items])
    return result.data.listNotes.items;
  };

  return (
    <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
      <h1 className="code f2-l">Amplify Notetaker</h1>
      {/* Note Form */}
      <form onSubmit={handleAddNote} className="mb3">
        <input
          type="text"
          className="pa2 f4"
          placeholder="Write your note"
          onChange={handleChangeNote}
          value={note} />

        <button className="pa2 f4" type="submit">{id ? "Update Note" : "Add Note"}</button>
      </form>

      {/* Notes List */}
      <div>
        {notes.map(item => (
          <div key={item.note} className="flex items-center">
            <li onClick={() => handleSetNote(item)} className="list pa1 f3">
              {item.note}
            </li>
            <button onClick={() => handleDeleteNote(item.id)} className="bg-transparent bn f4">
              <span>x</span>
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}

export default withAuthenticator(App, { includeGreetings: true });
