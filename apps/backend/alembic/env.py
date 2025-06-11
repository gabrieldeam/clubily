# backend/alembic/env.py

from logging.config import fileConfig
import os
import sys

from sqlalchemy import engine_from_config, pool
from alembic import context

# 1) Configura logging via alembic.ini
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 2) Adiciona o root do projeto no path para importar seus módulos
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(project_root)

# 3) Importa o Base e os seus models para registrar o metadata
from app.db.base import Base
from app.models.user import User
from app.models.company import Company
from app.models.phone_verification import PhoneVerification
from app.models.association import user_companies
from app.models.category import Category
from app.models.association import company_categories
from app.models.address import Address
from app.models.referral import Referral
from app.models.cashback import Cashback
from app.models.cashback_program import CashbackProgram


# ...importe aqui outros models quando criar novos

# 4) Metadata alvo para autogenerate
target_metadata = Base.metadata


# === 5) Hooks ===

def process_revision_directives(context, revision, directives):
    """
    Aborta a criação de um arquivo de migration caso não tenha detectado mudanças.
    """
    script = directives[0]
    if script.upgrade_ops.is_empty():
        print("⚠️ Nenhuma alteração detectada no esquema; migração não gerada.")
        directives[:] = []  # esvazia a lista, abortando o arquivo de migration


def include_object(object, name, type_, reflected, compare_to):
    """
    Exclui do autogenerate qualquer tabela cujo nome comece com 'tmp_'.
    """
    if type_ == "table" and name.startswith("tmp_"):
        return False
    return True


# === 6) Modo offline ===

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        process_revision_directives=process_revision_directives,
        include_object=include_object,
    )
    with context.begin_transaction():
        context.run_migrations()


# === 7) Modo online ===

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            process_revision_directives=process_revision_directives,
            include_object=include_object,
        )
        with context.begin_transaction():
            context.run_migrations()


# 8) Dispara o modo correto
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
