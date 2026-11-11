from alembic import op
import sqlalchemy as sa

revision = 'ea92a63914bc'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('findings') as batch_op:
        batch_op.add_column(
            sa.Column('assigned_reviewer_id', sa.String(100), nullable=True)
        )
        batch_op.create_foreign_key(
            'fk_findings_assigned_reviewer_id_users',
            'users',
            ['assigned_reviewer_id'],
            ['id']
        )

    with op.batch_alter_table('reviews') as batch_op:
        batch_op.add_column(
            sa.Column('assigned_reviewer_id', sa.String(100), nullable=True)
        )
        batch_op.create_foreign_key(
            'fk_reviews_assigned_reviewer_id_users',
            'users',
            ['assigned_reviewer_id'],
            ['id']
        )


def downgrade():
    with op.batch_alter_table('reviews') as batch_op:
        batch_op.drop_constraint(
            'fk_reviews_assigned_reviewer_id_users',
            type_='foreignkey'
        )
        batch_op.drop_column('assigned_reviewer_id')

    with op.batch_alter_table('findings') as batch_op:
        batch_op.drop_constraint(
            'fk_findings_assigned_reviewer_id_users',
            type_='foreignkey'
        )
        batch_op.drop_column('assigned_reviewer_id')
