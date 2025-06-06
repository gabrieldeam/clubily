# app/core/utils.py

import re

def normalize_phone(raw: str) -> str:
    return re.sub(r"\D+", "", raw)

def normalize_cpf(raw: str) -> str:
    only_digits = re.sub(r"\D+", "", raw)
    # aqui você pode adicionar validação de dígitos verificadores, se quiser.
    return only_digits
