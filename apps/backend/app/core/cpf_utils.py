# backend/app/core/cpf_utils.py

import re

def normalize_cpf(value: str) -> str:
    """
    Remove tudo que não for dígito e garante 11 dígitos.
    """
    if not value:
        raise ValueError("CPF ausente")
    digits = re.sub(r"\D", "", value)
    if len(digits) != 11:
        raise ValueError("CPF inválido: deve ter exatamente 11 dígitos")
    return digits
