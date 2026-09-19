// demo_samples/angular_demo/notes.component.ts
// Demonstration sample for College Syllabus Module 11: Angular Framework Architecture

import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Note {
  id?: string;
  title: string;
  subject: string;
  content: string;
  tags?: string[];
}

@Component({
  selector: 'app-notes',
  template: `
    <div class="notes-container">
      <h2>NOTEX Angular Demo Component</h2>
      
      <!-- Search -->
      <input 
        [(ngModel)]="searchQuery" 
        (input)="filterNotes()" 
        placeholder="Search notes in Angular..." 
      />

      <!-- Create Form -->
      <form (ngSubmit)="createNote()">
        <input [(ngModel)]="newNote.title" name="title" placeholder="Note Title" required />
        <input [(ngModel)]="newNote.subject" name="subject" placeholder="Subject" required />
        <textarea [(ngModel)]="newNote.content" name="content" placeholder="Content" required></textarea>
        <button type="submit">Add Note</button>
      </form>

      <!-- Notes Grid -->
      <div class="notes-grid">
        <div *ngFor="let note of filteredNotes" class="note-card">
          <span class="badge">{{ note.subject }}</span>
          <h3>{{ note.title }}</h3>
          <p>{{ note.content }}</p>
          <button (click)="deleteNote(note.id)">Delete</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notes-container { padding: 20px; font-family: sans-serif; }
    .note-card { border: 1px solid #333; padding: 15px; border-radius: 8px; margin: 10px 0; }
    .badge { background: #6366f1; color: white; padding: 3px 8px; border-radius: 12px; font-size: 12px; }
  `]
})
export class NotesComponent implements OnInit {
  notes: Note[] = [];
  filteredNotes: Note[] = [];
  searchQuery: string = '';
  newNote: Note = { title: '', subject: '', content: '' };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchNotes();
  }

  fetchNotes(): void {
    this.http.get<{ success: boolean; notes: Note[] }>('/api/notes')
      .subscribe(res => {
        this.notes = res.notes;
        this.filteredNotes = res.notes;
      });
  }

  filterNotes(): void {
    const q = this.searchQuery.toLowerCase();
    this.filteredNotes = this.notes.filter(n =>
      n.title.toLowerCase().includes(q) || n.subject.toLowerCase().includes(q)
    );
  }

  createNote(): void {
    this.http.post<{ success: boolean; note: Note }>('/api/notes', this.newNote)
      .subscribe(res => {
        this.notes.unshift(res.note);
        this.filterNotes();
        this.newNote = { title: '', subject: '', content: '' };
      });
  }

  deleteNote(id?: string): void {
    if (!id) return;
    this.http.delete(`/api/notes/${id}`).subscribe(() => {
      this.notes = this.notes.filter(n => n.id !== id);
      this.filterNotes();
    });
  }
}
