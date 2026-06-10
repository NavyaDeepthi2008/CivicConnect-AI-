from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from database import db, Issue
from sqlalchemy import func
from datetime import datetime, timedelta
import json

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/overview', methods=['GET'])
@jwt_required()
def overview():
    by_category = db.session.query(Issue.category, func.count(Issue.id)).group_by(Issue.category).all()
    by_status = db.session.query(Issue.status, func.count(Issue.id)).group_by(Issue.status).all()
    by_priority = db.session.query(Issue.ai_priority, func.count(Issue.id)).group_by(Issue.ai_priority).all()
    by_city = db.session.query(Issue.city, func.count(Issue.id)).group_by(Issue.city).order_by(func.count(Issue.id).desc()).limit(10).all()
    
    monthly = []
    for i in range(5, -1, -1):
        d = datetime.utcnow() - timedelta(days=30*i)
        start = d.replace(day=1, hour=0, minute=0, second=0)
        end = (start + timedelta(days=32)).replace(day=1)
        count = Issue.query.filter(Issue.created_at >= start, Issue.created_at < end).count()
        monthly.append({'month': start.strftime('%b %Y'), 'count': count})

    return jsonify({
        'by_category': [{'category': r[0], 'count': r[1]} for r in by_category],
        'by_status': [{'status': r[0], 'count': r[1]} for r in by_status],
        'by_priority': [{'priority': r[0] or 'Unknown', 'count': r[1]} for r in by_priority],
        'by_city': [{'city': r[0] or 'Unknown', 'count': r[1]} for r in by_city],
        'monthly_trend': monthly
    }), 200

@analytics_bp.route('/area-risk', methods=['GET'])
@jwt_required()
def area_risk():
    areas = db.session.query(Issue.area_name, func.count(Issue.id).label('count')).group_by(Issue.area_name).order_by(func.count(Issue.id).desc()).limit(10).all()
    result = []
    for area, count in areas:
        high_priority = Issue.query.filter_by(area_name=area, ai_priority='High').count()
        risk_score = min(100, count * 5 + high_priority * 10)
        result.append({'area': area or 'Unknown', 'issue_count': count, 'high_priority': high_priority, 'risk_score': risk_score})
    return jsonify(result), 200

@analytics_bp.route('/trend', methods=['GET'])
@jwt_required()
def trend_analysis():
    categories = ['Road Issue', 'Water Issue', 'Sanitation Issue', 'Electrical Issue', 'Safety Issue']
    trends = []
    for cat in categories:
        now_count = Issue.query.filter(Issue.ai_category == cat, Issue.created_at >= datetime.utcnow() - timedelta(days=30)).count()
        prev_count = Issue.query.filter(Issue.ai_category == cat,
            Issue.created_at >= datetime.utcnow() - timedelta(days=60),
            Issue.created_at < datetime.utcnow() - timedelta(days=30)).count()
        change = 0
        if prev_count > 0:
            change = round(((now_count - prev_count) / prev_count) * 100, 1)
        trends.append({'category': cat, 'current_month': now_count, 'previous_month': prev_count, 'change_percent': change})
    return jsonify(trends), 200
