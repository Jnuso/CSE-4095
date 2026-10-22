"""Build the lab report and package only the intended submission files."""
from pathlib import Path
from xml.sax.saxutils import escape
import re
import textwrap
import zipfile

from PIL import Image as PILImage, ImageDraw, ImageFont
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Preformatted, PageBreak, Image, KeepTogether
from pypdf import PdfReader
import pypdfium2

ROOT = Path(__file__).resolve().parent
LAB = ROOT / 'hangman_lab'
SHOTS = LAB / 'screenshots'
QA = (ROOT / 'tmp' / 'pdfs')
QA.mkdir(parents=True, exist_ok=True)

transcript = '''python hangman_lab/hangman_client.py
Game: eb311b9f9325 (easy)

Word: _ _ _ _
Remaining attempts: 6
Enter a letter: a

Word: _ a _ _
Remaining attempts: 6
Enter a letter: e

Word: _ a _ e
Remaining attempts: 6
Enter a letter: m

Word: _ a _ e
Remaining attempts: 5
Enter a letter: d

Word: _ a _ e
Remaining attempts: 4
Enter a letter: f

Word: f a _ e
Remaining attempts: 4
Enter a letter: t

Word: f a _ e
Remaining attempts: 3
Enter a letter: m
You already guessed that letter.
Enter a letter: w

Word: f a _ e
Remaining attempts: 2
Enter a letter: k

Word: f a _ e
Remaining attempts: 1
Enter a letter: l

Word: f a _ e
Remaining attempts: 0
You lost!'''
(ROOT / 'python_client_transcript.txt').write_text(transcript + '\n', encoding='utf-8')

# A clearly labeled rendering of actual user-supplied text, not a fabricated terminal capture.
font = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 23)
lines = ['PYTHON CLIENT - COMPLETE GAME TRANSCRIPT',
         'Text supplied by the student in chat; rendered for readability.', ''] + transcript.splitlines()
pic = PILImage.new('RGB', (1100, 32 * len(lines) + 48), '#111827')
draw = ImageDraw.Draw(pic)
for n, line in enumerate(lines):
    draw.text((24, 20 + n * 32), line, font=font, fill='#e5e7eb')
pic.save(SHOTS / 'python_client.png')

