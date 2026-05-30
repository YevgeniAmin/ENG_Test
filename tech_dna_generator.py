import plotly.graph_objects as go
import os

# 1. Define your Engineering DNA Metrics (English)
categories = [
    'Python Automation', 
    'HW/SW Integration', 
    'Linux & Bare-Metal', 
    'Military Testing (ATP/ESS)', 
    'Cloud Systems (Firebase)',
    'AI Agents Deployment'
]
values = [85, 95, 90, 100, 80, 85]

# 2. Build the Radar Chart (Cyberpunk Dark Theme)
fig = go.Figure()

fig.add_trace(go.Scatterpolar(
    r=values,
    theta=categories,
    fill='toself',
    name='Skills Matrix',
    line_color='#00f2ff',  # Cyan Neon
    fillcolor='rgba(0, 242, 255, 0.2)',
    marker=dict(size=6, color='#ff007f')  # Pink Neon dots
))

fig.update_layout(
    polar=dict(
        radialaxis=dict(
            visible=True, 
            range=[0, 100], 
            gridcolor='rgba(255, 255, 255, 0.1)',
            angle=45,
            tickfont=dict(color='rgba(255, 255, 255, 0.5)', size=10)
        ),
        angularaxis=dict(
            gridcolor='rgba(255, 255, 255, 0.1)',
            tickfont=dict(color='white', size=12, family='monospace')
        ),
        bgcolor='rgba(15, 23, 42, 0.6)' 
    ),
    showlegend=False,
    paper_bgcolor='rgba(0,0,0,0)', 
    margin=dict(l=40, r=40, t=40, b=40)
)

# 3. HTML Wrapper with Live Clock, Email, and Pro English (LTR)
html_content = f"""
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Yevgeni Aminov | Engineering Portfolio</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {{
            background: linear-gradient(135deg, #0f172a 0%, #020617 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: monospace;
            color: white;
        }}
        .glass-card {{
            background: rgba(30, 41, 59, 0.4);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(0, 242, 255, 0.2);
            box-shadow: 0 0 30px rgba(0, 242, 255, 0.1);
        }}
        .terminal-text {{
            text-shadow: 0 0 5px rgba(0, 242, 255, 0.5);
        }}
    </style>
</head>
<body class="p-4 relative">

    <!-- Live System Clock -->
    <div class="absolute top-4 right-4 md:top-8 md:right-8 flex items-center gap-2 text-cyan-400 text-sm font-bold terminal-text">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        <span id="sys-clock">00:00:00</span>
    </div>

    <div class="glass-card rounded-2xl p-6 md:p-10 max-w-5xl w-full flex flex-col md:flex-row items-center gap-10">
        
        <!-- Left Side: Professional Profile -->
        <div class="w-full md:w-1/2 flex flex-col justify-between h-full space-y-6">
            <div>
                <div class="text-xs text-cyan-400 font-bold tracking-widest uppercase mb-2">// CORE_SYSTEM_PROFILE</div>
                <h1 class="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-fuchsia-500 bg-clip-text text-transparent pb-1">YEVGENI AMINOV</h1>
                <p class="text-slate-300 text-base mt-1">Test Automation Engineer & Python Developer</p>
                <a href="mailto:eng@yevgeni.info" class="inline-flex items-center gap-2 mt-3 text-sm text-cyan-300 hover:text-white transition-colors duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    eng@yevgeni.info
                </a>
            </div>

            <div class="space-y-4 border-l-2 border-cyan-500/30 pl-5">
                <p class="text-sm leading-relaxed"><span class="text-cyan-400 font-bold">⚡ Expertise:</span> Architecting automated testing infrastructures (ATP/QTP/ESS) for complex military-grade systems.</p>
                <p class="text-sm leading-relaxed"><span class="text-cyan-400 font-bold">🐧 Environments:</span> Deep mastery of Linux (Kernel-level debugging) and Enterprise Windows IoT deployments.</p>
                <p class="text-sm leading-relaxed"><span class="text-cyan-400 font-bold">🤖 AI Integration:</span> Deploying LLM agents for automated engineering log analysis and accelerated root-cause diagnostics.</p>
            </div>

            <div class="pt-4 flex flex-wrap gap-4">
                <a href="https://linkedin.com" target="_blank" class="px-5 py-2.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/30 border border-cyan-400/50 text-xs text-cyan-300 transition-all font-bold tracking-wider">LINKEDIN PROFILE</a>
                <a href="/" class="px-5 py-2.5 rounded-lg bg-fuchsia-500/10 hover:bg-fuchsia-500/30 border border-fuchsia-400/50 text-xs text-fuchsia-300 transition-all font-bold tracking-wider">ENTER WEB PORTAL</a>
            </div>

            <div class="text-[11px] text-slate-500 pt-6">
                © 2026 Pro Max Systems v1.0.3 RC | Deployed by Yevgeni A.
            </div>
        </div>

        <!-- Right Side: Interactive Plotly Chart -->
        <div class="w-full md:w-1/2 flex justify-center items-center">
            <div class="w-full overflow-hidden rounded-xl">
                {fig.to_html(full_html=False, include_plotlyjs='cdn')}
            </div>
        </div>

    </div>

    <!-- Live Clock Script -->
    <script>
        function updateClock() {{
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', {{ hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }});
            document.getElementById('sys-clock').innerText = "SYS.TIME [" + timeString + "]";
        }}
        setInterval(updateClock, 1000);
        updateClock(); // Initial call
    </script>
</body>
</html>
"""

# 4. Save directly to the requested absolute path
output_path = r"C:\eng-portal\public\my_tech_dna.html"

try:
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"🚀 Success! Engineering Digital Card generated at: {output_path}")
except FileNotFoundError:
    print(f"❌ Error: The directory for {output_path} does not exist. Please make sure 'C:\\eng-portal\\public' is created.")