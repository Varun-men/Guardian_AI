from alembic import op
import sqlalchemy as sa

revision = 'b7c1d2e3f4a5'
down_revision = 'ea92a63914bc'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'refresh_tokens',
        sa.Column('id', sa.String(100), nullable=False),
        sa.Column('user_id', sa.String(100), nullable=False),
        sa.Column('token_hash', sa.String(64), nullable=False),
        sa.Column('csrf_hash', sa.String(64), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('replaced_by', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token_hash')
    )
    op.create_index(
        'ix_refresh_tokens_user_id',
        'refresh_tokens',
        ['user_id']
    )


def downgrade():
    op.drop_index('ix_refresh_tokens_user_id', table_name='refresh_tokens')
    op.drop_table('refresh_tokens')
