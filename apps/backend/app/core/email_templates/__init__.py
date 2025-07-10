from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape

# caminho: .../app/core/email_templates
templates_dir = Path(__file__).parent

env = Environment(
    loader=FileSystemLoader(templates_dir),
    autoescape=select_autoescape(["html", "xml"]),
    trim_blocks=True,
    lstrip_blocks=True,
)

def render_template(name: str, **context) -> str:
    """
    Renderiza um template HTML Jinja2 com o contexto fornecido.
    """
    template = env.get_template(name)
    return template.render(**context)
