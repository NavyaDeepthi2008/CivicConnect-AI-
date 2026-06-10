from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import re

ai_bp = Blueprint('ai', __name__)

SUGGESTIONS_MAP = {
    'pothole': ['Please specify the size of the pothole (small/large).', 'Mention if it is near a school or busy intersection.', 'Note if vehicles have been damaged.'],
    'garbage': ['Mention how long the garbage has been accumulating.', 'Note if there is any foul smell or health hazard.', 'Specify if it is near a residential area.'],
    'water': ['Specify if it is a pipe leak or waterlogging.', 'Mention how long the issue has persisted.', 'Note if it is affecting daily water supply.'],
    'light': ['Mention the exact pole number or landmark.', 'Note if the area is unsafe at night due to this.', 'Specify how many street lights are affected.'],
    'drainage': ['Mention if the drain is blocked or overflowing.', 'Note if it is causing flooding in the road.', 'Specify the location clearly with landmarks.'],
    'traffic': ['Mention the peak hours when congestion is worst.', 'Note if there are any accidents due to this issue.', 'Suggest a possible solution if you have one.'],
}

CHATBOT_RESPONSES = {
    'how': {
        'report': "To report an issue: 1) Go to 'Raise Issue' page 2) Fill in the title and description 3) Upload photos as evidence 4) Confirm your location 5) Submit. Your issue will be reviewed within 24-48 hours.",
        'vote': "You can vote/support an existing issue by clicking the 'Support' button on any issue card or issue detail page. This helps prioritize issues.",
        'track': "You can track your complaints in 'My Issues' on your dashboard. Each issue shows its current status: Pending, Under Review, In Progress, or Resolved.",
    },
    'status': "You can check your complaint status in the Dashboard under 'My Issues'. Statuses include: Pending (received), Under Review (being assessed), In Progress (work started), Resolved (fixed), Rejected (not actionable).",
    'after': "After reporting: 1) Municipal team reviews within 48 hours 2) Issue gets assigned to the right department 3) Work order is created 4) Field team addresses the issue 5) Issue is marked Resolved once fixed.",
    'contact': "For urgent issues, contact your local municipal office directly. For platform support, use the Contact section on the homepage.",
    'priority': "Priority is automatically assigned by AI: High (safety risks, school/hospital areas), Medium (common civic issues), Low (minor cosmetic issues). Higher priority issues get addressed faster.",
    'default': "I'm here to help with CivicConnect! You can ask me: 'How do I report an issue?', 'What is the status process?', 'What happens after reporting?', 'How does voting work?', or 'How is priority assigned?'"
}

def get_chatbot_response(message):
    msg = message.lower()
    if any(w in msg for w in ['report', 'raise', 'submit', 'create', 'add']):
        return CHATBOT_RESPONSES['how']['report']
    if any(w in msg for w in ['vote', 'support', 'upvote']):
        return CHATBOT_RESPONSES['how']['vote']
    if any(w in msg for w in ['track', 'my issue', 'complaint', 'find my']):
        return CHATBOT_RESPONSES['how']['track']
    if any(w in msg for w in ['status', 'progress', 'update']):
        return CHATBOT_RESPONSES['status']
    if any(w in msg for w in ['after', 'what happens', 'next step', 'process']):
        return CHATBOT_RESPONSES['after']
    if any(w in msg for w in ['contact', 'phone', 'email', 'reach']):
        return CHATBOT_RESPONSES['contact']
    if any(w in msg for w in ['priority', 'high', 'urgent', 'emergency']):
        return CHATBOT_RESPONSES['priority']
    return CHATBOT_RESPONSES['default']

@ai_bp.route('/writing-assist', methods=['POST'])
@jwt_required()
def writing_assist():
    data = request.get_json()
    text = data.get('text', '').lower()
    suggestions = []
    missing = []

    for keyword, tips in SUGGESTIONS_MAP.items():
        if keyword in text:
            suggestions.extend(tips[:2])

    if len(text) < 30:
        missing.append('Your description is very short. Please provide more details.')
    if not any(w in text for w in ['near', 'at', 'beside', 'next to', 'opposite', 'in front', 'behind', 'location', 'road', 'street', 'lane']):
        missing.append('Please specify the exact location or nearby landmark.')
    if not any(w in text for w in ['since', 'for', 'days', 'weeks', 'months', 'yesterday', 'today', 'long']):
        missing.append('Mention how long this issue has existed.')

    improved = text.strip().capitalize()
    if not improved.endswith('.'):
        improved += '.'

    return jsonify({
        'suggestions': suggestions[:3],
        'missing_info': missing[:2],
        'improved_text': improved,
        'word_count': len(text.split())
    }), 200

@ai_bp.route('/chatbot', methods=['POST'])
@jwt_required()
def chatbot():
    data = request.get_json()
    message = data.get('message', '')
    if not message:
        return jsonify({'response': CHATBOT_RESPONSES['default']}), 200
    response = get_chatbot_response(message)
    return jsonify({'response': response}), 200

@ai_bp.route('/classify', methods=['POST'])
@jwt_required()
def classify():
    data = request.get_json()
    text = (data.get('title', '') + ' ' + data.get('description', '')).lower()
    if any(w in text for w in ['road', 'pothole', 'traffic', 'street', 'pavement']):
        return jsonify({'category': 'Road Issue', 'icon': '🛣️'}), 200
    if any(w in text for w in ['water', 'pipe', 'leak', 'flood', 'drainage']):
        return jsonify({'category': 'Water Issue', 'icon': '💧'}), 200
    if any(w in text for w in ['garbage', 'waste', 'trash', 'dump', 'sanitation']):
        return jsonify({'category': 'Sanitation Issue', 'icon': '🗑️'}), 200
    if any(w in text for w in ['light', 'electric', 'power', 'electricity']):
        return jsonify({'category': 'Electrical Issue', 'icon': '💡'}), 200
    if any(w in text for w in ['crime', 'safety', 'fire', 'danger']):
        return jsonify({'category': 'Safety Issue', 'icon': '🚨'}), 200
    return jsonify({'category': 'General Issue', 'icon': '📋'}), 200
