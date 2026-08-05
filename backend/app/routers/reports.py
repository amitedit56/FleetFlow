from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/maintenance")
def get_maintenance_report(db: Session = Depends(get_db)):
    """
    Task 3 — Maintenance Reports API.
    GET /reports/maintenance
    """
    records = db.query(models.Maintenance).all()

    def rec_status(m):
        return m.status.value if hasattr(m.status, "value") else m.status

    def rec_category(m):
        return m.category.value if hasattr(m.category, "value") else m.category

    total_records = len(records)
    completed_services = sum(1 for m in records if rec_status(m) == "completed")
    total_cost = sum(m.service_cost or 0 for m in records)

    today = datetime.utcnow().date()
    overdue_services = 0
    for m in records:
        if rec_status(m) in ("completed", "cancelled") or not m.next_service_date:
            continue
        next_date = m.next_service_date.date() if hasattr(m.next_service_date, "date") else m.next_service_date
        if next_date < today:
            overdue_services += 1

    vehicles_under_maintenance = (
        db.query(models.Vehicle).filter(models.Vehicle.status == "maintenance").count()
    )

    category_counts = {}
    for m in records:
        cat = rec_category(m)
        category_counts[cat] = category_counts.get(cat, 0) + 1
    most_frequent_category = max(category_counts, key=category_counts.get) if category_counts else None

    return {
        "total_maintenance_records": total_records,
        "vehicles_under_maintenance": vehicles_under_maintenance,
        "completed_services": completed_services,
        "overdue_services": overdue_services,
        "total_maintenance_cost": round(total_cost, 2),
        "most_frequent_maintenance_category": most_frequent_category,
    }