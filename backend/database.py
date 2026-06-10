from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    area_name = db.Column(db.String(200))
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    role = db.Column(db.String(20), default='citizen')  # citizen / admin
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    issues = db.relationship('Issue', backref='reporter', lazy=True)
    votes = db.relationship('Vote', backref='voter', lazy=True)
    comments = db.relationship('Comment', backref='author', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'area_name': self.area_name,
            'city': self.city,
            'state': self.state,
            'role': self.role,
            'created_at': self.created_at.isoformat(),
            'total_reports': len(self.issues),
            'resolved_reports': sum(1 for i in self.issues if i.status == 'resolved'),
            'active_reports': sum(1 for i in self.issues if i.status in ['pending', 'in_progress', 'under_review'])
        }

class Issue(db.Model):
    __tablename__ = 'issues'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    severity = db.Column(db.String(20), default='medium')  # low / medium / high
    status = db.Column(db.String(30), default='pending')
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    area_name = db.Column(db.String(200))
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    images = db.Column(db.Text, default='[]')  # JSON list
    ai_priority = db.Column(db.String(20))
    ai_category = db.Column(db.String(50))
    ai_summary = db.Column(db.Text)
    vote_count = db.Column(db.Integer, default=0)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    votes = db.relationship('Vote', backref='issue', lazy=True, cascade='all, delete-orphan')
    comments = db.relationship('Comment', backref='issue', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, include_reporter=False):
        images_list = json.loads(self.images) if self.images else []
        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'severity': self.severity,
            'status': self.status,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'area_name': self.area_name,
            'city': self.city,
            'state': self.state,
            'images': images_list,
            'ai_priority': self.ai_priority,
            'ai_category': self.ai_category,
            'ai_summary': self.ai_summary,
            'vote_count': self.vote_count,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'comment_count': len(self.comments)
        }
        if include_reporter and self.reporter:
            data['reporter'] = {'full_name': self.reporter.full_name, 'area_name': self.reporter.area_name}
        return data

class Vote(db.Model):
    __tablename__ = 'votes'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    issue_id = db.Column(db.Integer, db.ForeignKey('issues.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (db.UniqueConstraint('user_id', 'issue_id'),)

class Comment(db.Model):
    __tablename__ = 'comments'
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    issue_id = db.Column(db.Integer, db.ForeignKey('issues.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'user_id': self.user_id,
            'author_name': self.author.full_name if self.author else 'Unknown',
            'issue_id': self.issue_id,
            'created_at': self.created_at.isoformat()
        }

class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50))
    title = db.Column(db.String(200))
    message = db.Column(db.Text)
    issue_id = db.Column(db.Integer, db.ForeignKey('issues.id'))
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'type': self.type, 'title': self.title,
            'message': self.message, 'issue_id': self.issue_id,
            'is_read': self.is_read, 'created_at': self.created_at.isoformat()
        }

def init_db():
    db.create_all()
    # Create default admin
    from werkzeug.security import generate_password_hash
    admin = User.query.filter_by(email='admin@civicconnect.gov').first()
    if not admin:
        admin = User(
            full_name='Municipal Admin',
            email='admin@civicconnect.gov',
            phone='9000000000',
            password_hash=generate_password_hash('admin123'),
            role='admin',
            area_name='City Center',
            city='Vijayawada',
            state='Andhra Pradesh'
        )
        db.session.add(admin)
        db.session.commit()
