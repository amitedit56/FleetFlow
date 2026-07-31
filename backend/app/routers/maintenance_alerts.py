from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app import models
from app import schemas
from app.utils.dependencies import require_role

router = APIRouter(prefix="/maintenance-alerts", tags=["Maintenance Alerts"])


@router.get("/", response_model=list[schemas.MaintenanceAlertResponse])
def list_alerts(
    is_read: Optional[bool] = None,
    vehicle_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.MaintenanceAlert)
    if is_read is not None:
        query = query.filter(models.MaintenanceAlert.is_read == is_read)
    if vehicle_id is not None:
        query = query.filter(models.MaintenanceAlert.vehicle_id == vehicle_id)
    return query.order_by(models.MaintenanceAlert.created_at.desc()).all()


@router.get("/unread-count")
def unread_count(db: Session = Depends(get_db)):
    count = db.query(models.MaintenanceAlert).filter(models.MaintenanceAlert.is_read == False).count()  # noqa: E712
    return {"unread_count": count}


@router.get("/{alert_id}", response_model=schemas.MaintenanceAlertResponse)
def get_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(models.MaintenanceAlert).filter(models.MaintenanceAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    return alert


@router.put("/{alert_id}/read", response_model=schemas.MaintenanceAlertResponse)
def mark_alert_read(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(models.MaintenanceAlert).filter(models.MaintenanceAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    alert.is_read = True
    db.commit()
    db.refresh(alert)
    return alert


@router.put("/mark-all-read")
def mark_all_read(db: Session = Depends(get_db)):
    updated = db.query(models.MaintenanceAlert).filter(models.MaintenanceAlert.is_read == False).update({"is_read": True})  # noqa: E712
    db.commit()
    return {"message": f"{updated} alert(s) marked as read"}


@router.delete("/{alert_id}")
def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "fleet_manager")),
):
    alert = db.query(models.MaintenanceAlert).filter(models.MaintenanceAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    db.delete(alert)
    db.commit()
    return {"message": "Alert deleted successfully"}