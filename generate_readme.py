import markdown
import os

def convert_markdown_to_html():
    # הנתיב לקובץ ה-README המקורי שלך. 
    # אם הקובץ נמצא באותה תיקייה של הסקריפט, פשוט שים 'README.md'
    md_file_path = 'public/ai-research/README.md' 
    output_html_path = 'public/readme.html'
    
    # נוודא שהקובץ קיים, ואם לא נייצר קובץ דוגמה כדי שהסקריפט לא יקרוס
    if not os.path.exists(md_file_path):
        print(f"Warning: {md_file_path} not found. Creating a sample one...")
        with open(md_file_path, 'w', encoding='utf-8') as f:
            f.write("# כותרת ראשית\n\nטקסט לדוגמה שנוצר אוטומטית.\n* פריט 1\n* פריט 2")
            
    # קריאת קובץ ה-Markdown
    with open(md_file_path, 'r', encoding='utf-8') as f:
        markdown_text = f.read()
    
    # המרה ל-HTML עם הרחבות קריטיות לקריאות:
    # nl2br - הופך כל ירידת שורה רגילה ל-<br> כדי למנוע חומת טקסט
    # sane_lists - מתקן באגים של רשימות ממוספרות/נקודות ב-Markdown
    html_content = markdown.markdown(
        markdown_text, 
        extensions=['fenced_code', 'tables', 'nl2br', 'sane_lists']
    )
    
    # תבנית ה-HTML עם עיצוב Cyberpunk & Dark Glassmorphism 
    html_template = f"""<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Portal & Engineering Lab</title>
    <style>
        :root {{
            --bg-base: #0a0a0f;
            --glass-bg: rgba(16, 18, 27, 0.7);
            --glass-border: rgba(0, 243, 255, 0.15);
            --text-main: #e2e8f0;
            --text-muted: #94a3b8;
            --neon-blue: #00f3ff;
            --neon-pink: #ff00ea;
            --neon-green: #39ff14;
        }}

        * {{ box-sizing: border-box; }}

        body {{
            font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg-base);
            background-image: 
                radial-gradient(circle at 15% 50%, rgba(0, 243, 255, 0.05) 0%, transparent 50%),
                radial-gradient(circle at 85% 30%, rgba(255, 0, 234, 0.05) 0%, transparent 50%);
            color: var(--text-main);
            line-height: 1.8;
            padding: 40px 20px;
            margin: 0;
            min-height: 100vh;
        }}

        .glass-container {{
            max-width: 900px;
            margin: 0 auto;
            background: var(--glass-bg);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid var(--glass-border);
            border-radius: 16px;
            padding: 40px 50px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 
                        inset 0 0 20px rgba(0, 243, 255, 0.02);
        }}

        h1, h2, h3, h4 {{
            color: var(--neon-blue);
            text-shadow: 0 0 15px rgba(0, 243, 255, 0.3);
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            font-weight: 600;
        }}

        h1 {{
            font-size: 2.5em;
            border-bottom: 2px solid rgba(255, 0, 234, 0.5);
            padding-bottom: 15px;
            margin-top: 0;
            text-shadow: 0 0 15px rgba(255, 0, 234, 0.4);
            color: var(--text-main);
        }}

        p {{ margin-bottom: 1.2em; }}

        ul, ol {{
            padding-right: 25px;
            margin-bottom: 1.5em;
        }}

        li {{ margin-bottom: 8px; }}
        li::marker {{ color: var(--neon-pink); font-weight: bold; }}

        strong, b {{
            color: white;
            text-shadow: 0 0 8px rgba(255,255,255,0.4);
        }}

        em, i {{ color: var(--text-muted); }}

        code {{
            background: rgba(0, 0, 0, 0.6);
            color: var(--neon-pink);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', Courier, monospace;
            border: 1px solid rgba(255, 0, 234, 0.2);
            font-size: 0.9em;
        }}

        pre {{
            background: #050505;
            border: 1px solid #333;
            border-left: 3px solid var(--neon-blue);
            padding: 15px;
            border-radius: 8px;
            direction: ltr; /* קוד תמיד משמאל לימין */
            text-align: left;
            overflow-x: auto;
            margin: 20px 0;
            box-shadow: inset 0 0 10px rgba(0,0,0,0.8);
        }}

        pre code {{
            background: transparent;
            border: none;
            color: var(--neon-green);
            text-shadow: 0 0 5px rgba(57, 255, 20, 0.3);
            padding: 0;
        }}

        /* עיצוב המעטפת של הטבלה */
        table {{
            border-collapse: collapse;
            width: 100%;
            margin: 25px 0;
            background: rgba(0, 0, 0, 0.4);
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 
                        0 0 0 1px rgba(0, 243, 255, 0.1); /* מסגרת זוהרת עדינה */
        }}

        /* עיצוב התאים עם אנימציית מעבר חלקה */
        th, td {{
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            padding: 15px 18px;
            text-align: right;
            transition: all 0.3s ease;
        }}

        /* הדגשה וזוהר לכותרות העמודות */
        th {{
            background-color: rgba(0, 243, 255, 0.12);
            color: var(--neon-blue);
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 0.95em;
            border-bottom: 2px solid var(--neon-blue);
            text-shadow: 0 0 10px rgba(0, 243, 255, 0.4);
        }}

    /* אפקט זברה: צבע רקע עדין לשורות זוגיות לקריאות טובה יותר */
    tbody tr:nth-child(even) {{
        background-color: rgba(255, 255, 255, 0.02);
    }}

    /* אפקט Hover מרכזי לשורות - נדלק כשעוברים עם העכבר */
    tbody tr:hover {{
        background-color: rgba(0, 243, 255, 0.08);
        box-shadow: inset 4px 0 0 var(--neon-blue); /* פס צדדי שנדלק */
    }}

    /* אפקט Hover נקודתי לתא בודד (אופציונלי - מוסיף תחושת מטריקס) */
    tbody td:hover {{
        color: #fff;
        text-shadow: 0 0 8px rgba(255, 255, 255, 0.7);
        background-color: rgba(255, 0, 234, 0.05); /* נגיעה קלה של ורוד-ניאון */
    }}
    </style>
</head>
<body>
    <div class="glass-container">
        {html_content}
    </div>
</body>
</html>
"""
    
    # יצירת התיקייה public אם היא לא קיימת וכתיבת הקובץ
    os.makedirs(os.path.dirname(output_html_path), exist_ok=True)
    with open(output_html_path, 'w', encoding='utf-8') as f:
        f.write(html_template)
        
    print(f"✅ Success! beautifully styled HTML created at: {output_html_path}")
    print(f"🔍 Open {output_html_path} in your browser to see the result.")

if __name__ == "__main__":
    convert_markdown_to_html()