from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models

router = APIRouter(prefix="/analytics", tags=["Analytics"])

DUE_SOON_WINDOW_DAYS = 7


def _pct(numerator: int, denominator: int) -> float:
    if denominator == 0:
        return 0.0
    return round((numerator / denominator) * 100, 1)


@router.get("/operational")
def get_operational_analytics(db: Session = Depends(get_db)):
    # ---- Fleet ----
    vehicles = db.query(models.Vehicle).all()
    total_vehicles = len(vehicles)
    available_count = sum(1 for v in vehicles if v.status == "available")
    in_use_count = sum(1 for v in vehicles if v.status == "in_use")
    maintenance_count = sum(1 for v in vehicles if v.status == "maintenance")

    fleet = {
        "total_vehicles": total_vehicles,
        "available": available_count,
        "in_use": in_use_count,
        "maintenance": maintenance_count,
        "utilization_percent": _pct(in_use_count, total_vehicles),
    }

    # ---- Shipments ----
    shipments = db.query(models.Shipment).all()
    total_shipments = len(shipments)

    def shipment_status(s):
        return s.status.value if hasattr(s.status, "value") else s.status

    delivered_count = sum(1 for s in shipments if shipment_status(s) == "delivered")
    in_transit_count = sum(1 for s in shipments if shipment_status(s) == "in_transit")
    delayed_count = sum(1 for s in shipments if shipment_status(s) == "delayed")
    cancelled_shipments = sum(1 for s in shipments if shipment_status(s) == "cancelled")
    non_cancelled = total_shipments - cancelled_shipments

    shipments_stats = {
        "total": total_shipments,
        "delivered": delivered_count,
        "in_transit": in_transit_count,
        "delayed": delayed_count,
        "cancelled": cancelled_shipments,
        "success_rate": _pct(delivered_count, non_cancelled),
    }

    # ---- Trips ----
    trips = db.query(models.Trip).all()
    total_trips = len(trips)
    completed_trips = sum(1 for t in trips if t.status == "completed")
    ongoing_trips = sum(1 for t in trips if t.status == "ongoing")
    scheduled_trips = sum(1 for t in trips if t.status == "scheduled")
    cancelled_trips = sum(1 for t in trips if t.status == "cancelled")
    non_cancelled_trips = total_trips - cancelled_trips

    trips_stats = {
        "total": total_trips,
        "completed": completed_trips,
        "ongoing": ongoing_trips,
        "scheduled": scheduled_trips,
        "cancelled": cancelled_trips,
        "completion_rate": _pct(completed_trips, non_cancelled_trips),
    }

    # ---- Drivers ----
    drivers = db.query(models.Driver).all()
    total_drivers = len(drivers)
    active_drivers = sum(1 for d in drivers if d.status == "active")
    inactive_drivers = sum(1 for d in drivers if d.status == "inactive")
    assigned_drivers = sum(1 for d in drivers if d.status == "assigned")

    drivers_stats = {
        "total": total_drivers,
        "active": active_drivers,
        "inactive": inactive_drivers,
        "assigned": assigned_drivers,
    }

    # ---- Maintenance ----
    maintenance_records = db.query(models.Maintenance).all()
    today = datetime.utcnow().date()
    due_soon_cutoff = today + timedelta(days=DUE_SOON_WINDOW_DAYS)

    def maint_status(m):
        return m.status.value if hasattr(m.status, "value") else m.status

    total_maintenance = len(maintenance_records)
    completed_maintenance = sum(1 for m in maintenance_records if maint_status(m) == "completed")
    total_cost = sum(m.service_cost or 0 for m in maintenance_records)

    overdue_count = 0
    due_soon_count = 0
    for m in maintenance_records:
        if maint_status(m) in ("completed", "cancelled") or not m.next_service_date:
            continue
        next_date = m.next_service_date.date() if hasattr(m.next_service_date, "date") else m.next_service_date
        if next_date < today:
            overdue_count += 1
        elif next_date <= due_soon_cutoff:
            due_soon_count += 1

    maintenance_stats = {
        "total_records": total_maintenance,
        "completed": completed_maintenance,
        "overdue": overdue_count,
        "due_soon": due_soon_count,
        "total_cost": round(total_cost, 2),
    }

    return {
        "fleet": fleet,
        "shipments": shipments_stats,
        "trips": trips_stats,
        "drivers": drivers_stats,
        "maintenance": maintenance_stats,
    }