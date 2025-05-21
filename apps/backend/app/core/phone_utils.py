# backend/app/core/phone_utils.py
import phonenumbers
from phonenumbers import NumberParseException

def normalize_phone(raw_phone: str, default_region: str = "BR") -> str:
    """
    Recebe algo como "22997870080", "(21) 99978-7008", "+55 21 99978-7008"
    e retorna no formato E.164: "+5521999787008".
    Lança ValueError se não for possível validar.
    """
    try:
        parsed = phonenumbers.parse(raw_phone, default_region)
        if not phonenumbers.is_valid_number(parsed):
            raise ValueError("Telefone inválido")
        # opcional: forçar apenas BR: 
        # if parsed.country_code != 55:
        #     raise ValueError("Só aceitamos números brasileiros")
        return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
    except NumberParseException as e:
        raise ValueError(f"Não foi possível parsear o telefone: {e}")
