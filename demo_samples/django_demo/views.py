# demo_samples/django_demo/views.py
# Demonstration sample for College Syllabus Module 11: Python / Django Architecture

from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
import json
import xml.etree.ElementTree as ET
from .models import Note

@csrf_exempt
def notes_api(request):
    """
    Django Class/Function View demonstrating REST CRUD and XML export
    """
    if request.method == 'GET':
        # READ: Fetch notes
        search_query = request.GET.get('search', '')
        notes = Note.objects.filter(title__icontains=search_query).values()
        
        # Check if XML format is requested
        if request.GET.get('format') == 'xml':
            root = ET.Element("notes")
            for n in notes:
                note_el = ET.SubElement(root, "note")
                ET.SubElement(note_el, "title").text = n['title']
                ET.SubElement(note_el, "subject").text = n['subject']
                ET.SubElement(note_el, "content").text = n['content']
            xml_data = ET.tostring(root, encoding='utf-8', method='xml')
            return HttpResponse(xml_data, content_type='application/xml')

        return JsonResponse({'success': True, 'count': len(notes), 'notes': list(notes)})

    elif request.method == 'POST':
        # CREATE: Add new note
        data = json.loads(request.body)
        new_note = Note.objects.create(
            title=data.get('title'),
            subject=data.get('subject'),
            content=data.get('content')
        )
        return JsonResponse({'success': True, 'message': 'Note created', 'id': new_note.id}, status=201)

@csrf_exempt
def note_detail_api(request, note_id):
    try:
        note = Note.objects.get(id=note_id)
    except Note.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Not found'}, status=404)

    if request.method == 'GET':
        return JsonResponse({'success': True, 'note': {'title': note.title, 'content': note.content}})
    elif request.method == 'PUT':
        data = json.loads(request.body)
        note.title = data.get('title', note.title)
        note.content = data.get('content', note.content)
        note.save()
        return JsonResponse({'success': True, 'message': 'Note updated'})
    elif request.method == 'DELETE':
        note.delete()
        return JsonResponse({'success': True, 'message': 'Note deleted'})
