"""
routes/status.py — Document Processing Status Endpoint

GET /api/ai/status/{doc_id}
Returns OCR progress and ETA from Redis for the given document.
"""

from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.get("/status/{doc_id}")
async def status_endpoint(doc_id: str):
    try:
        # Fetch progress from Supabase
        from app.utils.supabase import get_supabase_client
        sb = get_supabase_client()
        res = sb.table("personal_documents").select("ocr_progress, ocr_eta, ocr_page, ocr_total, processing_status").eq("id", doc_id).execute()
        
        if not res.data:
            return {"progress": 0, "eta": None, "status": "pending"}
            
        doc = res.data[0]
        progress = doc.get("ocr_progress") or 0
        eta = doc.get("ocr_eta")
        page = doc.get("ocr_page")
        total = doc.get("ocr_total")
        status = doc.get("processing_status") or "pending"
        
        return {
            "progress": progress,
            "eta": eta,
            "page": page,
            "total": total,
            "status": status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")