draft = (ROOT / 'REPORT_ANSWERS_DRAFT.md').read_text(encoding='utf-8')
answers, curl = draft[draft.index('## Q1.'):].split("## Terminal evidence", 1)
reflection = '''## Q12. Python client implementation

The submitted hangman_client.py creates an Easy game, accepts terminal guesses, displays the server state, and stops on a win or loss. It uses requests with a 30-second timeout and handles connection failures, HTTP errors, and invalid response data. To run it, install requests with `python -m pip install requests`, then run `python hangman_client.py` from the hangman_lab folder. The game engine and hidden word remain on the server.

## Q13. Complete-game demonstration

I completed game eb311b9f9325 through the Python client. Correct guesses revealed a, e, and f; incorrect guesses reduced the remaining attempts to zero. A repeated m was rejected locally. The client displayed You lost! and returned to the terminal. The complete transcript appears in the evidence section. The file screenshots/python_client.png is a labeled rendering of that same transcript supplied in chat, rather than a direct terminal screenshot.

## Q14. How the client interacts with Flask

My Python client communicates with the Flask server using HTTPS requests. It sends POST requests to create a game and submit guesses. The server returns JSON, which the client parses to display the word pattern, remaining attempts, and game status. The client saves the game identifier returned during creation and includes it in later request URLs so the server updates the correct game. The client also provides a GET function for retrieving state; its main loop uses the updated state returned by each guess.

## Q15. AI assistance and prompts

I used AI to organize the assignment into a phased TODO list, implement the Python client, and create test cases. Two prompts I used were "create a todo list with phases that we will complete" and "Try making test cases to test this and I will review at the end". I also used AI to explain the requests and guide me through testing each part. The assistant helped draft the report, and I provided the reflection and reviewed the explanations.

## Q16. Development problem and resolution

One problem was a misunderstanding about the development workflow. Because I was concerned about finishing on time, I asked the AI to create tests that I could review afterward. I intended to continue developing in stages, but the assistant interpreted this as permission to complete the implementation and tests together. I noticed that we had moved ahead before I understood each stage, so I asked it to walk me through the completed work. I then tested the browser, API requests, and Python client step by step. In the future, I will specify that the assistant should pause after each phase for my review.

## Q17. Replacing human input with a bot

I would replace the terminal input with a function that automatically chooses a letter. The bot could use the returned word pattern, previous guesses, and remaining attempts to choose its next guess. It would submit letters through the same API and continue until the server reported a win or loss. The Flask server could remain unchanged because the bot would follow the existing API and game rules, just as the human-operated client does. Requests would remain sequential and limited to normal gameplay.
'''
intro = '''# CSE 4095 - Agentic Programming

Hangman REST API Lab | Assignment 13 | October 22, 2026

## Exploration observations

My first Easy browser game ended in a loss with the word town. I guessed j, a, e, i, o, m, and l; o was correct, and the six incorrect guesses exhausted the attempts. In the second game, the guessed letters cleared, attempts reset to six, and the word again had four letters. Guessing e revealed the final letter without reducing attempts. Browser evidence was collected in Microsoft Edge Developer Tools; the assignment specifies Chrome.
'''
curl = '## Terminal evidence' + curl
curl = curl.replace('The following records successful commands and responses supplied in the chat. The earlier failed command-order attempt is omitted from this successful-operation excerpt.', 'The following records my successful commands and responses. Commands use PowerShell syntax. An earlier attempt ran curl before assigning BASE_URL and failed with "No host part in the URL"; running the setup commands first resolved it.')
source = intro + '\n' + answers + '\n' + reflection + '\n' + curl + '\n## Complete Python game transcript\n\n```text\n' + transcript + '\n```\n'
(ROOT / 'LAB_REPORT_SOURCE.md').write_text(source, encoding='utf-8')

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='BodyLab', fontName='Helvetica', fontSize=10,
                         leading=13, spaceAfter=6))
styles.add(ParagraphStyle(name='CodeLab', fontName='Courier', fontSize=8,
                         leading=10, spaceAfter=10, backColor=colors.HexColor('#f1f5f9'),
                         borderPadding=7))
styles['Heading1'].textColor = colors.HexColor('#183b56')
styles['Heading2'].fontSize = 11.5
styles['Heading2'].leading = 15
styles['Heading2'].spaceBefore = 10
styles['Heading2'].textColor = colors.HexColor('#183b56')

def inline(value):
    value = escape(value)
    return re.sub(r'`([^`]+)`', r'<font name="Courier">\1</font>', value)

def markdown(text, story):
    code = False
    buf = []
    para = []
    def flush():
        if para:
            story.append(Paragraph(inline(' '.join(para)), styles['BodyLab']))
            para.clear()
    for line in text.splitlines():
        if line.startswith('```'):
            flush()
            if code:
                wrapped = []
                for row in buf:
                    wrapped.extend(textwrap.wrap(row, width=93, subsequent_indent='  ',
                                                  replace_whitespace=False, drop_whitespace=False) or [''])
                story.append(KeepTogether([Preformatted('\n'.join(wrapped), styles['CodeLab'])]))
                buf.clear()
            code = not code
        elif code:
            buf.append(line)
        elif line.startswith('# '):
            flush()
            story.append(Paragraph(inline(line[2:]), styles['Title']))
        elif line.startswith('## '):
            flush()
            story.append(Paragraph(inline(line[3:]), styles['Heading2']))
        elif line.startswith('- '):
            flush()
            story.append(Paragraph(inline(line[2:]), styles['BodyLab'], bulletText='-'))
        elif not line.strip():
            flush()
        else:
            para.append(line)
    flush()

