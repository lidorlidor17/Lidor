# ⚡ BESS Planner - תכנון אתרי אגירת חשמל

תוכנה לשרטוט, מידול וחישוב אתרי אגירת חשמל בסוללות (Battery Energy Storage Systems).

## יכולות עיקריות
- **שרטוט 2D**: תכנית אתר עם גרירה ושחרור של רכיבי BESS
- **ויזואליזציה 3D**: תצוגה תלת-ממדית של האתר
- **חישובים הנדסיים**: קיבולת, הספק, שימוש בקרקע, הערכת עלות
- **דוחות PDF**: ייצוא דוח הנדסי מקצועי

## רכיבים נתמכים
- מכלי סוללות (Battery Containers)
- ממירי PCS
- שנאי מתח
- חדר בקרה
- תחנת משנה
- גדר, דרכים, גבולות

## התקנה

### פיתוח
```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev
```

### Docker
```bash
docker-compose up --build
```
פתח: http://localhost:3000

## מחסנית טכנולוגית
- **Frontend**: React 18, TypeScript, Vite, Konva.js, Three.js, Zustand
- **Backend**: Python 3.11, FastAPI, SQLAlchemy, ReportLab
- **Database**: SQLite (פיתוח) / PostgreSQL (ייצור)
