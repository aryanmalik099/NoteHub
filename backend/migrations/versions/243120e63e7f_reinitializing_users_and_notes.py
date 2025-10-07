"""Reinitializing users and notes (idempotent)

Revision ID: 243120e63e7f
Revises: b584aac013f2
Create Date: 2025-09-30 19:51:57.917581

This migration was updated to be idempotent: it only creates tables if they
don't already exist, and adds missing columns when needed. This avoids
DuplicateTable errors when prior migrations already created the same tables.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '243120e63e7f'
down_revision = 'b584aac013f2'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    insp = sa.inspect(bind)

    # users table
    if not insp.has_table('users'):
        op.create_table(
            'users',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('username', sa.String(length=80), nullable=False),
            sa.Column('email', sa.String(length=120), nullable=False),
            sa.Column('password_hash', sa.String(length=255), nullable=False),
            sa.Column('role', sa.String(length=20), nullable=False),
            sa.Column('moderated_department_id', sa.Integer(), nullable=True),
            sa.Column('reset_token', sa.String(length=100), nullable=True),
            sa.Column('reset_token_expiration', sa.DateTime(), nullable=True),
            sa.UniqueConstraint('email'),
            sa.UniqueConstraint('username'),
        )
    else:
        existing_cols = {c['name'] for c in insp.get_columns('users')}
        # Add only the columns that are missing; constraints likely already exist
        with op.batch_alter_table('users') as batch_op:
            if 'moderated_department_id' not in existing_cols:
                batch_op.add_column(sa.Column('moderated_department_id', sa.Integer(), nullable=True))
            if 'reset_token' not in existing_cols:
                batch_op.add_column(sa.Column('reset_token', sa.String(length=100), nullable=True))
            if 'reset_token_expiration' not in existing_cols:
                batch_op.add_column(sa.Column('reset_token_expiration', sa.DateTime(), nullable=True))

    # notes table
    if not insp.has_table('notes'):
        op.create_table(
            'notes',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('title', sa.String(length=100), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('file_url', sa.String(length=255), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('subject', sa.String(length=100), nullable=False),
            sa.Column('professor', sa.String(length=100), nullable=True),
            sa.Column('semester', sa.Integer(), nullable=False),
            sa.Column('academic_year', sa.String(length=100), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        )
    else:
        existing_cols = {c['name'] for c in insp.get_columns('notes')}
        with op.batch_alter_table('notes') as batch_op:
            # Ensure key columns exist; earlier migrations may already have them
            if 'professor' not in existing_cols:
                batch_op.add_column(sa.Column('professor', sa.String(length=100), nullable=True))
            if 'academic_year' not in existing_cols:
                batch_op.add_column(sa.Column('academic_year', sa.String(length=100), nullable=False))
            if 'created_at' not in existing_cols:
                batch_op.add_column(sa.Column('created_at', sa.DateTime(), nullable=False))


def downgrade():
    # Drop tables only if they exist
    op.execute("DROP TABLE IF EXISTS notes CASCADE")
    op.execute("DROP TABLE IF EXISTS users CASCADE")
