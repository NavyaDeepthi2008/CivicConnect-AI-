from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db, Issue, Vote, Comment, Notification, User
from werkzeug.utils import secure_filename
import os, json, math, uuid

issues_bp = Blueprint('issues', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

def ai_classify(title, description):
    text = (title + ' ' + description).lower()
    if any(w in text for w in ['road', 'pothole', 'traffic', 'street', 'highway', 'pavement']):
        return 'Road Issue'
    if any(w in text for w in ['water', 'pipe', 'leak', 'flood', 'drain', 'sewage', 'drainage']):
        return 'Water Issue'
    if any(w in text for w in ['garbage', 'waste', 'trash', 'dump', 'litter', 'sanitation', 'toilet']):
        return 'Sanitation Issue'
    if any(w in text for w in ['light', 'electric', 'power', 'wiring', 'transformer', 'electricity']):
        return 'Electrical Issue'
    if any(w in text for w in ['crime', 'safety', 'fire', 'accident', 'danger', 'threat', 'robbery']):
        return 'Safety Issue'
    if any(w in text for w in ['pollution', 'smoke', 'dust', 'noise', 'air']):
        return 'Environmental Issue'
    return 'General Issue'

def ai_priority(title, description, severity):
    text = (title + ' ' + description).lower()
    high_keywords = ['school', 'hospital', 'child', 'accident', 'fire', 'danger', 'emergency', 'death', 'injury', 'safety']
    low_keywords = ['minor', 'small', 'cosmetic', 'paint', 'sign']
    if severity == 'high' or any(w in text for w in high_keywords):
        return 'High'
    if severity == 'low' or any(w in text for w in low_keywords):
        return 'Low'
    return 'Medium'

def ai_summary(title, description):
    words = description.split()[:30]
    return f"Civic issue reported: {title}. {' '.join(words)}{'...' if len(description.split()) > 30 else ''}"

@issues_bp.route('/', methods=['GET'])
@jwt_required()
def get_issues():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    category = request.args.get('category')
    status = request.args.get('status')
    severity = request.args.get('severity')
    search = request.args.get('search', '')
    sort = request.args.get('sort', 'recent')

    query = Issue.query
    if category: query = query.filter(Issue.category == category)
    if status: query = query.filter(Issue.status == status)
    if severity: query = query.filter(Issue.severity == severity)
    if search: query = query.filter(Issue.title.ilike(f'%{search}%') | Issue.description.ilike(f'%{search}%'))
    if sort == 'votes': query = query.order_by(Issue.vote_count.desc())
    elif sort == 'priority': query = query.order_by(Issue.ai_priority.asc())
    else: query = query.order_by(Issue.created_at.desc())

    issues = query.paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'issues': [i.to_dict(include_reporter=True) for i in issues.items],
        'total': issues.total,
        'pages': issues.pages,
        'current_page': page
    }), 200

@issues_bp.route('/nearby', methods=['GET'])
@jwt_required()
def get_nearby():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    radius = request.args.get('radius', 10, type=float)
    all_issues = Issue.query.order_by(Issue.created_at.desc()).all()
    nearby = []
    for issue in all_issues:
        if user.latitude and user.longitude:
            dist = haversine(user.latitude, user.longitude, issue.latitude, issue.longitude)
            if dist <= radius:
                d = issue.to_dict(include_reporter=True)
                d['distance'] = round(dist, 2)
                nearby.append(d)
    nearby.sort(key=lambda x: x['distance'])
    return jsonify(nearby[:50]), 200

@issues_bp.route('/<int:issue_id>', methods=['GET'])
@jwt_required()
def get_issue(issue_id):
    issue = Issue.query.get_or_404(issue_id)
    user_id = int(get_jwt_identity())
    data = issue.to_dict(include_reporter=True)
    data['user_voted'] = Vote.query.filter_by(user_id=user_id, issue_id=issue_id).first() is not None
    data['comments'] = [c.to_dict() for c in issue.comments]
    return jsonify(data), 200

