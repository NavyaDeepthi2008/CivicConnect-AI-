from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db, Issue, User, Notification
from datetime import datetime

admin_bp = Blueprint('admin', __name__)

def require_admin(user_id):
    user = User.query.get(user_id)
    return user and user.role == 'admin'

@admin_bp.route('/issues', methods=['GET'])
@jwt_required()
def get_all_issues():
    user_id = int(get_jwt_identity())
    if not require_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403
    page = request.args.get('page', 1, type=int)
    status = request.args.get('status')
    category = request.args.get('category')
    priority = request.args.get('priority')
    search = request.args.get('search', '')

    query = Issue.query
    if status: query = query.filter(Issue.status == status)
    if category: query = query.filter(Issue.category == category)
    if priority: query = query.filter(Issue.ai_priority == priority)
    if search: query = query.filter(Issue.title.ilike(f'%{search}%'))
    query = query.order_by(Issue.created_at.desc())
    issues = query.paginate(page=page, per_page=20, error_out=False)
    return jsonify({
        'issues': [i.to_dict(include_reporter=True) for i in issues.items],
        'total': issues.total, 'pages': issues.pages
    }), 200

@admin_bp.route('/issues/<int:issue_id>/status', methods=['PUT'])
@jwt_required()
def update_status(issue_id):
    user_id = int(get_jwt_identity())
    if not require_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403
    issue = Issue.query.get_or_404(issue_id)
    data = request.get_json()
    valid_statuses = ['pending', 'under_review', 'in_progress', 'resolved', 'rejected']
    if data.get('status') not in valid_statuses:
        return jsonify({'error': 'Invalid status'}), 400
    issue.status = data['status']
    issue.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(issue.to_dict()), 200

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    user_id = int(get_jwt_identity())
    if not require_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403
    total = Issue.query.count()
    pending = Issue.query.filter_by(status='pending').count()
    in_progress = Issue.query.filter_by(status='in_progress').count()
    resolved = Issue.query.filter_by(status='resolved').count()
    high_priority = Issue.query.filter_by(ai_priority='High').count()
    total_users = User.query.filter_by(role='citizen').count()
    return jsonify({
        'total_issues': total, 'pending': pending,
        'in_progress': in_progress, 'resolved': resolved,
        'high_priority': high_priority, 'total_users': total_users,
        'resolution_rate': round((resolved / total * 100) if total > 0 else 0, 1)
    }), 200

@admin_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = int(get_jwt_identity())
    if not require_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403
    notifs = Notification.query.order_by(Notification.created_at.desc()).limit(50).all()
    return jsonify([n.to_dict() for n in notifs]), 200

@admin_bp.route('/notifications/<int:notif_id>/read', methods=['PUT'])
@jwt_required()
def mark_read(notif_id):
    user_id = int(get_jwt_identity())
    if not require_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403
    notif = Notification.query.get_or_404(notif_id)
    notif.is_read = True
    db.session.commit()
    return jsonify({'success': True}), 200

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    user_id = int(get_jwt_identity())
    if not require_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403
    users = User.query.filter_by(role='citizen').all()
    return jsonify([u.to_dict() for u in users]), 200
