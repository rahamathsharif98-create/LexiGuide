"""Alembic migration for Phase 1: child_interests, child_comfort_preferences, child_language_profiles, child_learning_profiles."""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = 'phase1_child_personalization'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'child_interests',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('student_id', sa.Integer(), sa.ForeignKey('students.id', ondelete='CASCADE'), nullable=False, unique=True, index=True),
        sa.Column('interest_categories', sa.JSON(), nullable=False),
        sa.Column('favorite_color', sa.String(50), nullable=True),
        sa.Column('favorite_animal', sa.String(50), nullable=True),
        sa.Column('favorite_character', sa.String(50), nullable=True),
        sa.Column('favorite_music_style', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now(), nullable=True),
    )

    op.create_table(
        'child_comfort_preferences',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('student_id', sa.Integer(), sa.ForeignKey('students.id', ondelete='CASCADE'), nullable=False, unique=True, index=True),
        sa.Column('font_family', sa.String(50), nullable=False, server_default='default'),
        sa.Column('text_size', sa.String(20), nullable=False, server_default='large'),
        sa.Column('letter_spacing', sa.String(20), nullable=False, server_default='wide'),
        sa.Column('line_spacing', sa.String(20), nullable=False, server_default='relaxed'),
        sa.Column('theme_contrast', sa.String(30), nullable=False, server_default='soft-pastel'),
        sa.Column('motion_level', sa.String(20), nullable=False, server_default='gentle'),
        sa.Column('music_enabled', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('music_volume', sa.Float(), nullable=False, server_default='0.6'),
        sa.Column('voice_volume', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('voice_speed', sa.Float(), nullable=False, server_default='0.85'),
        sa.Column('sfx_volume', sa.Float(), nullable=False, server_default='0.7'),
        sa.Column('quiet_mode', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('audio_ducking_enabled', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now(), nullable=True),
    )

    op.create_table(
        'child_language_profiles',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('student_id', sa.Integer(), sa.ForeignKey('students.id', ondelete='CASCADE'), nullable=False, unique=True, index=True),
        sa.Column('mother_tongue', sa.String(10), nullable=False, server_default='en'),
        sa.Column('support_language', sa.String(10), nullable=False, server_default='en'),
        sa.Column('target_learning_language', sa.String(10), nullable=False, server_default='en'),
        sa.Column('interface_language', sa.String(10), nullable=False, server_default='en'),
        sa.Column('enabled_languages', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now(), nullable=True),
    )

    op.create_table(
        'child_learning_profiles',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('student_id', sa.Integer(), sa.ForeignKey('students.id', ondelete='CASCADE'), nullable=False, unique=True, index=True),
        sa.Column('phonological_accuracy', sa.Float(), nullable=False, server_default='70.0'),
        sa.Column('word_recognition_rate', sa.Float(), nullable=False, server_default='70.0'),
        sa.Column('reading_fluency_score', sa.Float(), nullable=False, server_default='65.0'),
        sa.Column('pronunciation_clarity', sa.Float(), nullable=False, server_default='75.0'),
        sa.Column('comprehension_index', sa.Float(), nullable=False, server_default='75.0'),
        sa.Column('repetition_need_level', sa.String(20), nullable=False, server_default='moderate'),
        sa.Column('hint_dependency_rate', sa.Float(), nullable=False, server_default='0.2'),
        sa.Column('pacing_preference', sa.String(20), nullable=False, server_default='unhurried'),
        sa.Column('total_sessions_completed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_evidence_timestamp', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now(), nullable=True),
    )

def downgrade() -> None:
    op.drop_table('child_learning_profiles')
    op.drop_table('child_language_profiles')
    op.drop_table('child_comfort_preferences')
    op.drop_table('child_interests')
