from datetime import date

from django.db import transaction

from ..models import SequenceCounter


def _year2_from_date(value: date | None) -> str:
    target = value or date.today()
    return f"{target.year % 100:02d}"


@transaction.atomic
def next_indicator(origin_code: str, year2: str | None = None) -> str:
    """Generate the next action indicator in an atomic transaction."""
    if not origin_code or len(origin_code) < 2:
        raise ValueError("origin_code must include at least two characters")

    code = origin_code.upper()
    year_fragment = year2 or _year2_from_date(None)
    counter, _ = (
        SequenceCounter.objects.select_for_update()
        .get_or_create(origin_code=code, year2=year_fragment, defaults={"last_serial": 0})
    )
    counter.last_serial += 1
    counter.save(update_fields=["last_serial"])
    return f"{code}-{year_fragment}-{counter.last_serial:03d}"