story = []
markdown(intro + '\n' + answers, story)
story.append(PageBreak())
markdown('# Python Client and Reflection\n\n' + reflection, story)
story.append(PageBreak())
markdown('# Terminal API Evidence\n\n' + curl, story)
story.append(PageBreak())
markdown('# Complete Python Game\n\nQ13 evidence: actual terminal text supplied in chat.\n\n```text\n' + transcript + '\n```', story)
markdown('## Automated verification\n\nAll 16 offline unittest tests passed on my computer (0.239 seconds). The tests exercise request construction, response validation, input handling, simulated wins and losses, and error handling. They mock HTTP traffic and do not replace the live game demonstrated above.', story)

for heading, entries in [
    ('Browser Evidence - Create Game', [('create_game_headers.png', 'Creation request: POST /api/games returned 201 Created.'), ('create_game.png', 'Creation response: identifier, four-letter pattern, six attempts, and playing status.')]),
    ('Browser Evidence - Guess Letter', [('guess_letter_payload.png', 'Guess payload: letter e sent to the server.'), ('guess_letter.png', 'Guess response: e revealed, six attempts remain, and game continues.')]),
]:
    story.append(PageBreak())
    markdown('# ' + heading, story)
    for filename, caption in entries:
        path = SHOTS / filename
        with PILImage.open(path) as im:
            w, h = im.size
        story.append(Image(str(path), width=504, height=504*h/w))
        story.append(Spacer(1, 6))
        story.append(Paragraph(inline(caption), styles['BodyLab']))
        story.append(Spacer(1, 12))

def footer(canvas, doc):
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#64748b'))
    canvas.drawString(48, 28, 'CSE 4095 | Hangman REST API Lab')
    canvas.drawRightString(564, 28, str(doc.page))

pdf = LAB / 'lab_report.pdf'
doc = SimpleDocTemplate(str(pdf), pagesize=(612, 792), rightMargin=48, leftMargin=48,
                        topMargin=40, bottomMargin=44, title='Hangman REST API Lab', author='')
doc.build(story, onFirstPage=footer, onLaterPages=footer)
reader = PdfReader(pdf)
text = '\n'.join(page.extract_text() for page in reader.pages)
for q in range(1, 18):
    assert f'Q{q}.' in text, f'Missing Q{q}'
assert 'You lost!' in text and '404 Not Found' in text
rendered = pypdfium2.PdfDocument(str(pdf))
thumbs = []
for i, page in enumerate(rendered):
    bitmap = page.render(scale=1.3).to_pil()
    bitmap.save(QA / f'page-{i+1:02}.png')
    thumb = bitmap.copy()
    thumb.thumbnail((306, 396))
    thumbs.append(thumb)
sheet = PILImage.new('RGB', (3*326, ((len(thumbs)+2)//3)*426), '#cbd5e1')
draw = ImageDraw.Draw(sheet)
for i, thumb in enumerate(thumbs):
    x, y = (i % 3)*326+10, (i//3)*426+20
    sheet.paste(thumb, (x,y))
    draw.text((x, y-15), f'Page {i+1}', fill='black')
sheet.save(QA / 'contact_sheet.png')
print(f'Created {pdf.name}: {len(reader.pages)} pages; Q1-Q17 and evidence text verified.')

with zipfile.ZipFile(ROOT / 'hangman_lab.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    archive.write(LAB / 'hangman_client.py', 'hangman_lab/hangman_client.py')
    archive.write(pdf, 'hangman_lab/lab_report.pdf')
    for image in sorted(SHOTS.glob('*.png')):
        archive.write(image, 'hangman_lab/screenshots/' + image.name)
with zipfile.ZipFile(ROOT / 'hangman_lab.zip') as archive:
    assert archive.testzip() is None
    assert len(archive.namelist()) == 10
    print('ZIP verified:', '\n'.join(archive.namelist()))
