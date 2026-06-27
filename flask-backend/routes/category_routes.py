from flask import Blueprint, request, jsonify
from models import db, Category
from middleware.auth import protect, admin_required

category_bp = Blueprint('categories', __name__)


# GET /api/categories
@category_bp.route('/', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    return jsonify([c.to_dict() for c in categories])


# GET /api/categories/:id
@category_bp.route('/<int:category_id>', methods=['GET'])
def get_category(category_id):
    category = db.session.get(Category, category_id)
    if not category:
        return jsonify({'message': 'Category not found'}), 404
    return jsonify(category.to_dict())


# POST /api/categories
@category_bp.route('/', methods=['POST'])
@admin_required
def create_category(current_user):
    data = request.get_json()
    name = data.get('name', '')
    if Category.query.filter_by(name=name).first():
        return jsonify({'message': 'Category already exists'}), 400

    category = Category(
        name=name,
        description=data.get('description', ''),
        image=data.get('image', '/images/placeholder-category.jpg'),
    )
    db.session.add(category)
    db.session.commit()
    return jsonify(category.to_dict()), 201


# PUT /api/categories/:id
@category_bp.route('/<int:category_id>', methods=['PUT'])
@admin_required
def update_category(category_id, current_user):
    category = db.session.get(Category, category_id)
    if not category:
        return jsonify({'message': 'Category not found'}), 404

    data = request.get_json()
    category.name = data.get('name', category.name)
    category.description = data.get('description', category.description)
    category.image = data.get('image', category.image)

    db.session.commit()
    return jsonify(category.to_dict())


# DELETE /api/categories/:id
@category_bp.route('/<int:category_id>', methods=['DELETE'])
@admin_required
def delete_category(category_id, current_user):
    category = db.session.get(Category, category_id)
    if not category:
        return jsonify({'message': 'Category not found'}), 404
    db.session.delete(category)
    db.session.commit()
    return jsonify({'message': 'Category removed'})