@issues_bp.route('/', methods=['POST'])
@jwt_required()
def create_issue():
    user_id = int(get_jwt_identity())
    data = request.form.to_dict()
    required = ['title', 'description', 'latitude', 'longitude']
    for f in required:
        if not data.get(f):
            return jsonify({'error': f'{f} is required'}), 400

    title = data['title']
    description = data['description']
    category = ai_classify(title, description)
    priority = ai_priority(title, description, data.get('severity', 'medium'))
    summary = ai_summary(title, description)

    images = []
    files = request.files.getlist('images')
    for file in files:
        if file and allowed_file(file.filename):
            filename = str(uuid.uuid4()) + '_' + secure_filename(file.filename)
            file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], filename))
            images.append(f'/api/issues/uploads/{filename}')

    issue = Issue(
        title=title, description=description,
        category=data.get('category', category),
        severity=data.get('severity', 'medium'),
        latitude=float(data['latitude']), longitude=float(data['longitude']),
        area_name=data.get('area_name', ''), city=data.get('city', ''), state=data.get('state', ''),
        images=json.dumps(images), user_id=user_id,
        ai_category=category, ai_priority=priority, ai_summary=summary
    )
    db.session.add(issue)
    db.session.commit()

    notif = Notification(
        type='new_issue' if priority != 'High' else 'high_priority',
        title=f'New {priority} Priority Issue',
        message=f'"{title}" reported in {data.get("area_name", "your area")}',
        issue_id=issue.id
    )
    db.session.add(notif)
    db.session.commit()
    return jsonify(issue.to_dict()), 201

@issues_bp.route('/check-duplicate', methods=['POST'])
@jwt_required()
def check_duplicate():
    data = request.get_json()
    title = data.get('title', '')
    lat = data.get('latitude')
    lon = data.get('longitude')
    if not lat or not lon:
        return jsonify({'duplicate': False}), 200
    nearby_issues = Issue.query.filter(Issue.status != 'resolved').all()
    for issue in nearby_issues:
        dist = haversine(float(lat), float(lon), issue.latitude, issue.longitude)
        title_sim = len(set(title.lower().split()) & set(issue.title.lower().split()))
        if dist < 0.5 and title_sim >= 2:
            return jsonify({'duplicate': True, 'existing_issue': issue.to_dict()}), 200
    return jsonify({'duplicate': False}), 200

@issues_bp.route('/<int:issue_id>/vote', methods=['POST'])
@jwt_required()
def vote_issue(issue_id):
    user_id = int(get_jwt_identity())
    issue = Issue.query.get_or_404(issue_id)
    existing = Vote.query.filter_by(user_id=user_id, issue_id=issue_id).first()
    if existing:
        db.session.delete(existing)
        issue.vote_count = max(0, issue.vote_count - 1)
        db.session.commit()
        return jsonify({'voted': False, 'vote_count': issue.vote_count}), 200
    vote = Vote(user_id=user_id, issue_id=issue_id)
    issue.vote_count += 1
    db.session.add(vote)
    if issue.vote_count >= 10:
        notif = Notification(type='popular_issue', title='Popular Issue Alert',
            message=f'"{issue.title}" has {issue.vote_count} supporters!', issue_id=issue.id)
        db.session.add(notif)
    db.session.commit()
    return jsonify({'voted': True, 'vote_count': issue.vote_count}), 200

@issues_bp.route('/<int:issue_id>/comment', methods=['POST'])
@jwt_required()
def add_comment(issue_id):
    user_id = int(get_jwt_identity())
    Issue.query.get_or_404(issue_id)
    data = request.get_json()
    if not data.get('content'):
        return jsonify({'error': 'Comment content required'}), 400
    comment = Comment(content=data['content'], user_id=user_id, issue_id=issue_id)
    db.session.add(comment)
    db.session.commit()
    return jsonify(comment.to_dict()), 201

@issues_bp.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)

@issues_bp.route('/my-issues', methods=['GET'])
@jwt_required()
def my_issues():
    user_id = int(get_jwt_identity())
    issues = Issue.query.filter_by(user_id=user_id).order_by(Issue.created_at.desc()).all()
    return jsonify([i.to_dict() for i in issues]), 200
